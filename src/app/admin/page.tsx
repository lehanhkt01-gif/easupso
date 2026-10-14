import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, OrgCode, ArticleStatus } from '@prisma/client';
import { AdminDashboardClient } from './AdminDashboardClient';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';
import { getLocalSiteSetting } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerAuthSession();

  // Kiểm tra quyền: Người chưa đăng nhập hoặc cử tri PUBLIC bị chuyển hướng
  if (!session?.user?.id || session.user.role === Role.PUBLIC) {
    redirect('/login');
  }

  const isExecutiveOrSuper =
    session.user.role === Role.EXECUTIVE || session.user.role === Role.SUPER_ADMIN;

  // Dữ liệu dự phòng khi CSDL chưa kết nối
  const fallbackCategories = [
    { id: 'cat-mttq', name: 'Ủy ban MTTQ xã', orgCode: OrgCode.MTTQ, slug: 'mat-tran-to-quoc' },
    { id: 'cat-phunu', name: 'Hội LH Phụ nữ', orgCode: OrgCode.PHU_NU, slug: 'phu-nu' },
    { id: 'cat-nongdan', name: 'Hội Nông dân', orgCode: OrgCode.NONG_DAN, slug: 'nong-dan' },
    { id: 'cat-doantn', name: 'Đoàn Thanh niên', orgCode: OrgCode.DOAN_TN, slug: 'doan-thanh-nien' },
    { id: 'cat-ccb', name: 'Hội Cựu chiến binh', orgCode: OrgCode.CCB, slug: 'cuu-chien-binh' },
    { id: 'cat-thonbuon', name: 'Hoạt động 20 Thôn, Buôn', orgCode: OrgCode.THON_BUON, slug: 'thon-buon' },
    { id: 'cat-cds', name: 'Chuyển đổi số & Học vụ số', orgCode: OrgCode.MTTQ, slug: 'chuyen-doi-so' },
  ];

  const fallbackUsers = [
    {
      id: 'root-admin-lehanh',
      name: 'Lê Hạnh (Quản trị viên Cấp cao)',
      email: 'lehanhkt01@gmail.com',
      image: null,
      role: Role.SUPER_ADMIN,
      orgCode: OrgCode.MTTQ,
      positionTitle: 'Quản trị viên Hệ thống Cấp cao (Super Admin)',
      villageId: null,
      villageName: null,
      isActive: true,
      hasPassword: true,
      isRootAdmin: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-lehonghanh',
      name: 'Lê Hồng Hạnh',
      email: 'lehonghanh@easupso.com',
      image: null,
      role: Role.EXECUTIVE,
      orgCode: OrgCode.MTTQ,
      positionTitle: 'Ủy viên BTV Đảng ủy, Bí thư Chi bộ, Chủ tịch UBMTTQ Việt Nam xã Ea Súp',
      villageId: null,
      villageName: null,
      isActive: true,
      hasPassword: true,
      isRootAdmin: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-mien',
      name: 'Nguyễn Thị Miên',
      email: 'Nguyenthimien3@gmail.com',
      image: null,
      role: Role.SPECIALIST,
      orgCode: OrgCode.NONG_DAN,
      positionTitle: 'UVBCH Đảng bộ xã, PCT Thường trực UBMTTQ, Chủ tịch Hội Nông dân xã',
      villageId: null,
      villageName: null,
      isActive: true,
      hasPassword: false,
      isRootAdmin: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-thon1',
      name: 'Nguyễn Văn Hải',
      email: 'truongthon1@easupso.com',
      image: null,
      role: Role.VILLAGE_LEADER,
      orgCode: OrgCode.THON_BUON,
      positionTitle: 'Trưởng Thôn 1 xã Ea Súp',
      villageId: 'THON_01',
      villageName: 'Thôn 1',
      isActive: true,
      hasPassword: true,
      isRootAdmin: false,
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    // Lấy danh mục chuyên mục tin
    const categories = await prisma.newsCategory.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    // Lấy danh sách bài viết theo thẩm quyền ABAC
    let articlesWhere: any = {};
    if (!isExecutiveOrSuper) {
      if (session.user.role === Role.VILLAGE_LEADER && session.user.villageId) {
        articlesWhere = {
          OR: [{ villageId: session.user.villageId }, { authorId: session.user.id }],
        };
      } else if (session.user.role === Role.SPECIALIST && session.user.orgCode) {
        articlesWhere = {
          OR: [{ orgCode: session.user.orgCode }, { authorId: session.user.id }],
        };
      } else {
        articlesWhere = { authorId: session.user.id };
      }
    }

    const [myArticles, pendingArticles, auditLogs, quickAnnouncements, currentHeroSetting, initialUsers] =
      await Promise.all([
        prisma.newsArticle.findMany({
          where: articlesWhere,
          include: {
            category: { select: { name: true } },
            village: { select: { name: true } },
            author: { select: { name: true, email: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        }),

        // Bài viết chờ duyệt (Chỉ Lãnh đạo UBMTTQ xã mới cần duyệt)
        isExecutiveOrSuper
          ? prisma.newsArticle.findMany({
              where: { status: ArticleStatus.PENDING_APPROVAL },
              include: {
                category: { select: { name: true } },
                village: { select: { name: true } },
                author: { select: { name: true, email: true, positionTitle: true } },
              },
              orderBy: { createdAt: 'desc' },
            })
          : Promise.resolve([]),

        // Nhật ký kiểm toán gần nhất
        isExecutiveOrSuper
          ? prisma.auditLog.findMany({
              orderBy: { createdAt: 'desc' },
              take: 15,
            })
          : Promise.resolve([]),

        // Thông báo điều hành Ticker
        isExecutiveOrSuper
          ? prisma.quickAnnouncement.findMany({
              orderBy: { createdAt: 'desc' },
              take: 10,
            })
          : Promise.resolve([]),

        // Cấu hình ảnh bìa website hiện tại
        isExecutiveOrSuper
          ? prisma.siteSetting.findUnique({
              where: { key: 'HERO_BANNER_IMAGE_URL' },
            })
          : Promise.resolve(null),

        // Danh sách tài khoản quản lý (Dành cho Lãnh đạo MTTQ & Super Admin)
        isExecutiveOrSuper
          ? prisma.user.findMany({
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                orgCode: true,
                positionTitle: true,
                villageId: true,
                isActive: true,
                passwordHash: true,
                createdAt: true,
                village: { select: { id: true, name: true, code: true } },
              },
              orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
            })
          : Promise.resolve([]),
      ]);

    const sanitizedUsers = initialUsers.map((u: any) => ({
      id: u.id,
      name: u.name || 'Chưa đặt tên',
      email: u.email,
      image: u.image,
      role: u.role,
      orgCode: u.orgCode,
      positionTitle: u.positionTitle,
      villageId: u.villageId,
      villageName: u.village?.name || null,
      isActive: u.isActive,
      hasPassword: !!u.passwordHash,
      isRootAdmin: u.email?.toLowerCase() === 'lehanhkt01@gmail.com',
      createdAt: u.createdAt,
    }));

    const localHero = await getLocalSiteSetting('HERO_BANNER_IMAGE_URL');

    return (
      <AdminDashboardClient
        user={session.user}
        categories={categories.length > 0 ? categories : fallbackCategories}
        villages={EA_SUP_VILLAGES}
        initialArticles={myArticles}
        pendingArticles={pendingArticles}
        auditLogs={auditLogs}
        quickAnnouncements={quickAnnouncements}
        currentHeroImage={currentHeroSetting?.value || localHero || null}
        initialUsers={sanitizedUsers.length > 0 ? sanitizedUsers : fallbackUsers}
      />
    );
  } catch (err) {
    console.warn('[ADMIN_PAGE_DB_WARN] Không kết nối được CSDL, sử dụng bộ dữ liệu dự phòng an toàn:', err);
    const localHero = await getLocalSiteSetting('HERO_BANNER_IMAGE_URL');
    return (
      <AdminDashboardClient
        user={session.user}
        categories={fallbackCategories}
        villages={EA_SUP_VILLAGES}
        initialArticles={[]}
        pendingArticles={[]}
        auditLogs={[]}
        quickAnnouncements={[]}
        currentHeroImage={localHero || null}
        initialUsers={fallbackUsers}
      />
    );
  }
}

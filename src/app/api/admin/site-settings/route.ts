import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';
import { getLocalSiteSetting, setLocalSiteSetting } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/site-settings
 * Lấy danh sách cấu hình giao diện hệ thống
 */
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.warn('[SITE_SETTINGS_GET_WARN] Đọc từ file cấu hình cục bộ.');
    const heroImage = await getLocalSiteSetting('HERO_BANNER_IMAGE_URL');
    return NextResponse.json({
      success: true,
      data: [{ key: 'HERO_BANNER_IMAGE_URL', value: heroImage }],
    });
  }
}

/**
 * POST /api/admin/site-settings
 * Cập nhật cấu hình giao diện (Ảnh bìa Hero Banner, tiêu đề...)
 * Chỉ cho phép EXECUTIVE (Chủ tịch UBMTTQ xã) hoặc SUPER_ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    if (session.user.role !== Role.EXECUTIVE && session.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Lãnh đạo UBMTTQ xã hoặc Quản trị viên mới có quyền đổi ảnh bìa website.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, value, description } = body;

    if (!key || typeof value !== 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu key hoặc giá trị cấu hình.' }, { status: 400 });
    }

    const trimmedValue = value.trim();

    // 1. Luôn lưu vào file JSON cục bộ đảm bảo bền vững 100%
    await setLocalSiteSetting(key, trimmedValue);

    // 2. Đồng bộ vào CSDL PostgreSQL nếu khả dụng
    let dbSetting: any = null;
    try {
      // Kiểm tra xem user có tồn tại trong CSDL không để tránh lỗi Foreign Key
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      const updatedById = userExists ? session.user.id : null;

      dbSetting = await prisma.siteSetting.upsert({
        where: { key },
        update: {
          value: trimmedValue,
          description: description || undefined,
          ...(updatedById ? { updatedById } : {}),
        },
        create: {
          key,
          value: trimmedValue,
          description: description || undefined,
          ...(updatedById ? { updatedById } : {}),
        },
      });

      // Ghi nhật ký kiểm toán nếu DB sẵn sàng
      try {
        await writeAuditLog({
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'UPDATE',
          targetTable: 'site_settings',
          targetId: dbSetting.id,
          newData: { key, value: trimmedValue },
          req,
        });
      } catch (auditErr) {
        console.warn('[AUDIT_LOG_WARN] Bỏ qua lỗi ghi audit log khi lưu site setting:', auditErr);
      }
    } catch (dbError) {
      console.warn('[SITE_SETTINGS_DB_WARN] CSDL chưa kết nối, đã lưu vào file cấu hình cục bộ:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật ảnh bìa website thành công!',
      data: dbSetting || { key, value: trimmedValue },
    });
  } catch (error: any) {
    console.error('[SITE_SETTINGS_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi cập nhật cấu hình hệ thống.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canUpdateArticle, canDeleteArticle, canApproveArticle } from '@/lib/permissions';
import { sanitizeHtml, sanitizePlainText } from '@/lib/sanitize';
import { writeAuditLog } from '@/lib/audit';
import { ArticleStatus, OrgCode, Role } from '@prisma/client';
import { bundleContentWithGallery, extractGalleryImages } from '@/lib/news-gallery';
import { getLocalArticleById, updateLocalArticle, deleteLocalArticle, DEFAULT_LOCAL_CATEGORIES } from '@/lib/local-news';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/news/[id]
 * Cập nhật hoặc phê duyệt xuất bản bản tin (Chống IDOR & kiểm tra quyền chặt chẽ)
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;

    // Tìm trong DB hoặc local file
    let existing: any = null;
    try {
      existing = await prisma.newsArticle.findUnique({ where: { id } });
    } catch {}

    if (!existing) {
      existing = await getLocalArticleById(id);
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Bản tin không tồn tại.' }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      summary,
      contentHtml,
      categoryId,
      villageId,
      orgCode,
      beneficiaryName,
      thumbnailUrl,
      images,
      isFeatured,
      status,
    } = body;

    // 1. Kiểm tra thẩm quyền sửa theo ma trận ABAC
    const permission = canUpdateArticle(session.user, existing, {
      status,
      orgCode,
      villageId,
    });

    if (!permission.allowed) {
      return NextResponse.json({ success: false, error: permission.reason }, { status: 403 });
    }

    // 2. Kiểm tra nghiệp vụ phê duyệt xuất bản
    const isApproving = status === ArticleStatus.PUBLISHED && existing.status !== ArticleStatus.PUBLISHED;
    if (isApproving && !canApproveArticle(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Lãnh đạo UBMTTQ xã (Tổng biên tập) mới có quyền duyệt xuất bản.' },
        { status: 403 }
      );
    }

    // 3. Khử trùng dữ liệu
    const updatePayload: Record<string, unknown> = {};
    if (title !== undefined) updatePayload.title = sanitizePlainText(title);
    if (summary !== undefined) updatePayload.summary = sanitizePlainText(summary);

    // Chuyên mục
    let matchedCat: any = null;
    if (categoryId !== undefined) {
      try {
        matchedCat = await prisma.newsCategory.findFirst({
          where: {
            OR: [
              { id: categoryId },
              { slug: categoryId },
              { orgCode: (orgCode as OrgCode) || existing.orgCode },
            ],
          },
        });
      } catch {}
      if (matchedCat) {
        updatePayload.categoryId = matchedCat.id;
        updatePayload.orgCode = matchedCat.orgCode;
      } else {
        const localCat = DEFAULT_LOCAL_CATEGORIES.find((c) => c.id === categoryId || c.slug === categoryId || c.orgCode === orgCode);
        if (localCat) {
          updatePayload.categoryId = localCat.id;
          updatePayload.orgCode = localCat.orgCode;
        }
      }
    } else if (orgCode !== undefined) {
      updatePayload.orgCode = orgCode;
    }

    // Thôn buôn
    if (villageId !== undefined) {
      if (!villageId) {
        updatePayload.villageId = null;
      } else {
        const vMatch = EA_SUP_VILLAGES.find((v) => v.id === villageId || v.code === villageId);
        const searchCode = vMatch ? vMatch.code : villageId;
        try {
          const dbVillage = await prisma.village.findFirst({
            where: { OR: [{ id: villageId }, { code: searchCode }] },
          });
          updatePayload.villageId = dbVillage ? dbVillage.id : null;
        } catch {
          updatePayload.villageId = searchCode;
        }
      }
    }

    if (beneficiaryName !== undefined) updatePayload.beneficiaryName = beneficiaryName ? sanitizePlainText(beneficiaryName) : null;
    if (thumbnailUrl !== undefined) updatePayload.thumbnailUrl = thumbnailUrl;
    if (isFeatured !== undefined) updatePayload.isFeatured = Boolean(isFeatured);

    // Xử lý nội dung kết hợp album ảnh
    let targetImages = images;
    if (contentHtml !== undefined || images !== undefined) {
      const existingImages = extractGalleryImages(existing.contentHtml, existing.thumbnailUrl);
      targetImages = images !== undefined ? (Array.isArray(images) ? images : []) : existingImages;
      const baseHtml = contentHtml !== undefined ? sanitizeHtml(contentHtml) : existing.contentHtml;
      updatePayload.contentHtml = bundleContentWithGallery(baseHtml, targetImages);

      if (!thumbnailUrl && targetImages.length > 0) {
        updatePayload.thumbnailUrl = targetImages[0];
      }
    }

    if (status !== undefined) {
      updatePayload.status = status;
      if (isApproving) {
        updatePayload.publishedAt = existing.publishedAt || new Date();
      }
    }

    // 4. Cập nhật vào DB nếu khả dụng
    let updatedDb: any = null;
    try {
      // Tìm tác giả / người duyệt hợp lệ
      let approverUser = null;
      if (session.user.id && session.user.id !== 'root-admin-lehanh') {
        approverUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      }
      if (!approverUser && session.user.email) {
        approverUser = await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase().trim() },
        });
      }
      if (isApproving && approverUser) {
        updatePayload.approvedById = approverUser.id;
      }

      updatedDb = await prisma.newsArticle.update({
        where: { id },
        data: updatePayload,
        include: {
          category: { select: { id: true, name: true, slug: true, badgeColor: true } },
          village: { select: { id: true, name: true, code: true } },
          author: { select: { name: true, email: true, positionTitle: true } },
          approvedBy: { select: { name: true } },
        },
      });

      await writeAuditLog({
        userId: approverUser?.id || session.user.id,
        userEmail: session.user.email,
        action: isApproving ? 'APPROVE' : 'UPDATE',
        targetTable: 'news_articles',
        targetId: id,
        oldData: { title: existing.title, status: existing.status },
        newData: { title: updatedDb.title, status: updatedDb.status },
        req,
      });
    } catch (err: any) {
      console.warn('[API_ADMIN_NEWS_PATCH_DB_WARN] Cập nhật CSDL thất bại, đồng bộ file cục bộ:', err?.message);
    }

    // 5. Luôn cập nhật kho lưu trữ cục bộ
    const updatedLocal = await updateLocalArticle(id, {
      ...(title !== undefined ? { title: String(updatePayload.title) } : {}),
      ...(summary !== undefined ? { summary: String(updatePayload.summary) } : {}),
      ...(updatePayload.contentHtml !== undefined ? { contentHtml: String(updatePayload.contentHtml) } : {}),
      ...(updatePayload.thumbnailUrl !== undefined ? { thumbnailUrl: updatePayload.thumbnailUrl as string | null } : {}),
      ...(targetImages !== undefined ? { images: targetImages } : {}),
      ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
      ...(status !== undefined ? { status: status as ArticleStatus } : {}),
      ...(updatePayload.categoryId ? { categoryId: String(updatePayload.categoryId) } : {}),
      ...(updatePayload.villageId !== undefined ? { villageId: updatePayload.villageId as string | null } : {}),
      ...(updatePayload.orgCode ? { orgCode: updatePayload.orgCode as OrgCode } : {}),
      ...(beneficiaryName !== undefined ? { beneficiaryName: beneficiaryName ? sanitizePlainText(beneficiaryName) : null } : {}),
    });

    const finalResult = updatedDb
      ? { ...updatedDb, images: extractGalleryImages(updatedDb.contentHtml, updatedDb.thumbnailUrl) }
      : updatedLocal;

    return NextResponse.json({
      success: true,
      data: finalResult,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_NEWS_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: error?.message || 'Lỗi khi cập nhật bản tin.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/news/[id]
 * Xóa bản tin có kiểm soát quyền hạn và lưu vết kiểm toán
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;

    let existing: any = null;
    try {
      existing = await prisma.newsArticle.findUnique({ where: { id } });
    } catch {}

    if (!existing) {
      existing = await getLocalArticleById(id);
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Bản tin không tồn tại.' }, { status: 404 });
    }

    // Kiểm tra quyền xóa
    const deletePerm = canDeleteArticle(session.user, existing);
    if (!deletePerm.allowed) {
      return NextResponse.json({ success: false, error: deletePerm.reason }, { status: 403 });
    }

    try {
      await prisma.newsArticle.delete({ where: { id } });
      await writeAuditLog({
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'DELETE',
        targetTable: 'news_articles',
        targetId: id,
        oldData: { title: existing.title, slug: existing.slug, status: existing.status },
        req,
      });
    } catch (err: any) {
      console.warn('[API_ADMIN_NEWS_DELETE_DB_WARN] Xóa CSDL không khả dụng, xóa file cục bộ:', err?.message);
    }

    await deleteLocalArticle(id);
    return NextResponse.json({ success: true, message: 'Đã xóa bản tin thành công.' });
  } catch (error: any) {
    console.error('[API_ADMIN_NEWS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: error?.message || 'Không thể xóa bản tin.' }, { status: 500 });
  }
}

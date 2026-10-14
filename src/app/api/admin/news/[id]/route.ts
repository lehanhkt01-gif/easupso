import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canUpdateArticle, canDeleteArticle, canApproveArticle } from '@/lib/permissions';
import { sanitizeHtml, sanitizePlainText } from '@/lib/sanitize';
import { writeAuditLog } from '@/lib/audit';
import { ArticleStatus, Role } from '@prisma/client';
import { bundleContentWithGallery, extractGalleryImages } from '@/lib/news-gallery';

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
    const existing = await prisma.newsArticle.findUnique({
      where: { id },
    });

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
    if (categoryId !== undefined) updatePayload.categoryId = categoryId;
    if (villageId !== undefined) updatePayload.villageId = villageId || null;
    if (orgCode !== undefined) updatePayload.orgCode = orgCode;
    if (beneficiaryName !== undefined) updatePayload.beneficiaryName = beneficiaryName ? sanitizePlainText(beneficiaryName) : null;
    if (thumbnailUrl !== undefined) updatePayload.thumbnailUrl = thumbnailUrl;
    if (isFeatured !== undefined) updatePayload.isFeatured = Boolean(isFeatured);

    // Xử lý nội dung kết hợp album ảnh
    if (contentHtml !== undefined || images !== undefined) {
      const existingImages = extractGalleryImages(existing.contentHtml, existing.thumbnailUrl);
      const targetImages = images !== undefined ? (Array.isArray(images) ? images : []) : existingImages;
      const baseHtml = contentHtml !== undefined ? sanitizeHtml(contentHtml) : existing.contentHtml;
      updatePayload.contentHtml = bundleContentWithGallery(baseHtml, targetImages);

      if (!thumbnailUrl && targetImages.length > 0) {
        updatePayload.thumbnailUrl = targetImages[0];
      }
    }

    if (status !== undefined) {
      updatePayload.status = status;
      if (isApproving) {
        updatePayload.approvedById = session.user.id;
        updatePayload.publishedAt = existing.publishedAt || new Date();
      }
    }

    // 4. Cập nhật vào DB
    const updated = await prisma.newsArticle.update({
      where: { id },
      data: updatePayload,
      include: {
        category: { select: { id: true, name: true, slug: true, badgeColor: true } },
        village: { select: { id: true, name: true, code: true } },
        author: { select: { name: true, email: true, positionTitle: true } },
        approvedBy: { select: { name: true } },
      },
    });

    // 5. Ghi nhật ký kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: isApproving ? 'APPROVE' : 'UPDATE',
      targetTable: 'news_articles',
      targetId: id,
      oldData: { title: existing.title, status: existing.status },
      newData: { title: updated.title, status: updated.status },
      req,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        images: extractGalleryImages(updated.contentHtml, updated.thumbnailUrl),
      },
    });
  } catch (error) {
    console.error('[API_ADMIN_NEWS_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật bản tin.' }, { status: 500 });
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
    const existing = await prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Bản tin không tồn tại.' }, { status: 404 });
    }

    // Kiểm tra quyền xóa
    const deletePerm = canDeleteArticle(session.user, existing);
    if (!deletePerm.allowed) {
      return NextResponse.json({ success: false, error: deletePerm.reason }, { status: 403 });
    }

    await prisma.newsArticle.delete({
      where: { id },
    });

    // Ghi nhật ký kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'DELETE',
      targetTable: 'news_articles',
      targetId: id,
      oldData: { title: existing.title, slug: existing.slug, status: existing.status },
      req,
    });

    return NextResponse.json({ success: true, message: 'Đã xóa bản tin thành công.' });
  } catch (error) {
    console.error('[API_ADMIN_NEWS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Không thể xóa bản tin.' }, { status: 500 });
  }
}

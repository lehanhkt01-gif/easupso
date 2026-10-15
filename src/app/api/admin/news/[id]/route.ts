import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canUpdateArticle, canDeleteArticle, canApproveArticle } from '@/lib/permissions';
import { sanitizeHtml, sanitizePlainText } from '@/lib/sanitize';
import { writeAuditLog } from '@/lib/audit';
import { ArticleStatus, OrgCode, Role } from '@prisma/client';
import { bundleContentWithGallery, extractGalleryImages } from '@/lib/news-gallery';
import {
  getLocalArticleById,
  getLocalArticleBySlug,
  updateLocalArticle,
  deleteLocalArticle,
  saveLocalArticle,
  DEFAULT_LOCAL_CATEGORIES,
} from '@/lib/local-news';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/news/[id]
 * Cập nhật hoặc phê duyệt xuất bản bản tin (Chống IDOR, đồng bộ vững chắc PostgreSQL & Local Store)
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;

    // Tìm trong DB hoặc local file (hỗ trợ cả id lẫn slug)
    let existing: any = null;
    try {
      existing = await prisma.newsArticle.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: {
          category: true,
          village: true,
        },
      });
    } catch (err: any) {
      console.warn('[API_ADMIN_NEWS_PATCH_FIND_WARN]', err?.message);
    }

    if (!existing) {
      existing = (await getLocalArticleById(id)) || (await getLocalArticleBySlug(id));
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Bản tin không tồn tại hoặc đã bị xóa.' }, { status: 404 });
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

    // Chuyên mục: Khớp an toàn vào DB CSDL
    let matchedCat: any = null;
    if (categoryId !== undefined || orgCode !== undefined) {
      try {
        matchedCat = await prisma.newsCategory.findFirst({
          where: {
            OR: [
              ...(categoryId ? [{ id: categoryId }, { slug: categoryId }] : []),
              ...(orgCode ? [{ orgCode: orgCode as OrgCode }] : []),
              ...(existing.orgCode ? [{ orgCode: existing.orgCode as OrgCode }] : []),
            ],
          },
        });
      } catch {}

      if (!matchedCat) {
        try {
          matchedCat =
            (await prisma.newsCategory.findFirst({
              where: { orgCode: (orgCode as OrgCode) || existing.orgCode || OrgCode.MTTQ },
            })) || (await prisma.newsCategory.findFirst());
        } catch {}
      }

      if (matchedCat) {
        updatePayload.categoryId = matchedCat.id;
        updatePayload.orgCode = matchedCat.orgCode;
      }
    }

    // Thôn buôn: Khớp ID CSDL, tuyệt đối không chèn sai khóa ngoại
    if (villageId !== undefined) {
      if (!villageId) {
        updatePayload.villageId = null;
      } else {
        const foundVillage = EA_SUP_VILLAGES.find((v) => v.id === villageId || v.code === villageId);
        const searchCode = foundVillage ? foundVillage.code : villageId;
        try {
          const dbVillage = await prisma.village.findFirst({
            where: {
              OR: [{ id: villageId }, { code: searchCode }, { code: villageId }],
            },
          });
          updatePayload.villageId = dbVillage ? dbVillage.id : null;
        } catch {
          updatePayload.villageId = null;
        }
      }
    }

    if (beneficiaryName !== undefined) {
      updatePayload.beneficiaryName = beneficiaryName ? sanitizePlainText(beneficiaryName) : null;
    }
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

    // 4. Tìm tác giả / người duyệt hợp lệ trong CSDL
    let approverUser: any = null;
    if (session.user.id && session.user.id !== 'root-admin-lehanh') {
      try {
        approverUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      } catch {}
    }
    if (!approverUser && session.user.email) {
      try {
        approverUser = await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase().trim() },
        });
      } catch {}
    }
    if (isApproving && approverUser) {
      updatePayload.approvedById = approverUser.id;
    }

    // 5. CẬP NHẬT VÀO CSDL POSTGRESQL (TỰ ĐỘNG CHUYỂN BÀI VÀO DB NẾU BAN ĐẦU CHỈ CÓ TRONG LOCAL STORE)
    let updatedDb: any = null;
    try {
      const dbArticle = await prisma.newsArticle.findFirst({
        where: { OR: [{ id }, { slug: id }, { slug: existing.slug }] },
      });

      if (dbArticle) {
        updatedDb = await prisma.newsArticle.update({
          where: { id: dbArticle.id },
          data: updatePayload,
          include: {
            category: { select: { id: true, name: true, slug: true, badgeColor: true } },
            village: { select: { id: true, name: true, code: true } },
            author: { select: { name: true, email: true, positionTitle: true } },
            approvedBy: { select: { name: true } },
          },
        });
      } else {
        // Bài viết này chưa có trong CSDL PostgreSQL -> Tự động nạp vào PostgreSQL
        let authorUser = approverUser;
        if (!authorUser) {
          authorUser = await prisma.user.findFirst({ where: { isActive: true } });
        }
        if (!authorUser && session.user.email) {
          try {
            authorUser = await prisma.user.create({
              data: {
                email: session.user.email.toLowerCase().trim(),
                name: session.user.name || 'Lê Hạnh (Quản trị viên Cấp cao)',
                role: session.user.role || Role.SUPER_ADMIN,
                orgCode: (updatePayload.orgCode as OrgCode) || OrgCode.MTTQ,
                positionTitle: 'Quản trị viên Hệ thống Cấp cao',
                isActive: true,
              },
            });
          } catch {}
        }

        if (authorUser) {
          // Đảm bảo categoryId hợp lệ
          let targetCatId = updatePayload.categoryId as string | undefined;
          if (!targetCatId) {
            const firstCat = await prisma.newsCategory.findFirst();
            targetCatId = firstCat?.id;
          }

          if (targetCatId) {
            updatedDb = await prisma.newsArticle.create({
              data: {
                title: String(updatePayload.title || existing.title),
                slug: existing.slug,
                summary: String(updatePayload.summary || existing.summary),
                contentHtml: String(updatePayload.contentHtml || existing.contentHtml),
                thumbnailUrl: (updatePayload.thumbnailUrl as string) || existing.thumbnailUrl || null,
                categoryId: targetCatId,
                villageId: (updatePayload.villageId as string | null) ?? null,
                orgCode: (updatePayload.orgCode as OrgCode) || existing.orgCode || OrgCode.MTTQ,
                authorId: authorUser.id,
                status: (updatePayload.status as ArticleStatus) || existing.status || ArticleStatus.PUBLISHED,
                isFeatured: Boolean(updatePayload.isFeatured ?? existing.isFeatured),
                publishedAt: isApproving || updatePayload.status === ArticleStatus.PUBLISHED ? new Date() : null,
              },
              include: {
                category: { select: { id: true, name: true, slug: true, badgeColor: true } },
                village: { select: { id: true, name: true, code: true } },
                author: { select: { name: true, email: true, positionTitle: true } },
                approvedBy: { select: { name: true } },
              },
            });
          }
        }
      }

      if (updatedDb) {
        await writeAuditLog({
          userId: approverUser?.id || session.user.id,
          userEmail: session.user.email,
          action: isApproving ? 'APPROVE' : 'UPDATE',
          targetTable: 'news_articles',
          targetId: updatedDb.id,
          oldData: { title: existing.title, status: existing.status },
          newData: { title: updatedDb.title, status: updatedDb.status },
          req,
        });
      }
    } catch (err: any) {
      console.warn('[API_ADMIN_NEWS_PATCH_DB_WARN] Lỗi cập nhật PostgreSQL:', err?.message);
    }

    // 6. Luôn cập nhật kho lưu trữ cục bộ
    let updatedLocal = null;
    try {
      updatedLocal = await updateLocalArticle(existing.id || id, {
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

      if (!updatedLocal && updatedDb) {
        // Ghi bản sao lưu vào local
        await saveLocalArticle({
          id: updatedDb.id,
          title: updatedDb.title,
          slug: updatedDb.slug,
          summary: updatedDb.summary,
          contentHtml: updatedDb.contentHtml,
          thumbnailUrl: updatedDb.thumbnailUrl,
          images: targetImages,
          status: updatedDb.status,
          orgCode: updatedDb.orgCode,
        });
      }
    } catch {}

    const finalResult = updatedDb
      ? { ...updatedDb, images: extractGalleryImages(updatedDb.contentHtml, updatedDb.thumbnailUrl) }
      : updatedLocal;

    if (!finalResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không thể lưu bản tin vào cơ sở dữ liệu. Vui lòng kiểm tra lại quyền cán bộ và đường truyền.',
        },
        { status: 500 }
      );
    }

    // 7. Làm mới bộ nhớ cache của Next.js SSR
    try {
      revalidatePath('/admin');
      revalidatePath('/');
      revalidatePath(`/news/${existing.slug}`);
      if (updatedDb?.slug && updatedDb.slug !== existing.slug) {
        revalidatePath(`/news/${updatedDb.slug}`);
      }
    } catch {}

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
      existing = await prisma.newsArticle.findFirst({
        where: { OR: [{ id }, { slug: id }] },
      });
    } catch {}

    if (!existing) {
      existing = (await getLocalArticleById(id)) || (await getLocalArticleBySlug(id));
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
      await prisma.newsArticle.deleteMany({
        where: { OR: [{ id: existing.id }, { slug: existing.slug }] },
      });
      await writeAuditLog({
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'DELETE',
        targetTable: 'news_articles',
        targetId: existing.id,
        oldData: { title: existing.title, slug: existing.slug, status: existing.status },
        req,
      });
    } catch (err: any) {
      console.warn('[API_ADMIN_NEWS_DELETE_DB_WARN] Xóa CSDL không khả dụng, xóa file cục bộ:', err?.message);
    }

    await deleteLocalArticle(existing.id);
    if (existing.slug) {
      await deleteLocalArticle(existing.slug);
    }

    try {
      revalidatePath('/admin');
      revalidatePath('/');
      revalidatePath(`/news/${existing.slug}`);
    } catch {}

    return NextResponse.json({ success: true, message: 'Đã xóa bản tin thành công.' });
  } catch (error: any) {
    console.error('[API_ADMIN_NEWS_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: error?.message || 'Không thể xóa bản tin.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canCreateArticle, buildArticleScopeFilter } from '@/lib/permissions';
import { sanitizeHtml, sanitizePlainText, generateVietnameseSlug } from '@/lib/sanitize';
import { writeAuditLog } from '@/lib/audit';
import { ArticleStatus, OrgCode, Role } from '@prisma/client';

/**
 * GET /api/admin/news
 * Lấy danh sách bản tin quản trị theo phạm vi quyền hạn (Zero-Trust ABAC)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
    const skip = (page - 1) * limit;
    const statusParam = searchParams.get('status') as ArticleStatus | null;

    // Áp dụng bộ lọc bảo mật ABAC chống IDOR
    const scopeFilter = buildArticleScopeFilter(session.user);
    const where = {
      ...scopeFilter,
      ...(statusParam ? { status: statusParam } : {}),
    };

    const [articles, totalCount] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true, badgeColor: true } },
          village: { select: { name: true, code: true } },
          author: { select: { name: true, email: true, positionTitle: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.newsArticle.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[API_ADMIN_NEWS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Lỗi truy vấn danh sách bản tin.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/news
 * Tạo bản tin mới: Kiểm tra quyền hạn, khử trùng Stored XSS và ghi nhật ký kiểm toán
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
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
      isFeatured = false,
      status = ArticleStatus.DRAFT,
    } = body;

    if (!title || !contentHtml || !categoryId || !orgCode) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ các trường bắt buộc (Tiêu đề, nội dung, chuyên mục, đơn vị).' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra thẩm quyền tạo bản tin theo ma trận ABAC
    const permission = canCreateArticle(session.user, {
      orgCode: orgCode as OrgCode,
      villageId: villageId || null,
      status: status as ArticleStatus,
    });

    if (!permission.allowed) {
      return NextResponse.json({ success: false, error: permission.reason }, { status: 403 });
    }

    // 2. Khử trùng dữ liệu triệt tiêu 100% Stored XSS
    const cleanTitle = sanitizePlainText(title);
    const cleanSummary = sanitizePlainText(summary || cleanTitle.slice(0, 160));
    const cleanContentHtml = sanitizeHtml(contentHtml);
    const cleanBeneficiaryName = beneficiaryName ? sanitizePlainText(beneficiaryName) : null;

    // 3. Tạo slug duy nhất
    let baseSlug = generateVietnameseSlug(cleanTitle);
    if (!baseSlug) baseSlug = `bai-viet-${Date.now()}`;
    const slugExists = await prisma.newsArticle.findUnique({ where: { slug: baseSlug } });
    const finalSlug = slugExists ? `${baseSlug}-${Math.random().toString(36).substring(2, 7)}` : baseSlug;

    // 4. Xác định trạng thái xuất bản
    const isPublishingNow =
      status === ArticleStatus.PUBLISHED &&
      (session.user.role === Role.EXECUTIVE || session.user.role === Role.SUPER_ADMIN);

    const newArticle = await prisma.newsArticle.create({
      data: {
        title: cleanTitle,
        slug: finalSlug,
        summary: cleanSummary,
        contentHtml: cleanContentHtml,
        thumbnailUrl: thumbnailUrl || null,
        categoryId,
        villageId: villageId || null,
        orgCode: orgCode as OrgCode,
        authorId: session.user.id,
        beneficiaryName: cleanBeneficiaryName,
        approvedById: isPublishingNow ? session.user.id : null,
        status: isPublishingNow ? ArticleStatus.PUBLISHED : (status as ArticleStatus),
        isFeatured: Boolean(isFeatured),
        publishedAt: isPublishingNow ? new Date() : null,
      },
    });

    // 5. Ghi nhật ký kiểm toán bất biến (Audit Log)
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'CREATE',
      targetTable: 'news_articles',
      targetId: newArticle.id,
      newData: { id: newArticle.id, title: newArticle.title, status: newArticle.status },
      req,
    });

    return NextResponse.json({ success: true, data: newArticle }, { status: 201 });
  } catch (error) {
    console.error('[API_ADMIN_NEWS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Không thể tạo bản tin mới.' }, { status: 500 });
  }
}

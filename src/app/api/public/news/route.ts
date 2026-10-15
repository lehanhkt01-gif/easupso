import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ArticleStatus, OrgCode, Prisma } from '@prisma/client';
import { extractGalleryImages } from '@/lib/news-gallery';
import { getLocalArticles } from '@/lib/local-news';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/news
 * Truy vấn danh sách bản tin PUBLISHED có phân trang, bộ lọc chuyên mục, thôn buôn và tìm kiếm
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const skip = (page - 1) * limit;

  const categoryParam = searchParams.get('category');
  const villageIdParam = searchParams.get('villageId');
  const searchQuery = searchParams.get('q')?.trim()?.toLowerCase();
  const isFeaturedParam = searchParams.get('featured');

  // 1. Thử truy vấn từ PostgreSQL
  try {
    const where: Prisma.NewsArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
    };

    if (categoryParam) {
      const validOrgCodes = Object.values(OrgCode);
      if (validOrgCodes.includes(categoryParam as OrgCode)) {
        where.orgCode = categoryParam as OrgCode;
      } else {
        where.category = { slug: categoryParam };
      }
    }

    if (villageIdParam) {
      where.villageId = villageIdParam;
    }

    if (isFeaturedParam === 'true') {
      where.isFeatured = true;
    }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { summary: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const [articles, totalCount] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          thumbnailUrl: true,
          orgCode: true,
          isFeatured: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
          contentHtml: true,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              badgeColor: true,
            },
          },
          village: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.newsArticle.count({ where }),
    ]);

    if (articles.length > 0) {
      const mappedArticles = articles.map((art) => ({
        ...art,
        images: extractGalleryImages(art.contentHtml, art.thumbnailUrl),
      }));

      const totalPages = Math.ceil(totalCount / limit);
      return NextResponse.json({
        success: true,
        data: mappedArticles,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    }
  } catch (error) {
    console.warn('[API_NEWS_PUBLIC_DB_WARN] CSDL chưa sẵn sàng, chuyển sang kho lưu trữ cục bộ:', error);
  }

  // 2. Fallback sang kho lưu trữ cục bộ bền vững
  try {
    const allLocal = await getLocalArticles();
    let published = allLocal.filter((a) => a.status === ArticleStatus.PUBLISHED);

    if (categoryParam) {
      const validOrgCodes = Object.values(OrgCode);
      if (validOrgCodes.includes(categoryParam as OrgCode)) {
        published = published.filter((a) => a.orgCode === categoryParam);
      } else {
        published = published.filter((a) => a.category?.slug === categoryParam || a.categoryId === categoryParam);
      }
    }

    if (villageIdParam) {
      published = published.filter(
        (a) => a.villageId === villageIdParam || a.village?.code === villageIdParam || a.village?.id === villageIdParam
      );
    }

    if (isFeaturedParam === 'true') {
      published = published.filter((a) => a.isFeatured);
    }

    if (searchQuery) {
      published = published.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery) ||
          a.summary.toLowerCase().includes(searchQuery)
      );
    }

    const totalCount = published.length;
    const paginated = published.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err: any) {
    console.error('[API_NEWS_PUBLIC_FALLBACK_ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách bản tin.' },
      { status: 500 }
    );
  }
}

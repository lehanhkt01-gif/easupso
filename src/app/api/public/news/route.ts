import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ArticleStatus, OrgCode, Prisma } from '@prisma/client';
import { extractGalleryImages } from '@/lib/news-gallery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/news
 * Truy vấn danh sách bản tin PUBLISHED có phân trang, bộ lọc chuyên mục, thôn buôn và tìm kiếm
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const categoryParam = searchParams.get('category');
    const villageIdParam = searchParams.get('villageId');
    const searchQuery = searchParams.get('q')?.trim();
    const isFeaturedParam = searchParams.get('featured');

    // Mặc định công chúng: Chỉ đọc bài đã PUBLISHED
    const where: Prisma.NewsArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
    };

    // Lọc theo chuyên mục (slug hoặc orgCode)
    if (categoryParam) {
      const validOrgCodes = Object.values(OrgCode);
      if (validOrgCodes.includes(categoryParam as OrgCode)) {
        where.orgCode = categoryParam as OrgCode;
      } else {
        where.category = { slug: categoryParam };
      }
    }

    // Lọc theo thôn buôn
    if (villageIdParam) {
      where.villageId = villageIdParam;
    }

    // Lọc tin tiêu điểm
    if (isFeaturedParam === 'true') {
      where.isFeatured = true;
    }

    // Tìm kiếm từ khóa không phân biệt hoa thường trong tiêu đề và tóm tắt
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { summary: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Thực hiện truy vấn song song lấy danh sách và tổng số bản ghi
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
  } catch (error) {
    console.error('[API_NEWS_PUBLIC_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách bản tin.' },
      { status: 500 }
    );
  }
}

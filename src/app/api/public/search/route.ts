import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ArticleStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/search?q=...
 * Tìm kiếm hợp nhất toàn cổng (Unified Search Engine)
 * Trả về đồng thời: Phân hệ WebApp, Bản tin hoạt động và Thông báo điều hành
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          query: '',
          apps: [],
          articles: [],
          announcements: [],
          totalResults: 0,
        },
      });
    }

    // Thực hiện truy vấn song song cả 3 nguồn dữ liệu
    const [apps, articles, announcements] = await Promise.all([
      // 1. Tìm trong danh mục WebApp cốt lõi
      prisma.ecosystemApp.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { shortDescription: { contains: query, mode: 'insensitive' } },
            { badgeText: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),

      // 2. Tìm trong các bản tin đã xuất bản (PUBLISHED)
      prisma.newsArticle.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          thumbnailUrl: true,
          publishedAt: true,
          category: {
            select: { name: true, slug: true, badgeColor: true },
          },
          village: {
            select: { name: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),

      // 3. Tìm trong các thông báo điều hành đang hiệu lực
      prisma.quickAnnouncement.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 4,
      }),
    ]);

    const totalResults = apps.length + articles.length + announcements.length;

    return NextResponse.json({
      success: true,
      data: {
        query,
        apps,
        articles,
        announcements,
        totalResults,
      },
    });
  } catch (error) {
    console.error('[API_UNIFIED_SEARCH_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi thực hiện tìm kiếm.' },
      { status: 500 }
    );
  }
}

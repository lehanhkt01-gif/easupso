import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/categories
 * Lấy danh sách 7 chuyên mục đoàn thể từ CSDL
 */
export async function GET() {
  try {
    const categories = await prisma.newsCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        orgCode: true,
        badgeColor: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('[API_CATEGORIES_ERROR]', error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500 }
    );
  }
}

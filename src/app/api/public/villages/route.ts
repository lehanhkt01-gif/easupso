import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/villages
 * Trả về danh sách 20 thôn buôn chuẩn của xã Ea Súp
 */
export async function GET() {
  try {
    const villages = await prisma.village.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        leaderName: true,
        phone: true,
      },
    });

    if (villages.length > 0) {
      return NextResponse.json({ success: true, data: villages });
    }
  } catch (err) {
    console.warn('[API_VILLAGES_WARN] Không kết nối được CSDL, trả về danh mục khóa cứng:', err);
  }

  // Fallback danh mục 20 thôn buôn khóa cứng
  return NextResponse.json({
    success: true,
    data: EA_SUP_VILLAGES.map((v) => ({
      id: v.code,
      code: v.code,
      name: v.name,
      type: v.type,
      leaderName: v.leaderName,
      phone: v.phone,
    })),
  });
}

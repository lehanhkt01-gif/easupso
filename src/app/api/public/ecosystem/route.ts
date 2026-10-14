import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Ping kiểm tra trạng thái subdomain với Circuit Breaker (Timeout tối đa 2s)
 */
async function checkSubdomainStatus(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'EaSupSo-HealthCheck/1.0' },
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    return response.status < 500;
  } catch (error) {
    clearTimeout(timeoutId);
    // Graceful fallback: Khi timeout hoặc lỗi mạng, trả về false mà không chặn render
    return false;
  }
}

/**
 * GET /api/public/ecosystem
 * Trả về danh sách phân hệ WebApp và thông báo khẩn với Graceful Fallback dưới 50ms
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Lấy dữ liệu phân hệ từ PostgreSQL
    const [apps, announcements] = await Promise.all([
      prisma.ecosystemApp.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.quickAnnouncement.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // 2. Không thực hiện ping đồng bộ nếu muốn phản hồi siêu tốc (<50ms).
    // Dữ liệu `isOnline` và `liveMetricsJson` trong DB đóng vai trò cache an toàn.
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        apps,
        announcements,
        meta: {
          latencyMs,
          totalApps: apps.length,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[API_ECOSYSTEM_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể tải dữ liệu Hệ sinh thái số Ea Súp. Vui lòng thử lại.',
      },
      { status: 500 }
    );
  }
}

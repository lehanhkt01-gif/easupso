import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';

/**
 * POST /api/admin/ecosystem/sync
 * Cập nhật số liệu tóm tắt (liveMetricsJson) và trạng thái của các phân hệ WebApp trên Bento Grid
 * Chỉ cho phép EXECUTIVE (Chủ tịch UBMTTQ xã) hoặc SUPER_ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    // Chỉ cấp lãnh đạo hoặc quản trị viên hệ thống được phép đồng bộ số liệu hệ sinh thái
    if (session.user.role !== Role.EXECUTIVE && session.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Lãnh đạo UBMTTQ xã hoặc Quản trị viên mới có quyền cập nhật số liệu phân hệ.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { slug, liveMetricsJson, isOnline } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Thiếu định danh phân hệ (slug).' }, { status: 400 });
    }

    const app = await prisma.ecosystemApp.findUnique({
      where: { slug },
    });

    if (!app) {
      return NextResponse.json({ success: false, error: 'Phân hệ WebApp không tồn tại.' }, { status: 404 });
    }

    const updatedApp = await prisma.ecosystemApp.update({
      where: { slug },
      data: {
        ...(liveMetricsJson !== undefined ? { liveMetricsJson } : {}),
        ...(isOnline !== undefined ? { isOnline: Boolean(isOnline) } : {}),
        lastCheckedAt: new Date(),
      },
    });

    // Ghi nhật ký kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'SYNC',
      targetTable: 'ecosystem_apps',
      targetId: updatedApp.id,
      oldData: { slug, liveMetricsJson: app.liveMetricsJson, isOnline: app.isOnline },
      newData: { slug, liveMetricsJson: updatedApp.liveMetricsJson, isOnline: updatedApp.isOnline },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật đồng bộ số liệu phân hệ [${app.name}] thành công.`,
      data: updatedApp,
    });
  } catch (error) {
    console.error('[API_ADMIN_ECOSYSTEM_SYNC_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi đồng bộ số liệu phân hệ.' },
      { status: 500 }
    );
  }
}

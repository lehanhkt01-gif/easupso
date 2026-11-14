import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/announcements
 * Lấy danh sách toàn bộ thông báo Ticker điều hành
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const announcements = await prisma.quickAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    console.error('[API_ANNOUNCEMENTS_GET_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi khi tải thông báo Ticker.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 * Thêm thông báo Ticker điều hành mới
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const allowedRoles: Role[] = [Role.SUPER_ADMIN, Role.EXECUTIVE];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ cán bộ lãnh đạo và quản trị viên mới có quyền quản lý Ticker.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, linkUrl, isUrgent = false, isActive = true } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tiêu đề thông báo Ticker.' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập nội dung thông báo Ticker.' },
        { status: 400 }
      );
    }

    const newAnnouncement = await prisma.quickAnnouncement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        linkUrl: linkUrl?.trim() || null,
        isUrgent: Boolean(isUrgent),
        isActive: Boolean(isActive),
      },
    });

    // Ghi vết kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'CREATE',
      targetTable: 'quick_announcements',
      targetId: newAnnouncement.id,
      newData: newAnnouncement,
      req,
    });

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
      message: 'Đã tạo thông báo Ticker thành công!',
    });
  } catch (error: any) {
    console.error('[API_ANNOUNCEMENTS_POST_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi khi tạo thông báo Ticker.' },
      { status: 500 }
    );
  }
}

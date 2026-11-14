import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/announcements/[id]
 * Cập nhật thông báo Ticker điều hành
 */
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const allowedRoles: Role[] = [Role.SUPER_ADMIN, Role.EXECUTIVE];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ cán bộ lãnh đạo và quản trị viên mới có quyền sửa Ticker.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { title, content, linkUrl, isUrgent, isActive } = body;

    const existing = await prisma.quickAnnouncement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy thông báo Ticker cần sửa.' },
        { status: 404 }
      );
    }

    const updated = await prisma.quickAnnouncement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl ? linkUrl.trim() : null }),
        ...(isUrgent !== undefined && { isUrgent: Boolean(isUrgent) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    // Ghi vết kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'UPDATE',
      targetTable: 'quick_announcements',
      targetId: id,
      oldData: existing,
      newData: updated,
      req,
    });

    return NextResponse.json({
      success: true,
      announcement: updated,
      message: 'Đã cập nhật thông báo Ticker thành công!',
    });
  } catch (error: any) {
    console.error('[API_ANNOUNCEMENT_PUT_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi khi cập nhật thông báo Ticker.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Xóa thông báo Ticker điều hành
 */
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const allowedRoles: Role[] = [Role.SUPER_ADMIN, Role.EXECUTIVE];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ cán bộ lãnh đạo và quản trị viên mới có quyền xóa Ticker.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.quickAnnouncement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy thông báo Ticker cần xóa.' },
        { status: 404 }
      );
    }

    await prisma.quickAnnouncement.delete({
      where: { id },
    });

    // Ghi vết kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'DELETE',
      targetTable: 'quick_announcements',
      targetId: id,
      oldData: existing,
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa thông báo Ticker thành công!',
    });
  } catch (error: any) {
    console.error('[API_ANNOUNCEMENT_DELETE_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi khi xóa thông báo Ticker.' },
      { status: 500 }
    );
  }
}

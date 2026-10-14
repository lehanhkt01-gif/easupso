import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession, ROOT_ADMIN_EMAIL } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';
import { hashPassword } from '@/lib/password';

/**
 * PATCH /api/admin/users/[id]
 * Cập nhật thông tin cán bộ, phân quyền, đổi mật khẩu hoặc khóa tài khoản
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const isAuthorized =
      session.user.role === Role.SUPER_ADMIN || session.user.role === Role.EXECUTIVE;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Đồng chí không có thẩm quyền chỉnh sửa tài khoản.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role, orgCode, villageId, positionTitle, isActive, newPassword } = body;

    // Kiểm tra tài khoản đích
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    }

    const isTargetRootAdmin =
      targetUser.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

    // CHỐT CHẶN BẢO MẬT 1: Không được hạ quyền hoặc khóa tài khoản Root Admin
    if (isTargetRootAdmin) {
      if (role && role !== Role.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: `Tài khoản ${ROOT_ADMIN_EMAIL} là Quản trị viên tối cao không thể bị hạ quyền.` },
          { status: 403 }
        );
      }
      if (isActive === false) {
        return NextResponse.json(
          { success: false, error: `Không thể khóa tài khoản Quản trị viên tối cao ${ROOT_ADMIN_EMAIL}.` },
          { status: 403 }
        );
      }
    }

    // CHỐT CHẶN BẢO MẬT 2: Cán bộ không được tự khóa chính mình
    if (session.user.id === targetUser.id && isActive === false) {
      return NextResponse.json(
        { success: false, error: 'Đồng chí không thể tự vô hiệu hóa tài khoản của chính mình khi đang đăng nhập.' },
        { status: 400 }
      );
    }

    // Xử lý đổi mật khẩu nếu có
    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (role !== undefined) updatePayload.role = role;
    if (orgCode !== undefined) updatePayload.orgCode = orgCode || null;
    if (villageId !== undefined) updatePayload.villageId = villageId || null;
    if (positionTitle !== undefined) updatePayload.positionTitle = positionTitle?.trim() || null;
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' },
          { status: 400 }
        );
      }
      updatePayload.passwordHash = hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatePayload,
    });

    // Ghi vết kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'UPDATE',
      targetTable: 'User',
      targetId: id,
      oldData: {
        role: targetUser.role,
        isActive: targetUser.isActive,
        positionTitle: targetUser.positionTitle,
      },
      newData: {
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        positionTitle: updatedUser.positionTitle,
        hasPasswordUpdated: !!newPassword,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản thành công.',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error: any) {
    console.error('[API_UPDATE_USER_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi hệ thống khi cập nhật tài khoản.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Xóa tài khoản cán bộ
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    // Chỉ SUPER_ADMIN mới có quyền xóa tài khoản
    if (session.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên tối cao (Super Admin) mới có quyền xóa tài khoản.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản để xóa.' }, { status: 404 });
    }

    // CHỐT CHẶN BẢO MẬT: Tuyệt đối không xóa tài khoản Root Admin
    if (targetUser.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: `Tuyệt đối không được xóa tài khoản Quản trị viên tối cao ${ROOT_ADMIN_EMAIL}.` },
        { status: 403 }
      );
    }

    // CHỐT CHẶN BẢO MẬT: Không được tự xóa chính mình
    if (session.user.id === targetUser.id) {
      return NextResponse.json(
        { success: false, error: 'Đồng chí không thể tự xóa tài khoản của chính mình khi đang đăng nhập.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'DELETE',
      targetTable: 'User',
      targetId: id,
      oldData: {
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản ${targetUser.email} thành công.`,
    });
  } catch (error: any) {
    console.error('[API_DELETE_USER_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi hệ thống khi xóa tài khoản.' },
      { status: 500 }
    );
  }
}

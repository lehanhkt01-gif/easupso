import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession, ROOT_ADMIN_EMAIL } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { Role, OrgCode } from '@prisma/client';
import { hashPassword } from '@/lib/password';

/**
 * GET /api/admin/users
 * Danh sách toàn bộ tài khoản cán bộ, trưởng thôn buôn & nhân dân
 * Yêu cầu: Vai trò SUPER_ADMIN hoặc EXECUTIVE (Lãnh đạo cấp cao)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const isAuthorized =
      session.user.role === Role.SUPER_ADMIN || session.user.role === Role.EXECUTIVE;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Đồng chí không có thẩm quyền truy cập danh sách tài khoản.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        orgCode: true,
        positionTitle: true,
        villageId: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
        village: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Định dạng dữ liệu an toàn (triệt tiêu passwordHash ra khỏi kết quả trả về)
    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      name: u.name || 'Chưa đặt tên',
      email: u.email,
      image: u.image,
      role: u.role,
      orgCode: u.orgCode,
      positionTitle: u.positionTitle,
      villageId: u.villageId,
      villageName: u.village?.name || null,
      isActive: u.isActive,
      hasPassword: !!u.passwordHash,
      isRootAdmin: u.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase(),
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error: any) {
    console.warn('[API_GET_USERS_WARN] Không kết nối được CSDL, trả về danh sách mẫu:', error?.message);
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'root-admin-lehanh',
          name: 'Lê Hạnh (Quản trị viên Cấp cao)',
          email: 'lehanhkt01@gmail.com',
          image: null,
          role: Role.SUPER_ADMIN,
          orgCode: OrgCode.MTTQ,
          positionTitle: 'Quản trị viên Hệ thống Cấp cao (Super Admin)',
          villageId: null,
          villageName: null,
          isActive: true,
          hasPassword: true,
          isRootAdmin: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-lehonghanh',
          name: 'Lê Hồng Hạnh',
          email: 'lehonghanh@easupso.com',
          image: null,
          role: Role.EXECUTIVE,
          orgCode: OrgCode.MTTQ,
          positionTitle: 'Ủy viên BTV Đảng ủy, Bí thư Chi bộ, Chủ tịch UBMTTQ Việt Nam xã Ea Súp',
          villageId: null,
          villageName: null,
          isActive: true,
          hasPassword: true,
          isRootAdmin: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
}

/**
 * POST /api/admin/users
 * Thêm mới tài khoản quản lý / cán bộ / trưởng thôn
 * Yêu cầu: Vai trò SUPER_ADMIN hoặc EXECUTIVE
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const isAuthorized =
      session.user.role === Role.SUPER_ADMIN || session.user.role === Role.EXECUTIVE;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Lãnh đạo cấp cao hoặc Super Admin mới có quyền tạo tài khoản.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role, orgCode, villageId, positionTitle, initialPassword } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập địa chỉ Email.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Địa chỉ Email không đúng định dạng.' }, { status: 400 });
    }

    // Kiểm tra trùng lặp email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Email ${normalizedEmail} đã tồn tại trên hệ thống.` },
        { status: 409 }
      );
    }

    // Hash password nếu có cung cấp
    let passwordHash: string | null = null;
    if (initialPassword && initialPassword.trim()) {
      if (initialPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.' },
          { status: 400 }
        );
      }
      passwordHash = hashPassword(initialPassword.trim());
    }

    // Tạo tài khoản mới
    const newUser = await prisma.user.create({
      data: {
        name: name?.trim() || 'Cán bộ xã',
        email: normalizedEmail,
        role: role || Role.SPECIALIST,
        orgCode: orgCode || null,
        villageId: villageId || null,
        positionTitle: positionTitle?.trim() || null,
        isActive: true,
        passwordHash,
      },
    });

    // Ghi vết kiểm toán bất biến Zero-Trust
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'CREATE',
      targetTable: 'User',
      targetId: newUser.id,
      newData: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        orgCode: newUser.orgCode,
        villageId: newUser.villageId,
        positionTitle: newUser.positionTitle,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo tài khoản cán bộ thành công cho ${normalizedEmail}.`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('[API_CREATE_USER_ERR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi hệ thống khi tạo tài khoản.' },
      { status: 500 }
    );
  }
}

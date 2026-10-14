import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'easupso_super_secret_auth_key_2026_ea_sup_dak_lak';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Chỉ can thiệp các route quản trị /admin
  if (path.startsWith('/admin')) {
    // 1. Thử lấy token với secureCookie: true (cho kết nối HTTPS trên môi trường production)
    let token = await getToken({
      req,
      secret: AUTH_SECRET,
      secureCookie: true,
    });

    // 2. Dự phòng: nếu không tìm thấy, thử với secureCookie: false (cho trường hợp qua reverse proxy HTTP nội bộ)
    if (!token) {
      token = await getToken({
        req,
        secret: AUTH_SECRET,
        secureCookie: false,
      });
    }

    // 3. Nếu chưa đăng nhập -> chuyển về /login
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // 4. Nếu là tài khoản cử tri PUBLIC -> chặn truy cập khu vực cán bộ
    if (token.role === 'PUBLIC') {
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

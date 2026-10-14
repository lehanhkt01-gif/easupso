import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Chặn người dùng công chúng (PUBLIC) truy cập khu vực quản trị cán bộ
    if (path.startsWith('/admin') && (!token || token.role === 'PUBLIC')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Bắt buộc đăng nhập với mọi route bắt đầu bằng /admin
        if (path.startsWith('/admin')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};

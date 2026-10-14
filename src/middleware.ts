import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware định tuyến trung tâm.
 * Việc phân quyền khu vực /admin được bảo vệ trực tiếp, an toàn tại Server Component
 * src/app/admin/page.tsx thông qua getServerAuthSession() để triệt tiêu hoàn toàn
 * hiện tượng lệch cookie / SSL proxy gây vòng lặp tải lại trang (redirect loop).
 */
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

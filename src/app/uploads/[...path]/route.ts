import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

/**
 * GET /uploads/[...path]
 * Phục vụ trực tiếp file ảnh đã tải lên trong thư mục public/uploads
 * Giải quyết triệt để lỗi Next.js standalone không phục vụ file động sau khi build.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Chống Path Traversal
    const fileName = pathSegments.join('/').replace(/\.\./g, '');
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    try {
      const buffer = await fs.readFile(filePath);

      // Xác định Content-Type chuẩn
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.avif') contentType = 'image/avif';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return new NextResponse('File not found on disk', { status: 404 });
    }
  } catch (err: any) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/upload
 * Tải file ảnh trực tiếp từ máy tính lên thư mục public/uploads
 * Áp dụng kiểm tra quyền, định dạng MIME và dung lượng an toàn Zero-Trust
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    if (session.user.role === Role.PUBLIC) {
      return NextResponse.json({ success: false, error: 'Không có quyền tải ảnh lên.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Vui lòng chọn file hình ảnh.' }, { status: 400 });
    }

    // 1. Kiểm tra định dạng MIME hợp lệ
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc AVIF.' },
        { status: 400 }
      );
    }

    // 2. Giới hạn dung lượng ảnh tối đa 15MB
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 15MB).' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Chuẩn hóa tên file ngẫu nhiên an toàn, tránh tấn công Path Traversal
    const rawExt = path.extname(file.name) || '.jpg';
    const ext = rawExt.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const cleanFileName = `hero_cover_${timestamp}_${randomHex}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, cleanFileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${cleanFileName}`;

    // Ghi vết kiểm toán tải file
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'CREATE',
      targetTable: 'Upload',
      targetId: cleanFileName,
      newData: {
        originalName: file.name,
        fileName: cleanFileName,
        url: publicUrl,
        size: file.size,
        mimeType: file.type,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: cleanFileName,
      size: file.size,
      message: 'Tải ảnh lên máy chủ thành công!',
    });
  } catch (err: any) {
    console.error('[API_UPLOAD_ERR]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi hệ thống khi tải ảnh lên.' },
      { status: 500 }
    );
  }
}

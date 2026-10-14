import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/upload
 * Tải file ảnh bản tin hoặc ảnh hệ thống lên thư mục public/uploads
 * Quy định chuẩn: Tối đa 7 tấm ảnh, mỗi tấm dưới 5MB.
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
    
    // Thu thập danh sách file từ formData (hỗ trợ cả 'files' và 'file')
    const rawFiles: File[] = [];
    const filesList = formData.getAll('files') as File[];
    const singleFileList = formData.getAll('file') as File[];

    if (filesList && filesList.length > 0) {
      rawFiles.push(...filesList.filter((f) => f && f.size > 0));
    }
    if (singleFileList && singleFileList.length > 0) {
      rawFiles.push(...singleFileList.filter((f) => f && f.size > 0 && !rawFiles.includes(f)));
    }

    if (rawFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'Vui lòng chọn ít nhất một file hình ảnh.' }, { status: 400 });
    }

    // 1. Giới hạn tối đa 7 tấm ảnh
    if (rawFiles.length > 7) {
      return NextResponse.json(
        { success: false, error: 'Mỗi bản tin chỉ được phép đăng tối đa 7 tấm ảnh.' },
        { status: 400 }
      );
    }

    // 2. Kiểm tra định dạng và dung lượng từng file (Tối đa 5MB)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg', 'image/gif'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (const f of rawFiles) {
      if (!allowedTypes.includes(f.type.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${f.name}" không hợp lệ. Chỉ chấp nhận định dạng JPG, PNG, WebP hoặc AVIF.`,
          },
          { status: 400 }
        );
      }

      if (f.size > maxSizeBytes) {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
        return NextResponse.json(
          {
            success: false,
            error: `File "${f.name}" có dung lượng ${sizeMb} MB, vượt quá giới hạn tối đa 5MB!`,
          },
          { status: 400 }
        );
      }
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];
    const uploadedDetails: Array<{ name: string; url: string; size: number }> = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const rawExt = path.extname(file.name) || '.jpg';
      const ext = rawExt.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
      const timestamp = Date.now();
      const randomHex = Math.random().toString(36).substring(2, 8);
      const cleanFileName = `tintuc_${timestamp}_${i + 1}_${randomHex}${ext}`;

      const filePath = path.join(uploadDir, cleanFileName);
      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${cleanFileName}`;
      uploadedUrls.push(publicUrl);
      uploadedDetails.push({
        name: file.name,
        url: publicUrl,
        size: file.size,
      });
    }

    // Ghi vết kiểm toán
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'CREATE',
      targetTable: 'Upload',
      targetId: uploadedUrls.join(','),
      newData: {
        count: uploadedUrls.length,
        files: uploadedDetails,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0], // Hỗ trợ tương thích ngược với nơi nhận 1 URL
      files: uploadedDetails,
      count: uploadedUrls.length,
      message: `Đã tải lên thành công ${uploadedUrls.length} tấm ảnh!`,
    });
  } catch (err: any) {
    console.error('[API_UPLOAD_ERR]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi hệ thống khi tải ảnh lên.' },
      { status: 500 }
    );
  }
}

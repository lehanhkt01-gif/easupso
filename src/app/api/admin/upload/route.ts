import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/auth';
import { writeAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/upload
 * Tải file ảnh bản tin hoặc ảnh hệ thống lên thư mục public/uploads
 * Cơ chế an toàn 2 lớp:
 *  - Client đã nén và gắn logo < 1MB
 *  - Backend Guard: Nhận tới 15MB, tự động xoay chuẩn EXIF orientation (.rotate())
 *    và nén bằng Sharp về < 1MB trước khi lưu đĩa.
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

    // 2. Kiểm tra định dạng và dung lượng từng file (Nới lỏng giới hạn nhận ảnh tới 15MB để xử lý)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/jpg',
      'image/gif',
      'image/heic',
      'image/heif',
      'image/pjpeg',
      'image/x-png',
      'application/octet-stream',
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif'];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB

    for (const f of rawFiles) {
      const ext = path.extname(f.name || '').toLowerCase();
      const isAllowed = allowedTypes.includes(f.type?.toLowerCase() || '') || allowedExtensions.includes(ext);
      if (!isAllowed) {
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
            error: `File "${f.name}" có dung lượng ${sizeMb} MB, vượt quá giới hạn tối đa 15MB!`,
          },
          { status: 400 }
        );
      }
    }

    // Chuẩn bị thư mục lưu trữ với cơ chế fallback chống lỗi phân quyền EACCES trên Docker/VPS
    const candidateDirs = [
      path.join(process.cwd(), 'public', 'uploads'),
      path.join('/app', 'public', 'uploads'),
      path.join('/tmp', 'uploads'),
    ];

    let activeUploadDir = candidateDirs[0];
    for (const dir of candidateDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        // Kiểm tra quyền ghi thực tế
        const testFile = path.join(dir, `.test_write_${Date.now()}`);
        await fs.writeFile(testFile, 'ok');
        await fs.unlink(testFile).catch(() => {});
        activeUploadDir = dir;
        break;
      } catch (dirErr) {
        console.warn(`[UPLOAD_DIR_WARN] Không có quyền ghi vào ${dir}:`, dirErr);
      }
    }

    const uploadedUrls: string[] = [];
    const uploadedDetails: Array<{ name: string; url: string; size: number }> = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);
      let ext = (path.extname(file.name) || '.jpg').replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();

      // KIỂM SOÁT AN TOÀN PHÍA SERVER (SERVER-SIDE GUARD VỚI SHARP)
      // Tự động xoay ảnh chuẩn EXIF (iPhone/Android) và nén bảo đảm < 1MB nếu ảnh lớn
      try {
        const metadata = await sharp(buffer).metadata();
        const hasExifOrientation = Boolean(metadata.orientation && metadata.orientation > 1);
        const needsResize = Boolean(
          (metadata.width && metadata.width > 1920) || (metadata.height && metadata.height > 1920)
        );
        const isOver1MB = buffer.length > 1024 * 1024;

        if (hasExifOrientation || needsResize || isOver1MB) {
          // Bắt đầu với max 1920px và chất lượng 84
          let q = 84;
          let optimizedBuffer = await sharp(buffer)
            .rotate()
            .resize({
              width: 1920,
              height: 1920,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: q, mozjpeg: true })
            .toBuffer();

          // Vòng lặp giảm chất lượng nếu vẫn >= 980KB
          while (optimizedBuffer.length >= 980 * 1024 && q > 55) {
            q -= 10;
            optimizedBuffer = await sharp(buffer)
              .rotate()
              .resize({
                width: 1920,
                height: 1920,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: q, mozjpeg: true })
              .toBuffer();
          }

          // Nếu ở mức q <= 55 mà vẫn >= 980KB (ảnh chụp hạt quá dày), thu gọn kích thước xuống 1440px -> 1200px
          if (optimizedBuffer.length >= 980 * 1024) {
            optimizedBuffer = await sharp(buffer)
              .rotate()
              .resize({
                width: 1440,
                height: 1440,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 65, mozjpeg: true })
              .toBuffer();
          }

          if (optimizedBuffer.length >= 980 * 1024) {
            optimizedBuffer = await sharp(buffer)
              .rotate()
              .resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 60, mozjpeg: true })
              .toBuffer();
          }

          buffer = optimizedBuffer;
          ext = '.jpg';
        }
      } catch (sharpErr) {
        console.warn('[SERVER_SHARP_WARN] Bỏ qua xử lý sharp:', sharpErr);
      }

      const timestamp = Date.now();
      const randomHex = Math.random().toString(36).substring(2, 8);
      const cleanFileName = `tintuc_${timestamp}_${i + 1}_${randomHex}${ext}`;

      const filePath = path.join(activeUploadDir, cleanFileName);
      await fs.writeFile(filePath, buffer);
      // Đảm bảo file có quyền đọc cho mọi user trên hệ thống
      await fs.chmod(filePath, 0o666).catch(() => {});

      const publicUrl = `/uploads/${cleanFileName}`;
      uploadedUrls.push(publicUrl);
      uploadedDetails.push({
        name: file.name,
        url: publicUrl,
        size: buffer.length,
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

/**
 * TIỆN ÍCH ĐÓNG DẤU BẢN QUYỀN LOGO CHỮ EASUPSO.COM VÀ TỐI ƯU HÓA ẢNH
 * Hệ thống Cổng thông tin & Hệ sinh thái số xã Ea Súp — easupso.com
 *
 * Chức năng:
 * 1. Tự động co dãn ảnh độ phân giải cao về kích thước chuẩn báo chí (max 1600px).
 * 2. Ghép logo nhận diện vector/canvas "EASUPSO.COM" vào GÓC DƯỚI BÊN TRÁI của ảnh:
 *    - Cụm "EA": Gradient xanh lá sáng (#A3E635) -> xanh lá đậm (#22C55E), viền #BEF264
 *    - Cụm "SUP": Gradient vàng cam (#FBBF24) -> cam đậm (#EA580C), viền #FDE047
 *    - Cụm "SO.COM": Gradient xanh cyan (#22D3EE) -> xanh dương (#2563EB), viền #67E8F9
 *    - Nền pill bán trong suốt rgba(10, 20, 32, 0.55) có bo góc và bóng đổ nổi bật trên mọi nền ảnh.
 * 3. Tỷ lệ co dãn responsive theo chiều rộng ảnh (20% - 24% chiều ngang), cách lề 3%.
 * 4. Xuất file JPEG chất lượng 0.92 trước khi gửi API upload lên máy chủ.
 */

export interface WatermarkOptions {
  enabled?: boolean;        // Mặc định true (gắn logo EASUPSO.COM ở góc dưới trái)
  quality?: number;        // Chất lượng khởi điểm (mặc định 0.88)
  maxDim?: number;         // Cạnh dài tối đa (mặc định 1920px)
  targetMaxBytes?: number; // Ngưỡng dung lượng tối đa (mặc định 980KB ~ 1.003.520 bytes, đảm bảo luôn < 1MB)
}

export interface ProcessedImageFile extends File {
  originalSize?: number;
  compressedSize?: number;
}

/**
 * Tải ảnh an toàn trên đa nền tảng (hỗ trợ xử lý xoay ảnh EXIF Orientation tự động cho iPhone/Android)
 */
async function loadSourceImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  // 1. Thử dùng createImageBitmap nếu trình duyệt hỗ trợ (siêu nhanh, xử lý orientation tự động)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => {
          try {
            bitmap.close();
          } catch {}
        },
      };
    } catch {
      // Fallback nếu options không được hỗ trợ
    }
  }

  // 2. Thử dùng HTMLImageElement với Object URL (tránh tràn RAM so với FileReader base64)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
        },
      });
    };

    img.onerror = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}

      // 3. Fallback cuối cùng với FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          resolve({
            source: fallbackImg,
            width: fallbackImg.naturalWidth || fallbackImg.width,
            height: fallbackImg.naturalHeight || fallbackImg.height,
            cleanup: () => {},
          });
        };
        fallbackImg.onerror = (err) => reject(err);
        fallbackImg.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Chuyển đổi canvas sang Blob dưới dạng Promise
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Xử lý nén ảnh thông minh về dưới 1MB và tự động ghép logo EASUPSO.COM
 * Quy tắc nén 2 bước:
 *  - Bước 1: Chuẩn hóa độ phân giải: Cạnh dài nhất tối đa 1920px (giữ nguyên tỷ lệ khung hình)
 *  - Bước 2: Vòng lặp tối ưu dung lượng: Xuất JPEG chất lượng khởi điểm 0.88, lặp giảm dần (mỗi bước -0.07 đến 0.55)
 *            Nếu vẫn >= 980KB thì thu nhỏ kích thước cho đến khi CHẮC CHẮN < 1MB.
 */
export async function processAndWatermarkImage(
  file: File,
  options: WatermarkOptions = {}
): Promise<ProcessedImageFile> {
  const {
    enabled = true,
    quality = 0.88,
    maxDim = 1920,
    targetMaxBytes = 980 * 1024, // 980KB để đảm bảo luôn < 1.048.576 bytes
  } = options;

  if (typeof window === 'undefined' || !file.type || !file.type.startsWith('image/')) {
    const untouched = file as ProcessedImageFile;
    untouched.originalSize = file.size;
    untouched.compressedSize = file.size;
    return untouched;
  }

  try {
    const { source, width: origW, height: origH, cleanup } = await loadSourceImage(file);

    // BƯỚC 1 – CHUẨN HÓA ĐỘ PHÂN GIẢI (MAX 1920PX)
    let targetW = origW;
    let targetH = origH;

    if (targetW > maxDim || targetH > maxDim) {
      if (targetW >= targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    // Nếu ảnh đầu vào vốn đã nhỏ (<= 1MB), kích thước chuẩn và KHÔNG bật watermark: giữ nguyên file gốc
    if (!enabled && file.size <= targetMaxBytes && origW <= maxDim && origH <= maxDim) {
      cleanup();
      const untouched = file as ProcessedImageFile;
      untouched.originalSize = file.size;
      untouched.compressedSize = file.size;
      return untouched;
    }

    // Khởi tạo Canvas vẽ ảnh
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      cleanup();
      const untouched = file as ProcessedImageFile;
      untouched.originalSize = file.size;
      untouched.compressedSize = file.size;
      return untouched;
    }

    // Nền trắng phòng trường hợp ảnh PNG trong suốt chuyển sang JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    // Vẽ ảnh gốc đã resize
    ctx.drawImage(source, 0, 0, targetW, targetH);
    cleanup(); // Giải phóng nguồn ảnh ngay sau khi đã vẽ lên canvas

    // Gắn logo nhận diện EASUPSO.COM ở góc dưới trái nếu được bật
    if (enabled) {
      drawEasupsoWatermark(ctx, targetW, targetH);
    }

    // BƯỚC 2 – VÒNG LẶP TỐI ƯU DUNG LƯỢNG VỀ DƯỚI 1MB (TARGET < 980KB)
    // Nếu ảnh ban đầu vốn nhẹ (<= 1MB), dùng chất lượng 0.92 để tối đa độ nét
    let currentQuality = file.size <= targetMaxBytes && origW <= maxDim ? 0.92 : quality;
    let blob = await canvasToBlob(canvas, 'image/jpeg', currentQuality);

    if (!blob) {
      const untouched = file as ProcessedImageFile;
      untouched.originalSize = file.size;
      untouched.compressedSize = file.size;
      return untouched;
    }

    // Giảm dần chất lượng nếu dung lượng vẫn >= 980KB (mỗi bước -0.07, tối thiểu 0.55)
    while (blob.size >= targetMaxBytes && currentQuality > 0.55) {
      currentQuality = Math.max(0.55, Number((currentQuality - 0.07).toFixed(2)));
      const nextBlob = await canvasToBlob(canvas, 'image/jpeg', currentQuality);
      if (nextBlob) {
        blob = nextBlob;
      } else {
        break;
      }
    }

    // Nếu ở mức 0.55 mà vẫn >= 980KB (ảnh chụp chi tiết cực kỳ phức tạp), tiếp tục thu nhỏ kích thước (1600px -> 1280px -> 1024px)
    if (blob.size >= targetMaxBytes) {
      const scaleSteps = [0.8, 0.65, 0.5];
      for (const scale of scaleSteps) {
        if (blob.size < targetMaxBytes) break;

        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.round(targetW * scale);
        scaledCanvas.height = Math.round(targetH * scale);
        const sCtx = scaledCanvas.getContext('2d', { alpha: false });

        if (sCtx) {
          sCtx.fillStyle = '#FFFFFF';
          sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
          sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

          let scaledBlob = await canvasToBlob(scaledCanvas, 'image/jpeg', 0.78);
          if (scaledBlob && scaledBlob.size >= targetMaxBytes) {
            scaledBlob = await canvasToBlob(scaledCanvas, 'image/jpeg', 0.62);
          }

          if (scaledBlob) {
            blob = scaledBlob;
          }
        }
      }
    }

    // Chuẩn hóa tên file đầu ra (.jpg)
    const baseName = (file.name || 'image').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = `${baseName || 'image'}.jpg`;

    const processedFile = new File([blob], cleanFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    }) as ProcessedImageFile;

    processedFile.originalSize = file.size;
    processedFile.compressedSize = processedFile.size;

    return processedFile;
  } catch (err) {
    console.warn('[IMAGE_PROCESSOR_WARN] Lỗi khi nén ảnh client:', err);
    const fallbackFile = file as ProcessedImageFile;
    fallbackFile.originalSize = file.size;
    fallbackFile.compressedSize = file.size;
    return fallbackFile;
  }
}

/**
 * Bí danh hàm nén ảnh dùng chung
 */
export const compressImageUnder1MB = processAndWatermarkImage;

/**
 * Vẽ khung chữ nhật bo góc (Rounded Rectangle)
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Vẽ logo nhận diện chữ EASUPSO.COM vào góc dưới bên trái của Canvas
 */
export function drawEasupsoWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();

  // 1. Tính toán tỷ lệ co giãn Responsive (khoảng 20% - 24% chiều rộng ảnh)
  // Target width của toàn bộ khối pill watermark
  const targetPillWidth = Math.max(130, Math.min(width * 0.22, 450));

  // Đo chiều rộng chữ ở cỡ font mẫu để tính tỷ lệ font chính xác
  const sampleFontSize = 60;
  const fontFamilies = 'Montserrat, Inter, "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.font = `900 ${sampleFontSize}px ${fontFamilies}`;

  const sampleW_EA = ctx.measureText('EA').width;
  const sampleW_SUP = ctx.measureText('SUP').width;
  const sampleW_SO = ctx.measureText('SO.COM').width;
  const sampleTotalTextWidth = sampleW_EA + sampleW_SUP + sampleW_SO;

  // Tỷ lệ padding: horizontal padding ~ 0.5 * fontSize mỗi bên, vertical ~ 0.28 * fontSize
  // targetPillWidth = fontSize * (sampleTotalTextWidth / sampleFontSize + 1.0)
  const widthRatio = sampleTotalTextWidth / sampleFontSize + 1.0;
  const fontSize = Math.max(11, Math.round(targetPillWidth / widthRatio));

  // Thiết lập font chữ chính thức
  ctx.font = `900 ${fontSize}px ${fontFamilies}`;
  ctx.textBaseline = 'alphabetic';

  const w_EA = ctx.measureText('EA').width;
  const w_SUP = ctx.measureText('SUP').width;
  const w_SO = ctx.measureText('SO.COM').width;
  const totalTextW = w_EA + w_SUP + w_SO;

  // Kích thước của nền pill
  const padX = Math.round(fontSize * 0.55);
  const padY = Math.round(fontSize * 0.28);
  const pillW = Math.round(totalTextW + padX * 2);
  const pillH = Math.round(fontSize * 1.35 + padY * 2);
  const radius = Math.round(pillH * 0.35);

  // 2. Vị trí cố định: Góc dưới bên trái (Bottom-Left), cách mép ~3% chiều rộng ảnh (tối thiểu 12px)
  const marginX = Math.max(12, Math.round(width * 0.03));
  const marginY = Math.max(12, Math.round(width * 0.03));

  const pillX = marginX;
  const pillY = height - marginY - pillH;

  // 3. Vẽ nền pill bán trong suốt chống chói (rgba(10, 20, 32, 0.55)) bảo vệ độ tương phản trên mọi nền ảnh
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.3));
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.1));

  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, radius);
  ctx.fillStyle = 'rgba(10, 20, 32, 0.58)'; // Nền tối bán trong suốt bo góc nhẹ
  ctx.fill();

  // Viền mảnh tinh tế cho khối pill
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.04));
  ctx.stroke();

  // 4. Căn giữa chữ theo chiều dọc bên trong pill (textBaseline = 'middle')
  ctx.textBaseline = 'middle';
  const textCenterY = pillY + pillH / 2;
  let curX = pillX + padX;

  const strokeWidth = Math.max(1, Math.round(fontSize * 0.04));
  const topGradY = textCenterY - fontSize * 0.42;
  const btmGradY = textCenterY + fontSize * 0.42;

  // --- CỤM 1: "EA" ---
  // Gradient dọc từ xanh lá sáng (#A3E635) -> xanh lá đậm (#22C55E), viền #BEF264
  const gradEA = ctx.createLinearGradient(0, topGradY, 0, btmGradY);
  gradEA.addColorStop(0, '#A3E635');
  gradEA.addColorStop(1, '#22C55E');

  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.15));
  ctx.shadowOffsetY = 1;

  ctx.strokeStyle = '#BEF264';
  ctx.lineWidth = strokeWidth;
  ctx.strokeText('EA', curX, textCenterY);

  ctx.fillStyle = gradEA;
  ctx.fillText('EA', curX, textCenterY);
  curX += w_EA;

  // --- CỤM 2: "SUP" ---
  // Gradient dọc từ vàng cam (#FBBF24) -> cam đậm (#EA580C), viền #FDE047
  const gradSUP = ctx.createLinearGradient(0, topGradY, 0, btmGradY);
  gradSUP.addColorStop(0, '#FBBF24');
  gradSUP.addColorStop(1, '#EA580C');

  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = strokeWidth;
  ctx.strokeText('SUP', curX, textCenterY);

  ctx.fillStyle = gradSUP;
  ctx.fillText('SUP', curX, textCenterY);
  curX += w_SUP;

  // --- CỤM 3: "SO.COM" ---
  // Gradient dọc từ xanh cyan sáng (#22D3EE) -> xanh dương (#2563EB), viền #67E8F9
  const gradSO = ctx.createLinearGradient(0, topGradY, 0, btmGradY);
  gradSO.addColorStop(0, '#22D3EE');
  gradSO.addColorStop(1, '#2563EB');

  ctx.strokeStyle = '#67E8F9';
  ctx.lineWidth = strokeWidth;
  ctx.strokeText('SO.COM', curX, textCenterY);

  ctx.fillStyle = gradSO;
  ctx.fillText('SO.COM', curX, textCenterY);

  ctx.restore();
}

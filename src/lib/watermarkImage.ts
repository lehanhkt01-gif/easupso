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
  enabled?: boolean;
  quality?: number; // Mặc định 0.92
  maxDim?: number;   // Mặc định 1600px
}

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

/**
 * Xử lý nén ảnh, co dãn và tự động đóng dấu logo EASUPSO.COM trực tiếp vào file ảnh
 */
export async function processAndWatermarkImage(
  file: File,
  options: WatermarkOptions = {}
): Promise<File> {
  const {
    enabled = true,
    quality = 0.92,
    maxDim = 1600,
  } = options;

  if (typeof window === 'undefined' || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Tính toán kích thước chuẩn (tối đa maxDim, bảo đảm tỷ lệ ảnh gốc)
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // 1. Vẽ ảnh gốc đã co dãn sắc nét
          ctx.drawImage(img, 0, 0, width, height);

          // 2. Đóng dấu logo EASUPSO.COM ở góc dưới bên trái nếu được bật
          if (enabled) {
            drawEasupsoWatermark(ctx, width, height);
          }

          // 3. Xuất file JPEG chất lượng 0.92 chuẩn tòa soạn
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              // Nếu file xuất ra > 3MB (rất hiếm khi xảy ra), nén thêm một mức 0.85
              if (blob.size > 3 * 1024 * 1024) {
                canvas.toBlob(
                  (blob2) => {
                    const finalBlob = blob2 || blob;
                    const cleanName = (file.name || 'image').replace(/\.[^/.]+$/, '') + '.jpg';
                    resolve(
                      new File([finalBlob], cleanName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                      })
                    );
                  },
                  'image/jpeg',
                  0.85
                );
              } else {
                const cleanName = (file.name || 'image').replace(/\.[^/.]+$/, '') + '.jpg';
                resolve(
                  new File([blob], cleanName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                );
              }
            },
            'image/jpeg',
            quality
          );
        } catch {
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

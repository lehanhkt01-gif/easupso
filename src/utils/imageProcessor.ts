/**
 * BỘ XỬ LÝ ẢNH CHUẨN TOÀN HỆ THỐNG EASUPSO.COM
 * Tự động nén ảnh dưới 1MB và ghép logo thương hiệu EASUPSO.COM
 */
export {
  compressImageUnder1MB,
  processAndWatermarkImage,
  drawEasupsoWatermark,
  type WatermarkOptions,
  type ProcessedImageFile,
} from '@/lib/watermarkImage';

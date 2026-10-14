/**
 * Quản lý Album hình ảnh bản tin (Tối đa 7 tấm ảnh, mỗi tấm < 5MB)
 * Hệ thống Cổng thông tin easupso.com
 */

export const MAX_ARTICLE_IMAGES = 7;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Loại bỏ triệt để các khối Gallery, metadata marker và các đoạn văn bản rác phát sinh
 */
export function stripGalleryFromHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // 1. Gỡ bỏ marker JSON ẩn
  cleaned = cleaned.replace(/<!--\s*EASUPSO_GALLERY:[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<!--\s*END_EASUPSO_GALLERY\s*-->/gi, '');

  // 2. Gỡ bỏ khối div gallery HTML cũ nếu có
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*easup-photo-gallery[^"]*"[\s\S]*?(?:<\/div>\s*<!--\s*END_EASUPSO_GALLERY\s*-->|<\/div>\s*<\/div>\s*<\/div>|<\/div>\s*$)/gi, '');

  // 3. Gỡ bỏ các thẻ đoạn văn <p> chứa tàn dư text của gallery cũ (cả có dấu lẫn không dấu)
  cleaned = cleaned.replace(/<p[^>]*>\s*(?:📸\s*)?[hH][ìií]nh\s*[ảaá]nh\s*ph[óo]ng\s*s[ựu]\s*ho[ạa]t\s*[đd][ộo]ng[\s\S]*?<\/p>/gi, '');
  cleaned = cleaned.replace(/<p[^>]*>\s*[bB][ảa]n\s*quy[ềe]n\s*[ảa]nh:?[\s\S]*?<\/p>/gi, '');
  cleaned = cleaned.replace(/<p[^>]*>\s*[ảaẢA][nN]h\s*\d+\s*\/\s*\d+\s*<\/p>/gi, '');

  // 4. Gỡ bỏ các dòng text trần nếu nội dung đã bị strip thẻ HTML trước đó
  cleaned = cleaned.replace(/^[ \t]*(?:📸\s*)?[hH][ìií]nh\s*[ảaá]nh\s*ph[óo]ng\s*s[ựu]\s*ho[ạa]t\s*[đd][ộo]ng.*$/gim, '');
  cleaned = cleaned.replace(/^[ \t]*[bB][ảa]n\s*quy[ềe]n\s*[ảa]nh:?.*$/gim, '');
  cleaned = cleaned.replace(/^[ \t]*[ảaẢA][nN]h\s*\d+\s*\/\s*\d+.*$/gim, '');

  // 5. Dọn dẹp thẻ <p> rỗng và dòng trống liên tiếp
  cleaned = cleaned.replace(/<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Đóng gói nội dung bài viết và danh sách tối đa 7 ảnh phóng sự dưới dạng Metadata marker sạch
 * Tuyệt đối không nhúng trực tiếp khối HTML cứng vào DB để tránh trùng lặp và vỡ giao diện.
 */
export function bundleContentWithGallery(rawHtml: string, images: string[] = []): string {
  const cleanedHtml = stripGalleryFromHtml(rawHtml);

  // Lọc danh sách URL ảnh hợp lệ (Tối đa 7 tấm)
  const validImages = images
    .filter((img) => typeof img === 'string' && img.trim().length > 0)
    .slice(0, MAX_ARTICLE_IMAGES);

  if (validImages.length === 0) {
    return cleanedHtml;
  }

  const marker = `<!-- EASUPSO_GALLERY:${JSON.stringify(validImages)} -->`;
  return `${marker}\n${cleanedHtml}`;
}

/**
 * Trích xuất danh sách tối đa 7 ảnh từ nội dung bài viết
 */
export function extractGalleryImages(contentHtml: string, fallbackThumb?: string | null): string[] {
  if (!contentHtml) return fallbackThumb ? [fallbackThumb] : [];

  const match = contentHtml.match(/<!--\s*EASUPSO_GALLERY:(\[[\s\S]*?\])\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, MAX_ARTICLE_IMAGES);
      }
    } catch {}
  }

  // Quét các thẻ img src trong contentHtml nếu không có marker
  const imgMatches = contentHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
  const foundImages: string[] = [];
  for (const m of imgMatches) {
    if (m[1] && !foundImages.includes(m[1])) {
      foundImages.push(m[1]);
      if (foundImages.length >= MAX_ARTICLE_IMAGES) break;
    }
  }

  if (foundImages.length > 0) return foundImages;
  return fallbackThumb ? [fallbackThumb] : [];
}

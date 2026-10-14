/**
 * Quản lý Album hình ảnh bản tin (Tối đa 7 tấm ảnh, mỗi tấm < 5MB)
 * Hệ thống Cổng thông tin easupso.com
 */

export const MAX_ARTICLE_IMAGES = 7;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Đóng gói nội dung bài viết và danh sách tối đa 7 ảnh phóng sự
 */
export function bundleContentWithGallery(rawHtml: string, images: string[] = []): string {
  // 1. Dọn dẹp marker và gallery cũ
  let cleaned = (rawHtml || '')
    .replace(/<!-- EASUPSO_GALLERY:\[.*?\] -->/g, '')
    .replace(/<div class="easup-photo-gallery".*?<\/div><!-- END_EASUPSO_GALLERY -->/s, '')
    .trim();

  // 2. Lọc danh sách URL ảnh hợp lệ (Tối đa 7 tấm)
  const validImages = images
    .filter((img) => typeof img === 'string' && img.trim().length > 0)
    .slice(0, MAX_ARTICLE_IMAGES);

  if (validImages.length === 0) return cleaned;

  const marker = `<!-- EASUPSO_GALLERY:${JSON.stringify(validImages)} -->`;
  
  const galleryHtml = `
<div class="easup-photo-gallery my-6 pt-5 border-t-2 border-[#D5CBBA]">
  <div class="flex items-center justify-between mb-3.5">
    <h4 class="text-sm font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-2">
      <span class="text-base">📸</span>
      <span>Hình ảnh phóng sự hoạt động (${validImages.length} tấm ảnh)</span>
    </h4>
    <span class="text-[11px] text-[#6B7C73] italic">Bản quyền ảnh: Xã Ea Súp</span>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
    ${validImages
      .map(
        (url, idx) => `
      <div class="rounded-xl overflow-hidden border border-[#D5CBBA] shadow-xs group aspect-[4/3] bg-gray-100 relative">
        <img src="${url}" alt="Hình ảnh hoạt động ${idx + 1}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />
        <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
          Ảnh ${idx + 1}/${validImages.length}
        </span>
      </div>`
      )
      .join('')}
  </div>
</div><!-- END_EASUPSO_GALLERY -->`;

  return `${marker}\n${cleaned}\n${galleryHtml}`;
}

/**
 * Trích xuất danh sách tối đa 7 ảnh từ nội dung bài viết
 */
export function extractGalleryImages(contentHtml: string, fallbackThumb?: string | null): string[] {
  if (!contentHtml) return fallbackThumb ? [fallbackThumb] : [];

  const match = contentHtml.match(/<!-- EASUPSO_GALLERY:(\[.*?\]) -->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, MAX_ARTICLE_IMAGES);
      }
    } catch {}
  }

  // Nếu không có marker, quét tất cả thẻ img src trong contentHtml
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

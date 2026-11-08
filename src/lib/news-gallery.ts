/**
 * Quản lý Album hình ảnh bản tin & Tòa soạn số (Tối đa 7 tấm ảnh, mỗi tấm < 5MB)
 * Hệ thống Cổng thông tin easupso.com — Tiêu chuẩn Editorial @hallmark
 */

export const MAX_ARTICLE_IMAGES = 7;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type ImagePlacement =
  | 'auto'      // Tự động sắp xếp thông minh xen kẽ
  | 'lead'      // Đầu bài viết (Ngay dưới Sapo)
  | 'after-p1'  // Sau Đoạn văn số 1
  | 'after-p2'  // Sau Đoạn văn số 2
  | 'after-p3'  // Sau Đoạn văn số 3
  | 'after-p4'  // Sau Đoạn văn số 4
  | 'pair'      // Ghép đôi 2 ảnh song song
  | 'bottom';   // Cuối bài viết (Phóng sự ảnh)

export interface ArticleMediaItem {
  url: string;
  caption?: string;
  placement?: ImagePlacement;
  isCover?: boolean;
  size?: number;
}

/**
 * Chuẩn hóa một phần tử media (hỗ trợ cả chuỗi URL đơn giản và đối tượng chi tiết)
 */
export function normalizeMediaItem(item: string | ArticleMediaItem, index = 0): ArticleMediaItem {
  if (typeof item === 'string') {
    return {
      url: item.trim(),
      caption: '',
      placement: 'auto',
      isCover: index === 0,
    };
  }
  return {
    url: (item.url || '').trim(),
    caption: (item.caption || '').trim(),
    placement: item.placement || 'auto',
    isCover: Boolean(item.isCover),
    size: item.size,
  };
}

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

  // 3. Xóa các đoạn text rác (dù nằm riêng hay nằm chung trong <p> với <br>)
  cleaned = cleaned.replace(/(?:<br\s*\/?>|\s)*(?:📷|📸)\s*(?:<br\s*\/?>|\s)*/giu, '');
  cleaned = cleaned.replace(/(?:<br\s*\/?>|\s)*[hH][ìií]nh\s*[ảaá]nh\s*ph[óo]ng\s*s[ựu][^<\n\r]*(?:<br\s*\/?>|\s)*/giu, '');
  cleaned = cleaned.replace(/(?:<br\s*\/?>|\s)*[bB][ảa]n\s*quy[ềe]n\s*[ảa]nh[^<\n\r]*(?:<br\s*\/?>|\s)*/giu, '');
  cleaned = cleaned.replace(/(?:<br\s*\/?>|\s)*[ảaẢA][nN]h\s*\d+\s*[\/:]\s*\d+[^<\n\r]*(?:<br\s*\/?>|\s)*/giu, '');

  // 4. Nếu là dòng text trần chỉ chứa icon máy ảnh hoặc chú thích ảnh
  cleaned = cleaned.replace(/^[ \t]*(?:(?:📷|📸)|[hH][ìií]nh\s*[ảaá]nh\s*ph[óo]ng\s*s[ựu]|[bB][ảa]n\s*quy[ềe]n\s*[ảa]nh|[ảaẢA][nN]h\s*\d+\s*[\/:]\s*\d+)[ \t]*$/gimu, '');

  // 5. Xóa các thẻ <p> rỗng còn sót lại và làm sạch định dạng dòng
  cleaned = cleaned.replace(/<p[^>]*>(?:\s*|<br\s*\/?>|&nbsp;)*<\/p>/gi, '');
  // Chuyển ngắt dòng đôi thành phân đoạn tách biệt </p><p> để giữ nguyên cấu trúc đoạn văn bản
  cleaned = cleaned.replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>');
  cleaned = cleaned.replace(/<br\s*\/?>\s*<\/p>/gi, '</p>');
  cleaned = cleaned.replace(/<p[^>]*>\s*<br\s*\/?>/gi, '<p>');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Đóng gói nội dung bài viết và danh sách tối đa 7 ảnh phóng sự kèm caption & placement dưới dạng Metadata marker sạch
 */
export function bundleContentWithGallery(
  rawHtml: string,
  media: (string | ArticleMediaItem)[] = []
): string {
  const cleanedHtml = stripGalleryFromHtml(rawHtml);

  // Lọc và chuẩn hóa tối đa 7 phần tử media
  const validMedia: ArticleMediaItem[] = (media || [])
    .map((item, idx) => normalizeMediaItem(item, idx))
    .filter((item) => typeof item.url === 'string' && item.url.trim().length > 0)
    .slice(0, MAX_ARTICLE_IMAGES);

  if (validMedia.length === 0) {
    return cleanedHtml;
  }

  // Đảm bảo ít nhất 1 ảnh được đánh dấu ảnh bìa
  if (!validMedia.some((m) => m.isCover)) {
    validMedia[0].isCover = true;
  }

  const marker = `<!-- EASUPSO_GALLERY:${JSON.stringify(validMedia)} -->`;
  return `${marker}\n${cleanedHtml}`;
}

/**
 * Trích xuất danh sách media đầy đủ (kèm Caption và Placement) từ nội dung bài viết
 */
export function extractGalleryMedia(
  contentHtml: string,
  fallbackThumb?: string | null
): ArticleMediaItem[] {
  if (!contentHtml) {
    return fallbackThumb ? [{ url: fallbackThumb, caption: '', placement: 'auto', isCover: true }] : [];
  }

  const match = contentHtml.match(/<!--\s*EASUPSO_GALLERY:(\[[\s\S]*?\])\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((item: any, idx: number) => normalizeMediaItem(item, idx))
          .filter((m) => m.url.length > 0)
          .slice(0, MAX_ARTICLE_IMAGES);
      }
    } catch {}
  }

  // Quét các thẻ img src trong contentHtml nếu không có marker
  const imgMatches = contentHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?/g);
  const foundItems: ArticleMediaItem[] = [];
  const foundUrls = new Set<string>();

  for (const m of imgMatches) {
    const src = m[1];
    const alt = m[2] || '';
    if (src && !foundUrls.has(src)) {
      foundUrls.add(src);
      foundItems.push({
        url: src,
        caption: alt,
        placement: 'auto',
        isCover: foundItems.length === 0,
      });
      if (foundItems.length >= MAX_ARTICLE_IMAGES) break;
    }
  }

  if (foundItems.length > 0) return foundItems;

  return fallbackThumb ? [{ url: fallbackThumb, caption: '', placement: 'auto', isCover: true }] : [];
}

/**
 * Trích xuất mảng URL hình ảnh đơn giản (Tương thích ngược 100%)
 */
export function extractGalleryImages(contentHtml: string, fallbackThumb?: string | null): string[] {
  return extractGalleryMedia(contentHtml, fallbackThumb).map((item) => item.url);
}

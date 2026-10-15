/**
 * BỘ LÀM SẠCH VÀ KHỬ KHUẨN DỮ LIỆU ĐẦU VÀO (XSS SANITIZER & INPUT CLEANER)
 * Triệt tiêu 100% nguy cơ Stored XSS trước khi ghi dữ liệu vào CSDL PostgreSQL.
 */

// Danh sách các thẻ HTML an toàn cho trình soạn thảo bản tin hành chính / Mặt trận
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'span', 'div',
  'a', 'img'
]);

// Danh sách các thuộc tính an toàn
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  th: new Set(['colspan', 'rowspan', 'align']),
  td: new Set(['colspan', 'rowspan', 'align']),
  span: new Set(['class']),
  div: new Set(['class']),
  p: new Set(['class']),
};

/**
 * Làm sạch chuỗi văn bản thông thường (tiêu đề, tên tác giả, tóm tắt)
 */
export function sanitizePlainText(input: unknown): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Loại bỏ toàn bộ thẻ HTML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // Loại bỏ ký tự điều khiển độc hại ASCII, giữ nguyên vẹn Emoji (💐, 🎉, 🌸...) và Unicode tiếng Việt
    .trim();
}

/**
 * Khử độc HTML bản tin: Loại bỏ triệt để thẻ <script>, iframe, on* handlers và URL javascript:
 */
export function sanitizeHtml(dirtyHtml: unknown): string {
  if (typeof dirtyHtml !== 'string') return '';
  if (!dirtyHtml.trim()) return '';

  let html = dirtyHtml;

  // 1. Loại bỏ các khối thẻ độc hại cao cùng nội dung bên trong
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  html = html.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  html = html.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  html = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  html = html.replace(/<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi, '');

  // 2. Phân tích và lọc các thẻ HTML
  // Regex khớp mở thẻ, đóng thẻ và thẻ tự đóng
  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/gi, (fullMatch, rawTagName, rawAttrs) => {
    const tagName = rawTagName.toLowerCase();

    // Nếu thẻ không nằm trong whitelist -> gỡ bỏ thẻ
    if (!ALLOWED_TAGS.has(tagName)) {
      return '';
    }

    // Nếu là thẻ đóng </tag>
    if (fullMatch.startsWith('</')) {
      return `</${tagName}>`;
    }

    // Phân tích thuộc tính của thẻ mở
    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/gi;
    let match;

    const allowedForTag = ALLOWED_ATTRIBUTES[tagName] || new Set();

    while ((match = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = match[1].toLowerCase();
      const attrValue = match[2] ?? match[3] ?? match[4] ?? '';

      // Chặn mọi thuộc tính sự kiện inline (onload, onerror, onclick, onmouseover, v.v.)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Kiểm tra whitelist thuộc tính cho thẻ này
      if (!allowedForTag.has(attrName)) {
        continue;
      }

      // Kiểm tra liên kết an toàn cho href và src
      if (attrName === 'href' || attrName === 'src') {
        const trimmedVal = attrValue.trim().toLowerCase();
        // Cấm tuyệt đối javascript:, data: (ngoại trừ data:image/png an toàn nếu cần), vbscript:
        if (
          trimmedVal.startsWith('javascript:') ||
          trimmedVal.startsWith('vbscript:') ||
          (trimmedVal.startsWith('data:') && !trimmedVal.startsWith('data:image/'))
        ) {
          continue;
        }
      }

      // Đảm bảo target="_blank" luôn đi kèm rel="noopener noreferrer"
      if (attrName === 'target' && attrValue === '_blank') {
        safeAttrs.push('target="_blank"');
        safeAttrs.push('rel="noopener noreferrer"');
        continue;
      }

      // Thoát ký tự nháy kép trong giá trị thuộc tính
      const escapedVal = attrValue.replace(/"/g, '&quot;');
      safeAttrs.push(`${attrName}="${escapedVal}"`);
    }

    const attrString = safeAttrs.length > 0 ? ' ' + safeAttrs.join(' ') : '';
    const isSelfClosing = fullMatch.endsWith('/>') ? ' />' : '>';
    return `<${tagName}${attrString}${isSelfClosing}`;
  });

  return html.trim();
}

/**
 * Sinh Slug URL an toàn và thân thiện từ tiêu đề tiếng Việt
 */
export function generateVietnameseSlug(text: string): string {
  if (!text) return '';

  let slug = text.toLowerCase();

  // Đổi ký tự có dấu thành không dấu
  slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
  slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
  slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
  slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
  slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
  slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
  slug = slug.replace(/đ/gi, 'd');

  // Xóa các ký tự đặc biệt
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Đổi khoảng trắng thành dấu gạch ngang
  slug = slug.replace(/[\s-]+/g, '-');

  // Xóa gạch ngang ở đầu và cuối
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Eye,
  MapPin,
  Share2,
  Printer,
  Minus,
  Plus,
  Copy,
  Check,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Quote,
  Feather,
} from 'lucide-react';
import { ArticleMediaItem, ImagePlacement } from '@/lib/news-gallery';
import { NewsAudioPlayer } from './NewsAudioPlayer';

interface EditorialArticleViewProps {
  newsId?: string;
  title: string;
  summary: string;
  contentHtml: string;
  mediaItems: ArticleMediaItem[];
  categoryName?: string;
  villageName?: string | null;
  authorName?: string | null;
  authorPosition?: string | null;
  publishedAt?: string | Date | null;
  viewCount?: number;
  slug?: string;
  beneficiaryName?: string | null;
  nextArticle?: {
    id: string;
    title: string;
    slug: string;
    summary?: string | null;
  } | null;
}

export function EditorialArticleView({
  newsId,
  title,
  summary,
  contentHtml,
  mediaItems = [],
  categoryName = 'Ủy ban MTTQ xã',
  villageName,
  authorName,
  authorPosition,
  publishedAt,
  viewCount = 0,
  slug,
  beneficiaryName,
  nextArticle,
}: EditorialArticleViewProps) {
  // Điều chỉnh cỡ chữ đọc báo (15px -> 21px, mặc định 17px)
  const [fontSize, setFontSize] = useState<number>(17);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Lọc danh sách media hợp lệ
  const validMedia = useMemo(() => {
    return (mediaItems || []).filter((m) => m && typeof m.url === 'string' && m.url.trim().length > 0);
  }, [mediaItems]);

  // Điều khiển phím Escape và Mũi tên trái / phải cho Lightbox
  const handleCloseLightbox = useCallback(() => setLightboxIndex(null), []);
  const handlePrevLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev === null || prev === 0 ? validMedia.length - 1 : prev - 1));
  }, [validMedia.length]);
  const handleNextLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev === null || prev === validMedia.length - 1 ? 0 : prev + 1));
  }, [validMedia.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleCloseLightbox, handlePrevLightbox, handleNextLightbox]);

  // Sao chép liên kết
  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      const url = slug ? `https://easupso.com/news/${slug}` : window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  }

  // In bài báo
  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  // Chia sẻ Zalo và Facebook
  const pageUrl = typeof window !== 'undefined' && slug ? `https://easupso.com/news/${slug}` : (slug ? `https://easupso.com/news/${slug}` : 'https://easupso.com');
  const zaloShareUrl = `https://sp.zalo.me/share?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(title || '')}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

  // Hàm chia sẻ đa nền tảng (Web Share API + Popover Fallback)
  async function handleShare() {
    const url = slug ? `https://easupso.com/news/${slug}` : (typeof window !== 'undefined' ? window.location.href : 'https://easupso.com');
    const shareData = {
      title: title || 'Cổng thông tin xã Ea Súp',
      text: summary || title || 'Bản tin từ Hệ sinh thái số xã Ea Súp (easupso.com)',
      url: url,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Nếu không hỗ trợ Web Share API (như trên desktop): Bật menu lựa chọn
    setShowShareMenu((prev) => !prev);
  }

  // Tách và chuẩn hóa các khối nội dung bài viết
  const parsedBlocks = useMemo(() => {
    if (!contentHtml) return [];

    let clean = contentHtml;
    // Bỏ metadata marker nếu còn sót
    clean = clean.replace(/<!--\s*EASUPSO_GALLERY:[\s\S]*?-->/gi, '');

    // Nếu chứa các thẻ HTML cấu trúc
    const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (tempDiv) {
      // Trước khi gán vào tempDiv, biến các cặp ngắt dòng <br/><br/> thành thẻ <p> riêng biệt
      clean = clean.replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>');

      tempDiv.innerHTML = clean;
      const nodes = Array.from(tempDiv.childNodes);
      const blocks: Array<{ type: 'p' | 'h2' | 'h3' | 'blockquote' | 'raw'; html: string; text: string }> = [];

      nodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          const text = el.textContent || '';
          if (!text.trim() && !el.querySelector('img')) return;

          // Nếu thẻ <p> này bên trong chứa <br/> giữa các đoạn văn bản
          if (tagName === 'p') {
            const innerHtml = el.innerHTML;
            if (/<br\s*\/?>/i.test(innerHtml)) {
              const subParas = innerHtml.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
              if (subParas.length > 1) {
                subParas.forEach((sub) => {
                  blocks.push({ type: 'p', html: sub, text: sub.replace(/<[^>]*>/g, '').trim() });
                });
                return;
              }
            }
          }

          if (tagName === 'h2') {
            blocks.push({ type: 'h2', html: el.innerHTML, text });
          } else if (tagName === 'h3') {
            blocks.push({ type: 'h3', html: el.innerHTML, text });
          } else if (tagName === 'blockquote') {
            blocks.push({ type: 'blockquote', html: el.innerHTML, text });
          } else if (tagName === 'p') {
            blocks.push({ type: 'p', html: el.innerHTML, text });
          } else {
            blocks.push({ type: 'raw', html: el.outerHTML, text });
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() || '';
          if (text) {
            blocks.push({ type: 'p', html: text.replace(/\n/g, '<br/>'), text });
          }
        }
      });

      // Hỗ trợ bản tin cũ đã lưu thành 1 thẻ <p> chứa nhiều đoạn ngắt bởi <br/>:
      if (blocks.length === 1 && blocks[0].type === 'p' && /<br\s*\/?>/i.test(blocks[0].html)) {
        const parts = blocks[0].html.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const subBlocks: Array<{ type: 'p'; html: string; text: string }> = [];
          let currentChunk: string[] = [];

          parts.forEach((line) => {
            currentChunk.push(line);
            const plainText = line.replace(/<[^>]*>/g, '').trim();
            // Nếu dòng không kết thúc bằng dấu : và có độ dài câu hoàn chỉnh (> 50 ký tự)
            if (!line.endsWith(':') && plainText.length > 50) {
              subBlocks.push({
                type: 'p',
                html: currentChunk.join('<br/>'),
                text: currentChunk.map((c) => c.replace(/<[^>]*>/g, '').trim()).join(' '),
              });
              currentChunk = [];
            }
          });

          if (currentChunk.length > 0) {
            subBlocks.push({
              type: 'p',
              html: currentChunk.join('<br/>'),
              text: currentChunk.map((c) => c.replace(/<[^>]*>/g, '').trim()).join(' '),
            });
          }

          if (subBlocks.length > 1) {
            return subBlocks;
          }
        }
      }

      if (blocks.length > 0) return blocks;
    }

    // Fallback: Tách bằng regex đoạn văn bản
    const rawParagraphs = clean
      .split(/(?:<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\n+)/gi)
      .map((p) => p.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '').trim())
      .filter(Boolean);

    return rawParagraphs.map((p) => {
      if (p.startsWith('## ')) {
        return { type: 'h2' as const, html: p.slice(3).trim(), text: p.slice(3).trim() };
      }
      if (p.startsWith('### ')) {
        return { type: 'h3' as const, html: p.slice(4).trim(), text: p.slice(4).trim() };
      }
      if (p.startsWith('> ')) {
        return { type: 'blockquote' as const, html: p.slice(2).trim(), text: p.slice(2).trim() };
      }
      return { type: 'p' as const, html: p, text: p };
    });
  }, [contentHtml]);

  // THUẬT TOÁN DÀN TRANG HÌNH ẢNH THÔNG MINH BẢO ĐẢM HIỂN THỊ ĐẦY ĐỦ 100% ẢNH (Zero Dropped Images)
  const layout = useMemo(() => {
    const totalBlocks = parsedBlocks.length;
    const placedUrls = new Set<string>();

    const byParagraph: Record<number, ArticleMediaItem[]> = {};
    for (let i = 0; i < totalBlocks; i++) {
      byParagraph[i] = [];
    }
    const pair: ArticleMediaItem[] = [];
    const bottom: ArticleMediaItem[] = [];
    const lead: ArticleMediaItem[] = [];

    if (validMedia.length === 0) {
      return { lead, byParagraph, pair, bottom };
    }

    // 1. Xác định ảnh Lead (Đầu bài viết ngay dưới đoạn Sapo)
    // Ưu tiên 1: Ảnh được chọn tường minh là 'lead'
    let leadCandidate = validMedia.find((m) => m.placement === 'lead');
    // Ưu tiên 2: Ảnh được chọn làm ảnh bìa (isCover)
    if (!leadCandidate) {
      leadCandidate = validMedia.find((m) => m.isCover);
    }
    // Ưu tiên 3: Ảnh đầu tiên trong danh sách (#1)
    if (!leadCandidate && validMedia.length > 0) {
      leadCandidate = validMedia[0];
    }

    if (leadCandidate) {
      lead.push(leadCandidate);
      placedUrls.add(leadCandidate.url);
    }

    // 2. Danh sách ảnh còn lại theo đúng thứ tự mảng đã sắp xếp
    const remainingMedia = validMedia.filter((m) => !placedUrls.has(m.url));
    const autoItems: ArticleMediaItem[] = [];

    // 3. Phân bổ các ảnh có vị trí chỉ định cụ thể
    remainingMedia.forEach((media) => {
      const p = media.placement || 'auto';
      if (p === 'after-p1') {
        if (totalBlocks >= 1) {
          byParagraph[0].push(media);
          placedUrls.add(media.url);
        } else {
          autoItems.push(media);
        }
      } else if (p === 'after-p2') {
        if (totalBlocks >= 2) {
          byParagraph[1].push(media);
          placedUrls.add(media.url);
        } else {
          autoItems.push(media);
        }
      } else if (p === 'after-p3') {
        if (totalBlocks >= 3) {
          byParagraph[2].push(media);
          placedUrls.add(media.url);
        } else {
          autoItems.push(media);
        }
      } else if (p === 'after-p4') {
        if (totalBlocks >= 4) {
          byParagraph[3].push(media);
          placedUrls.add(media.url);
        } else {
          autoItems.push(media);
        }
      } else if (p === 'pair') {
        pair.push(media);
        placedUrls.add(media.url);
      } else if (p === 'bottom') {
        bottom.push(media);
        placedUrls.add(media.url);
      } else if (p === 'lead') {
        lead.push(media);
        placedUrls.add(media.url);
      } else {
        autoItems.push(media);
      }
    });

    // 4. Phân bổ các ảnh ở chế độ 'auto' (và ảnh chỉ định vào đoạn văn không tồn tại)
    // Tìm các đoạn văn thực tế còn trống (tối đa xen kẽ trong 4 đoạn đầu tiên)
    const availableSlots: number[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      if (i < 4 && byParagraph[i].length === 0) {
        availableSlots.push(i);
      }
    }

    let autoIdx = 0;
    for (const slot of availableSlots) {
      if (autoIdx >= autoItems.length) break;
      const targetPhoto = autoItems[autoIdx++];
      byParagraph[slot].push(targetPhoto);
      placedUrls.add(targetPhoto.url);
    }

    // 5. Các ảnh auto còn lại:
    // Nếu còn >= 2 ảnh: Ghép cặp diptych 2 cột (pair)
    // Nếu còn lẻ 1 ảnh: Đưa xuống cuối bài (bottom)
    const leftovers = autoItems.slice(autoIdx);
    while (leftovers.length >= 2) {
      const first = leftovers.shift()!;
      const second = leftovers.shift()!;
      pair.push(first);
      pair.push(second);
      placedUrls.add(first.url);
      placedUrls.add(second.url);
    }
    if (leftovers.length === 1) {
      const last = leftovers.shift()!;
      bottom.push(last);
      placedUrls.add(last.url);
    }

    // 6. LƯỚI BẢO HIỂM TUYỆT ĐỐI (ZERO DROPPED IMAGES GUARANTEE):
    // Quét lại toàn bộ validMedia, cam đoan 100% ảnh đã tải lên phải được hiển thị trọn vẹn
    validMedia.forEach((m) => {
      if (!placedUrls.has(m.url)) {
        bottom.push(m);
        placedUrls.add(m.url);
      }
    });

    return {
      lead,
      byParagraph,
      pair,
      bottom,
    };
  }, [validMedia, parsedBlocks.length]);

  // Hàm render một khung hình ảnh chuẩn `<figure>` và `<figcaption>`
  function renderFigure(item: ArticleMediaItem, customClass = '') {
    const originalIndex = validMedia.findIndex((m) => m.url === item.url);
    const captionText = item.caption?.trim() || '';

    return (
      <figure
        key={item.url}
        className={`my-6 sm:my-8 rounded-xl overflow-hidden border border-[#E8E2D5] bg-[#FAF7F2] shadow-xs group ${customClass}`}
      >
        {/* Khung ảnh */}
        <div
          onClick={() => setLightboxIndex(originalIndex >= 0 ? originalIndex : 0)}
          className="relative overflow-hidden cursor-pointer bg-stone-100"
          role="button"
          tabIndex={0}
          aria-label={`Xem ảnh lớn: ${captionText || title}`}
        >
          <img
            src={item.url}
            alt={captionText || title}
            className="w-full h-auto max-h-[580px] object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-white/90 text-[#1B4332] font-semibold text-xs shadow-md flex items-center gap-1.5 backdrop-blur-xs">
              <ZoomIn className="w-4 h-4 text-[#C85A32]" />
              <span>Phóng to xem nét cao</span>
            </span>
          </div>
          {item.isCover && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#1B4332]/90 text-[#D4AF37] font-bold text-[11px] shadow-sm backdrop-blur-xs">
              ★ Ảnh bìa bản tin
            </span>
          )}
        </div>

        {/* Dòng ghi chú hình ảnh (Photo Caption) */}
        <figcaption className="px-4 py-2.5 bg-[#F4F1EA] border-l-4 border-[#D4AF37] text-xs sm:text-sm text-[#374151] font-medium italic leading-relaxed flex items-start gap-2">
          <Camera className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
          <div className="flex-1">
            {captionText ? (
              <span>{captionText}</span>
            ) : (
              <span className="not-italic text-[#6B7C73]">
                Hình ảnh tư liệu hoạt động &bull; Cổng thông tin xã Ea Súp
              </span>
            )}
          </div>
        </figcaption>
      </figure>
    );
  }

  // Hàm render cặp 2 ảnh song song (2-Column Diptych)
  function renderPairGrid(items: ArticleMediaItem[]) {
    if (!items || items.length === 0) return null;

    const pairs: ArticleMediaItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push(items.slice(i, i + 2));
    }

    return (
      <div className="my-6 sm:my-8 space-y-4">
        {pairs.map((pair, pIdx) => (
          <div
            key={pIdx}
            className={`grid gap-4 ${
              pair.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {pair.map((item) => renderFigure(item, 'my-0! sm:my-0!'))}
          </div>
        ))}
      </div>
    );
  }

  // Tác giả mặc định trang nhã (chỉ lấy họ tên, loại bỏ phần ngoặc đơn chức danh)
  const rawAuthor = authorName?.trim() || 'Ủy ban MTTQ Việt Nam xã Ea Súp';
  const finalAuthor = rawAuthor.replace(/\s*\([^)]*\)\s*$/, '').trim() || rawAuthor;

  return (
    <article className="bg-white rounded-2xl border border-[#E8E2D5] shadow-sm overflow-hidden text-[#14211B]">
      
      {/* 1. EDITORIAL HEADER */}
      <div className="px-5 py-5 sm:px-10 sm:pt-7 sm:pb-3.5 border-b border-[#E8E2D5] bg-gradient-to-b from-[#FAF7F2] to-white">
        
        {/* Hàng badge & nút Nghe đọc */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Huy hiệu chuyên mục, Nút Nghe đọc (đỏ chữ vàng) & Thôn buôn */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#1B4332] text-white shadow-xs">
              {categoryName}
            </span>

            {/* NÚT NGHE ĐỌC: ĐẶT BÊN TRÁI CẠNH DÒNG CHỮ "ỦY BAN MTTQ XÃ", NỀN ĐỎ CHỮ VÀNG */}
            <NewsAudioPlayer
              newsId={newsId || slug || 'article'}
              title={title}
              summary={summary}
              contentHtml={contentHtml}
              nextArticle={nextArticle}
            />

            {villageName && (
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#FAF0EC] text-[#C85A32] border border-[#EBBAA7] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{villageName}</span>
              </span>
            )}
            {beneficiaryName && (
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#FCF8EC] text-[#AA8C2C] border border-[#F3E4B3]">
                Ủy quyền đưa tin: {beneficiaryName}
              </span>
            )}
          </div>
        </div>

        {/* TIÊU ĐỀ BÁO CHÍ (HEADLINE - TUYỆT ĐỐI KHÔNG IN NGHIÊNG) */}
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#1B4332] leading-[1.3] tracking-tight mb-3 break-words">
          {title}
        </h1>

        {/* Thông tin metadata thời gian & tác giả */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E2D5] text-xs text-[#6B7C73]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1B4332] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-xs">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#14211B] text-xs sm:text-sm">{finalAuthor}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>
                {publishedAt
                  ? new Date(publishedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Vừa đăng'}
              </span>
            </span>

            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#6B7C73]" />
              <span>{Number(viewCount) + 1}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. ĐOẠN DẪN (SAPO BÀI BÁO) - THU HẸP KHOẢNG CÁCH GẦN TIÊU ĐỀ */}
      {summary && (
        <div className="max-w-[760px] mx-auto px-6 sm:px-10 pt-4 sm:pt-5">
          <div className="p-3.5 sm:p-4.5 bg-[#FAF7F2] rounded-xl border-l-4 border-[#C85A32] shadow-xs">
            <p className="text-base sm:text-lg font-semibold text-[#14211B] leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* ẢNH ĐẦU BÀI (LEAD PHOTO - NGAY DƯỚI SAPO) */}
      {layout.lead.length > 0 && (
        <div className="max-w-[760px] mx-auto px-6 sm:px-10">
          {layout.lead.map((item) => renderFigure(item))}
        </div>
      )}

      {/* 3. THÂN BÀI VIẾT (EDITORIAL BODY & SMART PLACEMENT) */}
      <div
        className="max-w-[760px] mx-auto px-6 sm:px-10 py-6 text-[#14211B] text-justify leading-[1.8]"
        style={{ fontSize: `${fontSize}px` }}
      >
        {parsedBlocks.map((block, idx) => {
          return (
            <React.Fragment key={idx}>
              {/* Render Block */}
              {block.type === 'h2' && (
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1B4332] mt-8 mb-4 pt-4 border-t border-[#E8E2D5] leading-snug">
                  {block.text}
                </h2>
              )}

              {block.type === 'h3' && (
                <h3 className="text-lg sm:text-xl font-bold text-[#C85A32] mt-6 mb-3 leading-snug">
                  {block.text}
                </h3>
              )}

              {block.type === 'blockquote' && (
                <blockquote className="my-6 p-4 sm:p-5 bg-[#FAF7F2] rounded-xl border-l-4 border-[#1B4332] italic text-[#14211B] flex gap-3">
                  <Quote className="w-6 h-6 text-[#D4AF37] shrink-0" />
                  <div className="font-medium" dangerouslySetInnerHTML={{ __html: block.html }} />
                </blockquote>
              )}

              {block.type === 'p' && (
                <p
                  className="mb-4 sm:mb-5 indent-7 sm:indent-8 leading-[1.85] text-justify"
                  dangerouslySetInnerHTML={{ __html: block.html }}
                />
              )}

              {block.type === 'raw' && (
                <div className="mb-5" dangerouslySetInnerHTML={{ __html: block.html }} />
              )}

              {/* DÀN ẢNH XEN KẼ THÔNG MINH THEO TỪNG ĐOẠN VĂN */}
              {layout.byParagraph[idx] && layout.byParagraph[idx].length > 0 && (
                layout.byParagraph[idx].map((item) => renderFigure(item))
              )}
            </React.Fragment>
          );
        })}

        {/* CỤM ẢNH GHÉP ĐÔI SONG SONG (NẾU CÓ) */}
        {layout.pair.length > 0 && renderPairGrid(layout.pair)}

        {/* CỤM ẢNH CUỐI BÀI VIẾT (PHÓNG SỰ ẢNH) */}
        {layout.bottom.length > 0 && (
          <div className="mt-8 pt-6 border-t-2 border-[#D5CBBA]">
            <h4 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-2 mb-4">
              <Camera className="w-4 h-4 text-[#C85A32]" />
              <span>Hình ảnh phóng sự hoạt động ({layout.bottom.length} tấm)</span>
            </h4>
            {layout.bottom.map((item) => renderFigure(item))}
          </div>
        )}

        {/* 4. CHỮ KÝ TÁC GIẢ / NGUỒN BẢN TIN Ở CUỐI BÀI */}
        <div className="mt-10 pt-6 border-t border-[#E8E2D5] flex justify-end">
          <div className="text-right">
            <p className="font-bold text-sm sm:text-base text-[#1B4332] uppercase tracking-wide">
              {finalAuthor}
            </p>
            <p className="text-xs text-[#6B7C73] mt-0.5">
              Cổng thông tin Chuyển đổi số xã Ea Súp (easupso.com)
            </p>
          </div>
        </div>
      </div>

      {/* 5. KHỐI CHIA SẺ BẢN TIN ĐA NỀN TẢNG */}
      <div className="px-6 sm:px-10 py-4 bg-[#FAF7F2] border-t border-[#E8E2D5] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1B4332] uppercase tracking-wide">
          <Share2 className="w-4 h-4 text-[#C85A32]" />
          <span>Chia sẻ</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition cursor-pointer"
            title="Chia sẻ đến các ứng dụng (Zalo, Facebook, Tin nhắn...)"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>

          {/* Menu chia sẻ đa nền tảng (Dự phòng cho máy tính hoặc trình duyệt không hỗ trợ Web Share) */}
          {showShareMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-56 sm:w-64 bg-white rounded-2xl border border-[#E8E2D5] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 border-b border-[#E8E2D5] flex items-center justify-between text-[11px] font-bold text-[#6B7C73] uppercase tracking-wider">
                <span>Chia sẻ bản tin</span>
                <button
                  type="button"
                  onClick={() => setShowShareMenu(false)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-1 space-y-1">
                {/* Zalo */}
                <a
                  href={zaloShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#14211B] hover:bg-[#0068FF]/10 hover:text-[#0068FF] transition"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#0068FF] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    Z
                  </span>
                  <span>Chia sẻ qua Zalo</span>
                </a>

                {/* Facebook */}
                <a
                  href={fbShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#14211B] hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    f
                  </span>
                  <span>Chia sẻ lên Facebook</span>
                </a>

                {/* Sao chép link */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyLink();
                    setTimeout(() => setShowShareMenu(false), 900);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#14211B] hover:bg-[#FAF7F2] transition text-left cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0">
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </div>
                  <span>{copiedLink ? 'Đã chép liên kết!' : 'Sao chép liên kết'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. LIGHTBOX XEM ẢNH NÉT CAO TOÀN MÀN HÌNH */}
      {lightboxIndex !== null && validMedia[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={handleCloseLightbox}
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
            aria-label="Đóng xem ảnh"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Nút lùi */}
          {validMedia.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevLightbox();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Vùng ảnh nét cao & Caption */}
          <div
            className="max-w-5xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validMedia[lightboxIndex].url}
              alt={validMedia[lightboxIndex].caption || title}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center max-w-2xl px-4">
              <p className="text-white text-sm sm:text-base font-medium">
                {validMedia[lightboxIndex].caption || title}
              </p>
              <p className="text-white/60 text-xs mt-1 font-mono">
                Ảnh {lightboxIndex + 1} / {validMedia.length} &bull; Cổng thông tin xã Ea Súp
              </p>
            </div>
          </div>

          {/* Nút tiến */}
          {validMedia.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextLightbox();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}

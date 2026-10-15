import fs from 'fs/promises';
import path from 'path';
import { ArticleStatus, OrgCode } from '@prisma/client';
import { generateVietnameseSlug, sanitizeHtml, sanitizePlainText } from './sanitize';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';
import { extractGalleryMedia } from './news-gallery';

export interface LocalArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  thumbnailUrl: string | null;
  images?: string[];
  mediaItems?: Array<{
    url: string;
    caption?: string;
    placement?: string;
    isCover?: boolean;
    size?: number;
  }>;
  isFeatured: boolean;
  status: ArticleStatus;
  viewCount: number;
  categoryId: string;
  category: {
    id: string;
    slug: string;
    name: string;
    badgeColor: string;
  };
  villageId: string | null;
  village: {
    id: string;
    name: string;
    code: string;
    type: string;
  } | null;
  orgCode: OrgCode;
  authorId: string;
  author: {
    name: string | null;
    email: string | null;
    positionTitle?: string | null;
  };
  approvedById?: string | null;
  approvedBy?: {
    name: string | null;
  } | null;
  beneficiaryName?: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_ARTICLES_FILE = path.join(process.cwd(), 'public', 'local-articles.json');

// Danh mục chuẩn đồng bộ
export const DEFAULT_LOCAL_CATEGORIES = [
  { id: 'cat-mttq', slug: 'mat-tran-to-quoc', name: 'Ủy ban MTTQ xã', orgCode: OrgCode.MTTQ, badgeColor: 'forest' },
  { id: 'cat-phunu', slug: 'hoi-phu-nu', name: 'Hội Liên hiệp Phụ nữ', orgCode: OrgCode.PHU_NU, badgeColor: 'basalt' },
  { id: 'cat-nongdan', slug: 'hoi-nong-dan', name: 'Hội Nông dân', orgCode: OrgCode.NONG_DAN, badgeColor: 'forest' },
  { id: 'cat-doantn', slug: 'doan-thanh-nien', name: 'Đoàn TNCS Hồ Chí Minh', orgCode: OrgCode.DOAN_TN, badgeColor: 'basalt' },
  { id: 'cat-ccb', slug: 'hoi-cuu-chien-binh', name: 'Hội Cựu chiến binh', orgCode: OrgCode.CCB, badgeColor: 'forest' },
  { id: 'cat-thonbuon', slug: 'hoat-dong-thon-buon', name: 'Hoạt động 20 Thôn Buôn', orgCode: OrgCode.THON_BUON, badgeColor: 'basalt' },
  { id: 'cat-cds', slug: 'chuyen-doi-so', name: 'Chuyển đổi số & Bình dân học vụ số', orgCode: OrgCode.MTTQ, badgeColor: 'gold' },
];

// Danh sách mã định danh bản tin mẫu khởi tạo cần loại bỏ hoàn toàn
const DUMMY_SAMPLE_SLUGS = new Set([
  'ubmttq-xa-ea-sup-phat-dong-xoa-nha-tam-nam-2026',
  'hoi-nong-dan-ea-sup-canh-tac-lua-nuoc-ben-vung',
  'hoi-nong-dan-trien-khai-mo-hinh-canh-tac-lua-nuoc-thich-ung-bien-doi-khi-hau',
  'hoi-lhpn-trao-von-sinh-ke-buon-a-va-thon-8',
  'doan-thanh-nien-ra-quan-dich-vu-cong-so-thon-thang-loi',
  'hoi-ccb-trao-bo-giong-thon-doan-ket',
  'to-cong-nghe-so-cong-dong-buon-b-phat-huy-hieu-qua',
  'to-cnsdc-buon-b-phat-huy-hieu-qua-cau-noi-thong-tin-so',
]);
const DUMMY_SAMPLE_IDS = new Set(['art-001', 'art-002', 'art-003', 'art-004', 'art-005', 'art-006']);

// Khởi tạo danh sách bài viết cục bộ rỗng (không chứa bài ảo)
const INITIAL_ARTICLES: LocalArticle[] = [];

// Bộ nhớ tạm Runtime đảm bảo hệ thống không bao giờ bị gián đoạn kể cả khi quyền file bị hạn chế
let inMemoryArticles: LocalArticle[] = [];

/**
 * Ghi danh sách bản tin ra file an toàn, triệt tiêu mọi ngoại lệ EACCES
 */
async function writeArticlesFileSafe(articles: LocalArticle[]): Promise<void> {
  const cleanArticles = articles.filter(
    (a) => !DUMMY_SAMPLE_SLUGS.has(a.slug) && !DUMMY_SAMPLE_IDS.has(a.id)
  );
  inMemoryArticles = cleanArticles;
  try {
    await fs.writeFile(LOCAL_ARTICLES_FILE, JSON.stringify(cleanArticles, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[LOCAL_ARTICLES_WRITE_WARN] Không thể ghi đè file /app/public/local-articles.json (bảo vệ phân quyền):', err?.message);
    try {
      await fs.writeFile(path.join('/tmp', 'local-articles.json'), JSON.stringify(cleanArticles, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * Đọc toàn bộ danh sách bản tin từ file JSON cục bộ (tự động loại bỏ mọi bài ảo mẫu)
 */
export async function getLocalArticles(): Promise<LocalArticle[]> {
  try {
    const raw = await fs.readFile(LOCAL_ARTICLES_FILE, 'utf-8');
    const articles = JSON.parse(raw);
    if (Array.isArray(articles)) {
      const filtered = articles.filter(
        (a) => !DUMMY_SAMPLE_SLUGS.has(a.slug) && !DUMMY_SAMPLE_IDS.has(a.id)
      );
      inMemoryArticles = filtered;
      return filtered;
    }
  } catch {
    try {
      const rawTmp = await fs.readFile(path.join('/tmp', 'local-articles.json'), 'utf-8');
      const articlesTmp = JSON.parse(rawTmp);
      if (Array.isArray(articlesTmp)) {
        const filtered = articlesTmp.filter(
          (a) => !DUMMY_SAMPLE_SLUGS.has(a.slug) && !DUMMY_SAMPLE_IDS.has(a.id)
        );
        inMemoryArticles = filtered;
        return filtered;
      }
    } catch {}
  }

  // Nếu trong bộ nhớ đã có dữ liệu cập nhật
  if (inMemoryArticles && inMemoryArticles.length > 0) {
    return inMemoryArticles.filter(
      (a) => !DUMMY_SAMPLE_SLUGS.has(a.slug) && !DUMMY_SAMPLE_IDS.has(a.id)
    );
  }

  return [];
}

/**
 * Lưu bản tin mới vào kho cục bộ bền vững
 */
export async function saveLocalArticle(data: {
  id?: string;
  title: string;
  slug?: string;
  summary?: string;
  contentHtml: string;
  thumbnailUrl?: string | null;
  images?: string[];
  mediaItems?: Array<{
    url: string;
    caption?: string;
    placement?: any;
    isCover?: boolean;
    size?: number;
  }>;
  isFeatured?: boolean;
  status?: ArticleStatus;
  categoryId?: string;
  villageId?: string | null;
  orgCode?: OrgCode;
  authorId?: string;
  authorName?: string | null;
  authorEmail?: string | null;
  positionTitle?: string | null;
  approvedById?: string | null;
  beneficiaryName?: string | null;
}): Promise<LocalArticle> {
  const currentArticles = await getLocalArticles();

  const cleanTitle = sanitizePlainText(data.title);
  const cleanSummary = sanitizePlainText(data.summary || cleanTitle.slice(0, 160));
  const cleanContentHtml = sanitizeHtml(data.contentHtml);

  // Trích xuất media items từ nội dung hoặc từ tham số truyền vào
  const resolvedMedia = data.mediaItems && data.mediaItems.length > 0
    ? data.mediaItems
    : extractGalleryMedia(cleanContentHtml, data.thumbnailUrl);

  const resolvedImages = data.images && data.images.length > 0
    ? data.images
    : resolvedMedia.map((m) => m.url);

  const coverItem = resolvedMedia.find((m) => m.isCover);
  const finalThumbnailUrl = data.thumbnailUrl || (coverItem ? coverItem.url : resolvedImages[0] || null);

  let slug = data.slug || generateVietnameseSlug(cleanTitle);
  if (!slug) slug = `bai-viet-${Date.now()}`;
  if (currentArticles.some((a) => a.slug === slug)) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  // Tìm chuyên mục
  const targetCat =
    DEFAULT_LOCAL_CATEGORIES.find(
      (c) => c.id === data.categoryId || c.slug === data.categoryId || c.orgCode === data.orgCode
    ) || DEFAULT_LOCAL_CATEGORIES[0];

  // Tìm thôn buôn nếu có
  let targetVillage: LocalArticle['village'] = null;
  if (data.villageId) {
    const vMatch = EA_SUP_VILLAGES.find((v) => v.id === data.villageId || v.code === data.villageId);
    if (vMatch) {
      targetVillage = {
        id: vMatch.code,
        name: vMatch.name,
        code: vMatch.code,
        type: vMatch.type,
      };
    }
  }

  const now = new Date().toISOString();
  const newArticle: LocalArticle = {
    id: data.id || `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle,
    slug,
    summary: cleanSummary,
    contentHtml: cleanContentHtml,
    thumbnailUrl: finalThumbnailUrl,
    images: resolvedImages,
    mediaItems: resolvedMedia,
    isFeatured: Boolean(data.isFeatured),
    status: data.status || ArticleStatus.PUBLISHED,
    viewCount: 0,
    categoryId: targetCat.id,
    category: targetCat,
    villageId: targetVillage ? targetVillage.id : null,
    village: targetVillage,
    orgCode: targetCat.orgCode || data.orgCode || OrgCode.MTTQ,
    authorId: data.authorId || 'root-admin-lehanh',
    author: {
      name: data.authorName || 'Lê Hạnh (Quản trị viên Cấp cao)',
      email: data.authorEmail || 'lehanhkt01@gmail.com',
      positionTitle: data.positionTitle || 'Quản trị viên Hệ thống Cấp cao',
    },
    approvedById: data.status === ArticleStatus.PUBLISHED ? data.authorId || 'root-admin-lehanh' : null,
    approvedBy:
      data.status === ArticleStatus.PUBLISHED
        ? { name: data.authorName || 'Lê Hạnh (Quản trị viên Cấp cao)' }
        : null,
    beneficiaryName: data.beneficiaryName || null,
    publishedAt: data.status === ArticleStatus.PUBLISHED ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  // Đẩy bản tin mới lên đầu danh sách
  const updatedList = [newArticle, ...currentArticles.filter((a) => a.id !== newArticle.id)];
  await writeArticlesFileSafe(updatedList);

  return newArticle;
}

/**
 * Cập nhật bản tin trong file cục bộ
 */
export async function updateLocalArticle(
  id: string,
  updates: Partial<LocalArticle>
): Promise<LocalArticle | null> {
  const currentArticles = await getLocalArticles();
  const index = currentArticles.findIndex((a) => a.id === id || a.slug === id);
  if (index === -1) return null;

  const existing = currentArticles[index];
  const now = new Date().toISOString();

  const effectiveHtml = updates.contentHtml !== undefined ? sanitizeHtml(updates.contentHtml) : existing.contentHtml;
  const resolvedMedia = updates.mediaItems !== undefined
    ? updates.mediaItems
    : (updates.contentHtml !== undefined ? extractGalleryMedia(effectiveHtml, updates.thumbnailUrl || existing.thumbnailUrl) : existing.mediaItems);

  const resolvedImages = updates.images !== undefined
    ? updates.images
    : (resolvedMedia ? resolvedMedia.map((m) => m.url) : existing.images);

  const updated: LocalArticle = {
    ...existing,
    ...updates,
    contentHtml: effectiveHtml,
    mediaItems: resolvedMedia,
    images: resolvedImages,
    id: existing.id,
    updatedAt: now,
  };

  if (updates.status === ArticleStatus.PUBLISHED && !existing.publishedAt) {
    updated.publishedAt = now;
  }

  currentArticles[index] = updated;
  await writeArticlesFileSafe(currentArticles);
  return updated;
}

/**
 * Xóa bản tin khỏi file cục bộ
 */
export async function deleteLocalArticle(id: string): Promise<boolean> {
  const currentArticles = await getLocalArticles();
  const nextList = currentArticles.filter((a) => a.id !== id && a.slug !== id);
  if (nextList.length === currentArticles.length) return false;

  await writeArticlesFileSafe(nextList);
  return true;
}

/**
 * Tìm bản tin theo slug
 */
export async function getLocalArticleBySlug(slug: string): Promise<LocalArticle | null> {
  const articles = await getLocalArticles();
  return articles.find((a) => a.slug === slug) || null;
}

/**
 * Tìm bản tin theo id
 */
export async function getLocalArticleById(id: string): Promise<LocalArticle | null> {
  const articles = await getLocalArticles();
  return articles.find((a) => a.id === id) || null;
}

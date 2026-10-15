import fs from 'fs/promises';
import path from 'path';
import { ArticleStatus, OrgCode } from '@prisma/client';
import { generateVietnameseSlug, sanitizeHtml, sanitizePlainText } from './sanitize';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

export interface LocalArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  thumbnailUrl: string | null;
  images?: string[];
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

// Dữ liệu 6 bản tin khởi tạo mẫu phong phú sát thực tế
const INITIAL_ARTICLES: LocalArticle[] = [
  {
    id: 'art-001',
    title: 'UBMTTQ Việt Nam xã Ea Súp phát động phong trào "Chung tay xóa nhà tạm, nhà dột nát" năm 2026',
    slug: 'ubmttq-xa-ea-sup-phat-dong-xoa-nha-tam-nam-2026',
    summary: 'Ban Thường trực Ủy ban MTTQ Việt Nam xã Ea Súp kêu gọi các cơ quan, đơn vị, doanh nghiệp và các tầng lớp nhân dân đồng lòng ủng hộ, phấn đấu hoàn thành xây mới 15 căn nhà Đại đoàn kết trong năm 2026.',
    contentHtml: '<p>Sáng nay, tại Hội trường UBND xã Ea Súp, Ban Thường trực Ủy ban MTTQ Việt Nam xã Ea Súp đã chủ trì tổ chức Lễ phát động phong trào thi đua “Chung tay xóa nhà tạm, nhà dột nát” trên địa bàn 20 thôn, buôn.</p><p>Phát biểu chỉ đạo, đồng chí Lê Hồng Hạnh - Ủy viên Ban Thường vụ Đảng ủy, Chủ tịch Ủy ban MTTQ Việt Nam xã nhấn mạnh: "Mỗi ngôi nhà Đại đoàn kết được xây dựng không chỉ là mái ấm che mưa nắng, mà còn là kết tinh của tình làng nghĩa xóm, niềm tin của đồng bào vào sự lãnh đạo của Đảng và chính quyền xã."</p><p>Tại buổi lễ, các cơ quan, doanh nghiệp và các nhà hảo tâm đã trực tiếp ủng hộ và đăng ký ủng hộ vào Quỹ Vì người nghèo xã số tiền hơn 280 triệu đồng.</p>',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'],
    isFeatured: true,
    viewCount: 428,
    status: ArticleStatus.PUBLISHED,
    categoryId: 'cat-mttq',
    category: DEFAULT_LOCAL_CATEGORIES[0],
    villageId: 'THON_THANG_LOI',
    village: { id: 'THON_THANG_LOI', name: 'Thôn Thắng Lợi', code: 'THON_THANG_LOI', type: 'THON_TEN' },
    orgCode: OrgCode.MTTQ,
    authorId: 'root-admin-lehanh',
    author: { name: 'Lê Hạnh (Quản trị viên Cấp cao)', email: 'lehanhkt01@gmail.com', positionTitle: 'Quản trị viên Hệ thống Cấp cao' },
    approvedById: 'root-admin-lehanh',
    approvedBy: { name: 'Lê Hạnh (Quản trị viên Cấp cao)' },
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-002',
    title: 'Hội Nông dân xã Ea Súp triển khai mô hình canh tác lúa nước bền vững thích ứng biến đổi khí hậu',
    slug: 'hoi-nong-dan-ea-sup-canh-tac-lua-nuoc-ben-vung',
    summary: 'Mô hình liên kết sản xuất lúa chất lượng cao kết hợp phân bón hữu cơ vi sinh được triển khai thí điểm tại cánh đồng Thôn 1 và Thôn 2 với diện tích hơn 40 ha.',
    contentHtml: '<p>Nhằm nâng cao giá trị hạt gạo Ea Súp và giảm thiểu chi phí vật tư nông nghiệp, Hội Nông dân xã Ea Súp vừa phối hợp cùng Trạm Khuyến nông tổ chức hội thảo đầu bờ mô hình canh tác lúa nước bền vững.</p><p>Chủ tịch Hội Nông dân xã Nguyễn Thị Miên cho biết: "Thông qua chuyển đổi số nông nghiệp trên nền tảng easupso.com, bà con được theo dõi sát sao tình hình sâu bệnh, thời tiết và giá thu mua hàng ngày của các hợp tác xã liên kết."</p>',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80'],
    isFeatured: true,
    viewCount: 312,
    status: ArticleStatus.PUBLISHED,
    categoryId: 'cat-nongdan',
    category: DEFAULT_LOCAL_CATEGORIES[2],
    villageId: 'THON_01',
    village: { id: 'THON_01', name: 'Thôn 1', code: 'THON_01', type: 'THON_SO' },
    orgCode: OrgCode.NONG_DAN,
    authorId: 'root-admin-lehanh',
    author: { name: 'Nguyễn Thị Miên', email: 'Nguyenthimien3@gmail.com', positionTitle: 'Chủ tịch Hội Nông dân xã' },
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'art-003',
    title: 'Hội LHPN xã Ea Súp trao vốn sinh kế phụ nữ nghèo khởi nghiệp tại Buôn A và Thôn 8',
    slug: 'hoi-lhpn-trao-von-sinh-ke-buon-a-va-thon-8',
    summary: '5 hội viên phụ nữ có hoàn cảnh khó khăn tại Buôn A và Thôn 8 đã được Hội LHPN xã trao nguồn vốn vay ưu đãi không lãi suất để mua dê giống và cây ăn trái phát triển kinh tế.',
    contentHtml: '<p>Chiều qua, Hội LHPN xã Ea Súp đã tiến hành trao vốn sinh kế hỗ trợ phụ nữ nghèo khởi sự kinh doanh. Tham dự có đồng chí H\' Bun Mi Siu - Phó Chủ tịch UBMTTQ, Chủ tịch Hội LHPN xã.</p><p>Mỗi hộ gia đình được hỗ trợ vay 15 triệu đồng từ nguồn quỹ xoay vòng sinh kế của Hội, đồng thời được cán bộ nông nghiệp xã hướng dẫn kỹ thuật chuồng trại.</p>',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80'],
    isFeatured: false,
    viewCount: 195,
    status: ArticleStatus.PUBLISHED,
    categoryId: 'cat-phunu',
    category: DEFAULT_LOCAL_CATEGORIES[1],
    villageId: 'BUON_A',
    village: { id: 'BUON_A', name: 'Buôn A', code: 'BUON_A', type: 'BUON' },
    orgCode: OrgCode.PHU_NU,
    authorId: 'root-admin-lehanh',
    author: { name: "H' Bun Mi Siu", email: 'bunmisiu@gmail.com', positionTitle: 'Chủ tịch Hội LHPN xã' },
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'art-004',
    title: 'Đoàn Thanh niên xã ra quân "Ngày thứ Bảy tình nguyện" hướng dẫn dịch vụ công số tại Thôn Thắng Lợi',
    slug: 'doan-thanh-nien-ra-quan-dich-vu-cong-so-thon-thang-loi',
    summary: 'Đoàn viên thanh niên xã Ea Súp đã trực tiếp đến nhà văn hóa Thôn Thắng Lợi để hỗ trợ trên 70 lượt người dân kích hoạt VNeID và tra cứu thông tin trên Cổng easupso.com.',
    contentHtml: '<p>Thực hiện chương trình xung kích tình nguyện vì cuộc sống cộng đồng, Đoàn TNCS Hồ Chí Minh xã Ea Súp do Bí thư Đoàn Đặng Văn Tình chủ trì đã tổ chức ngày hội Bình dân học vụ số tại Thôn Thắng Lợi.</p><p>Đội hình thanh niên số đã hướng dẫn bà con đăng ký tài khoản dịch vụ công, nộp hồ sơ trực tuyến và gửi phản ánh hiện trường qua Cổng thông tin xã.</p>',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'],
    isFeatured: false,
    viewCount: 240,
    status: ArticleStatus.PUBLISHED,
    categoryId: 'cat-doantn',
    category: DEFAULT_LOCAL_CATEGORIES[3],
    villageId: 'THON_THANG_LOI',
    village: { id: 'THON_THANG_LOI', name: 'Thôn Thắng Lợi', code: 'THON_THANG_LOI', type: 'THON_TEN' },
    orgCode: OrgCode.DOAN_TN,
    authorId: 'root-admin-lehanh',
    author: { name: 'Đặng Văn Tình', email: 'Dangvantinht@gmail.com', positionTitle: 'Bí thư Đoàn TNCS Hồ Chí Minh xã' },
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'art-005',
    title: 'Hội Cựu chiến binh xã Ea Súp trao tặng cặp bò giống cho hội viên có hoàn cảnh khó khăn tại Thôn Đoàn Kết',
    slug: 'hoi-ccb-trao-bo-giong-thon-doan-ket',
    summary: 'Chương trình “Nghĩa tình đồng đội” của Hội CCB xã tiếp tục nhân rộng mô hình chăn nuôi sinh sản, giúp gia đình hội viên vươn lên thoát nghèo bền vững.',
    contentHtml: '<p>Sáng ngày 12/10, Thường trực Hội Cựu chiến binh xã Ea Súp do đồng chí Đặng Trung Hiếu - Chủ tịch Hội dẫn đầu đã đến trao tặng cặp bò giống trị giá 22 triệu đồng cho gia đình cựu chiến binh thương binh tại Thôn Đoàn Kết.</p><p>Nguồn kinh phí do hội viên 20 chi hội CCB toàn xã tự nguyện đóng góp xây dựng quỹ giúp nhau xóa đói giảm nghèo.</p>',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80'],
    isFeatured: false,
    viewCount: 184,
    status: ArticleStatus.PUBLISHED,
    categoryId: 'cat-ccb',
    category: DEFAULT_LOCAL_CATEGORIES[4],
    villageId: 'THON_DOAN_KET',
    village: { id: 'THON_DOAN_KET', name: 'Thôn Đoàn Kết', code: 'THON_DOAN_KET', type: 'THON_TEN' },
    orgCode: OrgCode.CCB,
    authorId: 'root-admin-lehanh',
    author: { name: 'Đặng Trung Hiếu', email: 'trunghieuktkt@gmail.com', positionTitle: 'Chủ tịch Hội CCB xã' },
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: 'art-006',
    title: 'Tổ Công nghệ số cộng đồng Buôn B phát huy hiệu quả cầu nối thông tin số đến từng bếp lửa',
    slug: 'to-cong-nghe-so-cong-dong-buon-b-phat-huy-hieu-qua',
    summary: 'Các thành viên Tổ CNSCĐ Buôn B tích cực phối hợp cùng Ban Tự quản buôn đưa tin tức, cảnh báo thời tiết và các chủ trương chính sách đến từng hộ đồng bào dân tộc thiểu số.',
    contentHtml: '<p>Tại Buôn B, Tổ công nghệ số cộng đồng đã phối hợp chặt chẽ cùng Già làng và Trưởng buôn ứng dụng điện thoại thông minh để phổ biến bản tin Mặt trận và dịch vụ công xã Ea Súp.</p><p>Đến nay, hơn 85% hộ gia đình trong buôn đã có thể tra cứu thông tin giá nông sản và phản ánh kiến nghị trực tiếp lên chính quyền xã thông qua cổng điện tử.</p>',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80'],
    isFeatured: true,
    viewCount: 278,
    status: ArticleStatus.PUBLISHED,
    categoryId: 'cat-cds',
    category: DEFAULT_LOCAL_CATEGORIES[6],
    villageId: 'BUON_B',
    village: { id: 'BUON_B', name: 'Buôn B', code: 'BUON_B', type: 'BUON' },
    orgCode: OrgCode.MTTQ,
    authorId: 'root-admin-lehanh',
    author: { name: 'Lê Hạnh (Quản trị viên Cấp cao)', email: 'lehanhkt01@gmail.com', positionTitle: 'Quản trị viên Hệ thống Cấp cao' },
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

// Bộ nhớ tạm Runtime đảm bảo hệ thống không bao giờ bị gián đoạn kể cả khi quyền file bị hạn chế
let inMemoryArticles: LocalArticle[] = [...INITIAL_ARTICLES];

/**
 * Ghi danh sách bản tin ra file an toàn, triệt tiêu mọi ngoại lệ EACCES
 */
async function writeArticlesFileSafe(articles: LocalArticle[]): Promise<void> {
  inMemoryArticles = articles;
  try {
    await fs.writeFile(LOCAL_ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[LOCAL_ARTICLES_WRITE_WARN] Không thể ghi đè file /app/public/local-articles.json (bảo vệ phân quyền):', err?.message);
    try {
      await fs.writeFile(path.join('/tmp', 'local-articles.json'), JSON.stringify(articles, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * Đọc toàn bộ danh sách bản tin từ file JSON cục bộ
 */
export async function getLocalArticles(): Promise<LocalArticle[]> {
  try {
    const raw = await fs.readFile(LOCAL_ARTICLES_FILE, 'utf-8');
    const articles = JSON.parse(raw);
    if (Array.isArray(articles) && articles.length > 0) {
      inMemoryArticles = articles;
      return articles;
    }
  } catch {
    try {
      const rawTmp = await fs.readFile(path.join('/tmp', 'local-articles.json'), 'utf-8');
      const articlesTmp = JSON.parse(rawTmp);
      if (Array.isArray(articlesTmp) && articlesTmp.length > 0) {
        inMemoryArticles = articlesTmp;
        return articlesTmp;
      }
    } catch {}
  }

  // Nếu trong bộ nhớ đã có dữ liệu cập nhật
  if (inMemoryArticles && inMemoryArticles.length > 0) {
    return inMemoryArticles;
  }

  // Tự động ghi bộ khởi tạo nếu có quyền
  writeArticlesFileSafe(INITIAL_ARTICLES).catch(() => {});
  return INITIAL_ARTICLES;
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
    thumbnailUrl: data.thumbnailUrl || (data.images && data.images.length > 0 ? data.images[0] : null),
    images: data.images || [],
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

  const updated: LocalArticle = {
    ...existing,
    ...updates,
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

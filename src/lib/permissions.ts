import { Role, OrgCode, ArticleStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface AuthUserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  orgCode?: OrgCode | null;
  villageId?: string | null;
  positionTitle?: string | null;
  isActive: boolean;
}

export interface ArticleSecurityContext {
  id: string;
  authorId: string;
  orgCode: OrgCode;
  villageId?: string | null;
  status: ArticleStatus;
}

/**
 * BỘ MÁY PHÂN QUYỀN ĐA CHIỀU (HYBRID RBAC + ABAC POLICY ENGINE)
 * Triết lý Zero-Trust: Mặc định từ chối (Deny by Default)
 */

/**
 * 1. Quyền ĐỌC bản tin (READ POLICY)
 */
export function canReadArticle(
  user: AuthUserContext | null | undefined,
  article: ArticleSecurityContext
): boolean {
  // Bài viết đã xuất bản công khai -> Ai cũng được đọc (kể cả khách vãng lai)
  if (article.status === ArticleStatus.PUBLISHED) {
    return true;
  }

  // Nếu bài chưa xuất bản hoặc bị khóa: Bắt buộc đăng nhập
  if (!user || !user.isActive) {
    return false;
  }

  // Lãnh đạo cấp cao và Quản trị viên kỹ thuật được xem toàn bộ
  if (user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN) {
    return true;
  }

  // Tác giả bài viết luôn được xem bài của chính mình
  if (user.id === article.authorId) {
    return true;
  }

  // Trưởng thôn/buôn được xem bài nháp thuộc địa bàn thôn mình
  if (
    user.role === Role.VILLAGE_LEADER &&
    user.villageId &&
    article.villageId === user.villageId
  ) {
    return true;
  }

  // Cán bộ chuyên viên được xem bài nháp thuộc đoàn thể (orgCode) của mình
  if (
    user.role === Role.SPECIALIST &&
    user.orgCode &&
    article.orgCode === user.orgCode
  ) {
    return true;
  }

  return false;
}

/**
 * 2. Quyền TẠO bản tin (CREATE POLICY)
 */
export function canCreateArticle(
  user: AuthUserContext | null | undefined,
  targetData: {
    orgCode: OrgCode;
    villageId?: string | null;
    status?: ArticleStatus;
  }
): { allowed: boolean; reason?: string } {
  if (!user || !user.isActive) {
    return { allowed: false, reason: 'Tài khoản chưa đăng nhập hoặc đã bị tạm khóa.' };
  }

  // Người dân thông thường không được quyền đăng bản tin chính thống
  if (user.role === Role.PUBLIC) {
    return { allowed: false, reason: 'Tài khoản nhân dân/cử tri không có quyền xuất bản tin tức hành chính.' };
  }

  // Lãnh đạo cao nhất (Chủ tịch UBMTTQ / Tổng biên tập) & Super Admin có toàn quyền
  if (user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN) {
    return { allowed: true };
  }

  // Trưởng thôn/buôn: Chỉ được tạo bài gắn với đúng villageId của mình, và chỉ được để trạng thái DRAFT hoặc PENDING_APPROVAL
  if (user.role === Role.VILLAGE_LEADER) {
    if (!user.villageId || targetData.villageId !== user.villageId) {
      return { allowed: false, reason: 'Trưởng thôn/buôn chỉ được tạo tin tức thuộc đúng địa bàn thôn/buôn quản lý.' };
    }
    if (targetData.status && targetData.status !== ArticleStatus.DRAFT && targetData.status !== ArticleStatus.PENDING_APPROVAL) {
      return { allowed: false, reason: 'Trưởng thôn/buôn chỉ được gửi bản tin ở trạng thái Bản nháp hoặc Chờ duyệt.' };
    }
    return { allowed: true };
  }

  // Chuyên viên / Lãnh đạo đoàn thể: Chỉ được tạo bài trong đúng chuyên mục đoàn thể của mình
  if (user.role === Role.SPECIALIST) {
    if (!user.orgCode || targetData.orgCode !== user.orgCode) {
      return { allowed: false, reason: `Cán bộ chỉ được tạo tin bài thuộc tổ chức đoàn thể được phân công (${user.orgCode}).` };
    }
    if (targetData.status && targetData.status !== ArticleStatus.DRAFT && targetData.status !== ArticleStatus.PENDING_APPROVAL) {
      return { allowed: false, reason: 'Chuyên viên chỉ được lưu bản nháp hoặc trình duyệt lên Thường trực UBMTTQ xã.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Không có quyền thực hiện hành động này.' };
}

/**
 * 3. Quyền SỬA bản tin (UPDATE POLICY) - Chống IDOR và bảo vệ quy trình xuất bản
 */
export function canUpdateArticle(
  user: AuthUserContext | null | undefined,
  existingArticle: ArticleSecurityContext,
  updateData: {
    status?: ArticleStatus;
    orgCode?: OrgCode;
    villageId?: string | null;
  }
): { allowed: boolean; reason?: string } {
  if (!user || !user.isActive) {
    return { allowed: false, reason: 'Tài khoản chưa đăng nhập hoặc đã bị tạm khóa.' };
  }

  // EXECUTIVE và SUPER_ADMIN có toàn quyền sửa, phê duyệt và gỡ bài
  if (user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN) {
    return { allowed: true };
  }

  // Nếu bài viết đã xuất bản (PUBLISHED) hoặc đã bị khóa (LOCKED / ARCHIVED) -> Cán bộ cấp dưới KHÔNG được sửa
  if (
    existingArticle.status === ArticleStatus.PUBLISHED ||
    existingArticle.status === ArticleStatus.LOCKED ||
    existingArticle.status === ArticleStatus.ARCHIVED
  ) {
    return {
      allowed: false,
      reason: 'Bản tin đã được phê duyệt xuất bản hoặc đã khóa sổ. Chỉ Tổng biên tập / Chủ tịch UBMTTQ xã mới có quyền chỉnh sửa hoặc gỡ bài.',
    };
  }

  // Cán bộ cấp dưới không được tự ý đổi trạng thái sang PUBLISHED
  if (updateData.status === ArticleStatus.PUBLISHED || updateData.status === ArticleStatus.LOCKED) {
    return {
      allowed: false,
      reason: 'Chỉ Lãnh đạo UBMTTQ xã mới có thẩm quyền phê duyệt xuất bản công khai.',
    };
  }

  // Trưởng thôn/buôn: Chỉ được sửa bài nháp thuộc đúng thôn mình và do chính mình tạo (hoặc cùng thôn)
  if (user.role === Role.VILLAGE_LEADER) {
    if (existingArticle.villageId !== user.villageId) {
      return { allowed: false, reason: 'Không có quyền sửa bài viết ngoài phạm vi thôn buôn của mình (Chặn IDOR).' };
    }
    return { allowed: true };
  }

  // Chuyên viên: Chỉ được sửa bài thuộc đúng đoàn thể mình
  if (user.role === Role.SPECIALIST) {
    if (existingArticle.orgCode !== user.orgCode) {
      return { allowed: false, reason: 'Không có quyền sửa bài viết của đoàn thể khác (Chặn IDOR).' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Quyền truy cập bị từ chối.' };
}

/**
 * 4. Quyền XÓA bản tin (DELETE POLICY)
 */
export function canDeleteArticle(
  user: AuthUserContext | null | undefined,
  existingArticle: ArticleSecurityContext
): { allowed: boolean; reason?: string } {
  if (!user || !user.isActive) {
    return { allowed: false, reason: 'Tài khoản chưa đăng nhập.' };
  }

  // EXECUTIVE & SUPER_ADMIN được xóa mọi bài
  if (user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN) {
    return { allowed: true };
  }

  // Bài đã PUBLISHED thì không ai được xóa ngoại trừ Lãnh đạo
  if (existingArticle.status === ArticleStatus.PUBLISHED) {
    return { allowed: false, reason: 'Không thể xóa bài viết đã được xuất bản công khai.' };
  }

  // Tác giả chỉ được xóa bài DRAFT của chính mình
  if (user.id === existingArticle.authorId && existingArticle.status === ArticleStatus.DRAFT) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Không có thẩm quyền xóa bản tin này.' };
}

/**
 * 5. Quyền PHÊ DUYỆT (APPROVE POLICY)
 */
export function canApproveArticle(user: AuthUserContext | null | undefined): boolean {
  if (!user || !user.isActive) return false;
  return user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN;
}

/**
 * 6. Xây dựng mệnh đề WHERE trong Prisma chống triệt để lỗ hổng IDOR khi cán bộ truy vấn danh sách bài viết
 */
export function buildArticleScopeFilter(user: AuthUserContext): Prisma.NewsArticleWhereInput {
  // Lãnh đạo xem được toàn bộ tất cả bài
  if (user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN) {
    return {};
  }

  // Trưởng thôn/buôn: Chỉ xem bài của thôn mình HOẶC các bài đã PUBLISHED toàn xã
  if (user.role === Role.VILLAGE_LEADER && user.villageId) {
    return {
      OR: [
        { villageId: user.villageId },
        { authorId: user.id },
        { status: ArticleStatus.PUBLISHED },
      ],
    };
  }

  // Chuyên viên: Xem bài của đoàn thể mình HOẶC các bài đã PUBLISHED toàn xã
  if (user.role === Role.SPECIALIST && user.orgCode) {
    return {
      OR: [
        { orgCode: user.orgCode },
        { authorId: user.id },
        { status: ArticleStatus.PUBLISHED },
      ],
    };
  }

  // Mặc định công chúng: Chỉ xem được tin PUBLISHED
  return { status: ArticleStatus.PUBLISHED };
}

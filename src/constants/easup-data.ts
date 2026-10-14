/**
 * HỆ SINH THÁI CHUYỂN ĐỔI SỐ XÃ EA SÚP - HẰNG SỐ CỐT LÕI (EASUP DATA CONSTANTS)
 * Địa giới hành chính: Cấp xã trực thuộc tỉnh Đắk Lắk (TUYỆT ĐỐI KHÔNG CÒN CẤP HUYỆN)
 * Cơ quan chủ quản: Ủy ban Mặt trận Tổ quốc Việt Nam xã Ea Súp
 * Đường dây nóng: 0943 170 770 | Email: noreply@easupso.com
 */

export type VillageType = 'THON_SO' | 'THON_TEN' | 'BUON';

export interface VillageData {
  id: string;
  code: string;
  name: string;
  type: VillageType;
  order: number;
  leaderName: string;
  phone: string;
  description?: string;
}

/**
 * DANH MỤC KHÓA CỨNG ĐÚNG 20 THÔN, BUÔN XÃ EA SÚP
 * - 13 Thôn số: Thôn 1 đến Thôn 13
 * - 04 Thôn tên: Thôn Thắng Lợi, Thôn Đoàn Kết, Thôn Hòa Bình, Thôn Bình Lợi
 * - 03 Buôn: Buôn A, Buôn B, Buôn C
 */
export const EA_SUP_VILLAGES: readonly VillageData[] = [
  // 13 Thôn số
  { id: 'v-01', code: 'THON_01', name: 'Thôn 1', type: 'THON_SO', order: 1, leaderName: 'Trưởng thôn 1', phone: '0943 170 770' },
  { id: 'v-02', code: 'THON_02', name: 'Thôn 2', type: 'THON_SO', order: 2, leaderName: 'Trưởng thôn 2', phone: '0943 170 770' },
  { id: 'v-03', code: 'THON_03', name: 'Thôn 3', type: 'THON_SO', order: 3, leaderName: 'Trưởng thôn 3', phone: '0943 170 770' },
  { id: 'v-04', code: 'THON_04', name: 'Thôn 4', type: 'THON_SO', order: 4, leaderName: 'Trưởng thôn 4', phone: '0943 170 770' },
  { id: 'v-05', code: 'THON_05', name: 'Thôn 5', type: 'THON_SO', order: 5, leaderName: 'Trưởng thôn 5', phone: '0943 170 770' },
  { id: 'v-06', code: 'THON_06', name: 'Thôn 6', type: 'THON_SO', order: 6, leaderName: 'Trưởng thôn 6', phone: '0943 170 770' },
  { id: 'v-07', code: 'THON_07', name: 'Thôn 7', type: 'THON_SO', order: 7, leaderName: 'Trưởng thôn 7', phone: '0943 170 770' },
  { id: 'v-08', code: 'THON_08', name: 'Thôn 8', type: 'THON_SO', order: 8, leaderName: 'Trưởng thôn 8', phone: '0943 170 770' },
  { id: 'v-09', code: 'THON_09', name: 'Thôn 9', type: 'THON_SO', order: 9, leaderName: 'Trưởng thôn 9', phone: '0943 170 770' },
  { id: 'v-10', code: 'THON_10', name: 'Thôn 10', type: 'THON_SO', order: 10, leaderName: 'Trưởng thôn 10', phone: '0943 170 770' },
  { id: 'v-11', code: 'THON_11', name: 'Thôn 11', type: 'THON_SO', order: 11, leaderName: 'Trưởng thôn 11', phone: '0943 170 770' },
  { id: 'v-12', code: 'THON_12', name: 'Thôn 12', type: 'THON_SO', order: 12, leaderName: 'Trưởng thôn 12', phone: '0943 170 770' },
  { id: 'v-13', code: 'THON_13', name: 'Thôn 13', type: 'THON_SO', order: 13, leaderName: 'Trưởng thôn 13', phone: '0943 170 770' },

  // 04 Thôn tên
  { id: 'v-14', code: 'THON_THANG_LOI', name: 'Thôn Thắng Lợi', type: 'THON_TEN', order: 14, leaderName: 'Trưởng thôn Thắng Lợi', phone: '0943 170 770' },
  { id: 'v-15', code: 'THON_DOAN_KET', name: 'Thôn Đoàn Kết', type: 'THON_TEN', order: 15, leaderName: 'Trưởng thôn Đoàn Kết', phone: '0943 170 770' },
  { id: 'v-16', code: 'THON_HOA_BINH', name: 'Thôn Hòa Bình', type: 'THON_TEN', order: 16, leaderName: 'Trưởng thôn Hòa Bình', phone: '0943 170 770' },
  { id: 'v-17', code: 'THON_BINH_LOI', name: 'Thôn Bình Lợi', type: 'THON_TEN', order: 17, leaderName: 'Trưởng thôn Bình Lợi', phone: '0943 170 770' },

  // 03 Buôn
  { id: 'v-18', code: 'BUON_A', name: 'Buôn A', type: 'BUON', order: 18, leaderName: 'Trưởng buôn A', phone: '0943 170 770' },
  { id: 'v-19', code: 'BUON_B', name: 'Buôn B', type: 'BUON', order: 19, leaderName: 'Trưởng buôn B', phone: '0943 170 770' },
  { id: 'v-20', code: 'BUON_C', name: 'Buôn C', type: 'BUON', order: 20, leaderName: 'Trưởng buôn C', phone: '0943 170 770' },
] as const;

export interface CoreWebAppDefinition {
  slug: string;
  name: string;
  subdomainUrl: string;
  shortDescription: string;
  badgeText: string;
  iconName: string;
  bentoSpan: string;
  ctaPrimaryText: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  displayOrder: number;
  liveMetrics: Record<string, string | number>;
  isCore: boolean;
}

/**
 * 5 PHÂN HỆ CỐT LÕI VÀ PHÂN HỆ MỞ RỘNG CỦA HỆ SINH THÁI EASUPSO.COM
 */
export const CORE_WEBAPPS: readonly CoreWebAppDefinition[] = [
  {
    slug: 'lichcongtac',
    name: 'Lịch Công Tác Số',
    subdomainUrl: 'https://lichcongtac.easupso.com',
    shortDescription: 'Lịch họp, lịch tiếp dân và hoạt động điều hành của Thường trực Đảng ủy, HĐND, UBND, UBMTTQVN xã Ea Súp.',
    badgeText: 'Điều Hành Số',
    iconName: 'CalendarDays',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    ctaPrimaryText: 'Xem Lịch Tuần Này',
    ctaSecondaryText: 'Đăng ký phòng họp',
    ctaSecondaryUrl: 'https://lichcongtac.easupso.com/booking',
    displayOrder: 1,
    isCore: true,
    liveMetrics: {
      totalMeetingsWeek: 18,
      publicReceptions: 2,
      activeDelegations: 4,
    },
  },
  {
    slug: 'ykien',
    name: 'Tiếng Nói Cử Tri & Phản Ánh Hiện Trường',
    subdomainUrl: 'https://ykien.easupso.com',
    shortDescription: 'Cổng tiếp nhận tâm tư, phản ánh hiện trường có gắn định vị GIS của nhân dân 20 thôn, buôn gửi đến Mặt trận và Chính quyền xã.',
    badgeText: 'Dân Biết - Dân Bàn',
    iconName: 'MessageSquareText',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-8',
    ctaPrimaryText: 'Gửi Ý Kiến Ngay',
    ctaSecondaryText: 'Tra cứu xử lý phản ánh',
    ctaSecondaryUrl: 'https://ykien.easupso.com/tra-cuu',
    displayOrder: 2,
    isCore: true,
    liveMetrics: {
      receivedPetitions: 142,
      resolvedRate: '94.2%',
      avgProcessingDays: 2.1,
    },
  },
  {
    slug: 'nongnghiep',
    name: 'Nông Nghiệp Số & Sàn Nông Sản Ea Súp',
    subdomainUrl: 'https://nongnghiep.easupso.com',
    shortDescription: 'Cập nhật giá lúa nước, xoài Cát Chu, điều cao sản, mắc ca và bản tin thời tiết nông vụ, cảnh báo sâu bệnh cho bà con nông dân.',
    badgeText: 'Kinh Tế Nông Nghiệp',
    iconName: 'Sprout',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    ctaPrimaryText: 'Bảng Giá Nông Sản',
    ctaSecondaryText: 'Đăng ký nông sản OCOP',
    ctaSecondaryUrl: 'https://nongnghiep.easupso.com/dang-ky-ocop',
    displayOrder: 3,
    isCore: true,
    liveMetrics: {
      trackedCrops: 12,
      dailyPriceUpdates: '100%',
      certifiedFarmers: 380,
    },
  },
  {
    slug: 'dulich',
    name: 'Du Lịch, Di Tích & Văn Hóa Ea Súp',
    subdomainUrl: 'https://dulich.easupso.com',
    shortDescription: 'Khám phá tháp Chăm cổ Yang Prông thế kỷ XIII, thắng cảnh hồ Ea Súp Thượng, văn hóa cồng chiêng và ẩm thực truyền thống địa phương.',
    badgeText: 'Di Sản & Khám Phá',
    iconName: 'Compass',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    ctaPrimaryText: 'Khám Phá Di Tích',
    ctaSecondaryText: 'Bản đồ du lịch buôn làng',
    ctaSecondaryUrl: 'https://dulich.easupso.com/ban-do',
    displayOrder: 4,
    isCore: true,
    liveMetrics: {
      heritageSites: 6,
      culturalEvents: 8,
      annualVisitors: '25.000+',
    },
  },
  {
    slug: 'ccb',
    name: 'Hội Cựu Chiến Binh Xã Ea Súp',
    subdomainUrl: 'https://ccb.easupso.com',
    shortDescription: 'Trang thông tin điều hành nghiệp vụ, gương sáng cựu chiến binh làm kinh tế giỏi, nghĩa tình đồng đội và đường dây nóng hỗ trợ hội viên.',
    badgeText: 'Nghĩa Tình Đồng Đội',
    iconName: 'ShieldCheck',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    ctaPrimaryText: 'Bản Tin CCB',
    ctaSecondaryText: 'Hotline 0943 170 770',
    ctaSecondaryUrl: 'tel:0943170770',
    displayOrder: 5,
    isCore: true,
    liveMetrics: {
      branchesCount: 20,
      activeMembers: 654,
      solidarityFunds: '1.2 Tỷ VNĐ',
    },
  },
  {
    slug: 'nguoingheo',
    name: 'An Sinh Xã Hội',
    subdomainUrl: 'https://nguoingheo.easupso.com',
    shortDescription: 'Minh bạch nguồn lực xã hội hóa, sao kê thời gian thực Quỹ Vì người nghèo và chương trình xóa nhà tạm, nhà dột nát do Mặt trận xã điều phối.',
    badgeText: 'Vì Người Nghèo',
    iconName: 'HeartHandshake',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
    ctaPrimaryText: 'Ủng hộ & Sao kê',
    ctaSecondaryText: 'Hỗ trợ sinh kế',
    ctaSecondaryUrl: 'https://nguoingheo.easupso.com',
    displayOrder: 6,
    isCore: true,
    liveMetrics: {
      totalFundsMobilized: '850 Triệu VNĐ',
      newSolidarityHouses: 14,
      beneficiaryFamilies: 128,
    },
  },
] as const;

/**
 * DANH MỤC KHÓA CỨNG 20 THÔN, BUÔN TRỰC THUỘC XÃ EA SÚP, TỈNH ĐẮK LẮK
 * Tuân thủ mô hình chính quyền 3 cấp (Cấp xã trực thuộc tỉnh, TUYỆT ĐỐI KHÔNG CÒN CẤP HUYỆN).
 */

export interface VillageLocation {
  id: string;
  name: string;
  type: 'numbered_village' | 'named_village' | 'buon';
  order: number;
}

export const EASUP_VILLAGES_LIST: readonly VillageLocation[] = [
  // 13 Thôn số
  { id: 'thon-1', name: 'Thôn 1', type: 'numbered_village', order: 1 },
  { id: 'thon-2', name: 'Thôn 2', type: 'numbered_village', order: 2 },
  { id: 'thon-3', name: 'Thôn 3', type: 'numbered_village', order: 3 },
  { id: 'thon-4', name: 'Thôn 4', type: 'numbered_village', order: 4 },
  { id: 'thon-5', name: 'Thôn 5', type: 'numbered_village', order: 5 },
  { id: 'thon-6', name: 'Thôn 6', type: 'numbered_village', order: 6 },
  { id: 'thon-7', name: 'Thôn 7', type: 'numbered_village', order: 7 },
  { id: 'thon-8', name: 'Thôn 8', type: 'numbered_village', order: 8 },
  { id: 'thon-9', name: 'Thôn 9', type: 'numbered_village', order: 9 },
  { id: 'thon-10', name: 'Thôn 10', type: 'numbered_village', order: 10 },
  { id: 'thon-11', name: 'Thôn 11', type: 'numbered_village', order: 11 },
  { id: 'thon-12', name: 'Thôn 12', type: 'numbered_village', order: 12 },
  { id: 'thon-13', name: 'Thôn 13', type: 'numbered_village', order: 13 },

  // 04 Thôn tên
  { id: 'thon-thang-loi', name: 'Thôn Thắng Lợi', type: 'named_village', order: 14 },
  { id: 'thon-doan-ket', name: 'Thôn Đoàn Kết', type: 'named_village', order: 15 },
  { id: 'thon-hoa-binh', name: 'Thôn Hòa Bình', type: 'named_village', order: 16 },
  { id: 'thon-binh-loi', name: 'Thôn Bình Lợi', type: 'named_village', order: 17 },

  // 03 Buôn
  { id: 'buon-a', name: 'Buôn A', type: 'buon', order: 18 },
  { id: 'buon-b', name: 'Buôn B', type: 'buon', order: 19 },
  { id: 'buon-c', name: 'Buôn C', type: 'buon', order: 20 },
] as const;

export const EASUP_SYSTEM_METADATA = {
  portalName: 'Cổng thông tin & Trang chủ Hệ sinh thái Chuyển đổi số xã Ea Súp',
  domain: 'https://easupso.com',
  province: 'Tỉnh Đắk Lắk',
  commune: 'Xã Ea Súp',
  managingAuthority: 'Ủy ban Mặt trận Tổ quốc Việt Nam xã Ea Súp',
  coordinatingAuthorities: [
    'Đảng ủy xã Ea Súp',
    'Hội đồng nhân dân xã Ea Súp',
    'Ủy ban nhân dân xã Ea Súp',
    'Các tổ chức chính trị - xã hội xã Ea Súp',
  ],
  hotline: '0943 170 770',
  email: 'noreply@easupso.com',
  subsystems: [
    {
      id: 'lichcongtac',
      name: 'Lịch công tác',
      url: 'https://lichcongtac.easupso.com',
      description: 'Lịch làm việc, hội nghị và công tác của lãnh đạo Đảng ủy, HĐND, UBND, UBMTTQVN xã',
    },
    {
      id: 'ykien',
      name: 'Ý kiến cử tri',
      url: 'https://ykien.easupso.com',
      description: 'Cổng tiếp nhận tâm tư, kiến nghị và phản ánh hiện trường của nhân dân 20 thôn buôn',
    },
    {
      id: 'nongnghiep',
      name: 'Nông nghiệp số',
      url: 'https://nongnghiep.easupso.com',
      description: 'Bản đồ nông sản, giá thị trường, cảnh báo thời tiết và khuyến nông địa phương',
    },
    {
      id: 'dulich',
      name: 'Du lịch & Văn hóa',
      url: 'https://dulich.easupso.com',
      description: 'Di tích tháp Yang Prông, hồ Ea Súp Thượng, văn hóa cồng chiêng Tây Nguyên',
    },
    {
      id: 'ccb',
      name: 'Hội Cựu chiến binh',
      url: 'https://ccb.easupso.com',
      description: 'Trang truyền thống người lính cụ Hồ, phong trào thi đua và nghĩa tình đồng đội xã Ea Súp',
    },
    {
      id: 'vinguoingheo',
      name: 'Vì người nghèo',
      url: 'https://vinguoingheo.easupso.com',
      description: 'Quỹ vì người nghèo, nhà đại đoàn kết và hoạt động an sinh xã hội UBMTTQVN xã điều phối',
    },
  ],
} as const;

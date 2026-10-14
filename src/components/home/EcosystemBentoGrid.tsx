'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  MessageSquareText,
  Sprout,
  Compass,
  ShieldCheck,
  HeartHandshake,
  QrCode,
  MapPin,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Award,
  ChevronDown,
} from 'lucide-react';

export function EcosystemBentoGrid() {
  return (
    <section id="ecosystem-grid" className="py-10 sm:py-14 bg-[#FAF7F2]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TIÊU ĐỀ KHU VỰC THEO HÌNH ẢNH MẪU */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#14211B] uppercase tracking-wide">
            TRUNG TÂM ĐIỀU HÀNH &amp; ỨNG DỤNG SỐ
          </h2>
        </div>

        {/* LƯỚI 6 THẺ PHÂN HỆ SỐ CỐT LÕI (CÓ THÊM MỤC THỨ 6: AN SINH XÃ HỘI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 xl:gap-5">
          
          {/* ====================================================================
              THẺ 1: LỊCH CÔNG TÁC SỐ (lichcongtac.easupso.com)
             ==================================================================== */}
          <div className="bg-[#173C2D] rounded-2xl p-3.5 flex flex-col justify-between border-b-4 border-r-2 border-[#C85A32] shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-center mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-yellow-200 transition">
                Lịch Công Tác Số
              </h3>
              <p className="text-[10px] text-[#A3D7BB] font-mono">
                lichcongtac.easupso.com
              </p>
            </div>

            {/* Inner Content Card */}
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex-1 flex flex-col justify-between text-xs space-y-2 border border-[#E8E2D5]">
              <div className="flex items-center justify-between text-[10px] text-[#6B7C73] border-b border-[#E8E2D5] pb-1">
                <span className="font-bold text-[#14211B]">Current cấp</span>
                <span className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-[#D5CBBA]">
                  Current <ChevronDown className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="p-1.5 bg-white rounded border border-[#E8E2D5]">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#C85A32]">
                    <span>Hôm nay 14/10</span>
                    <span>08:00</span>
                  </div>
                  <p className="font-bold text-[#14211B] text-[11px] truncate">Họp UBND xã</p>
                  <p className="text-[9px] text-[#6B7C73]">12.8k mpc</p>
                </div>

                <div className="p-1.5 bg-white rounded border border-[#E8E2D5]">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#1B4332]">
                    <span>10:00</span>
                    <span>Phòng tiếp dân</span>
                  </div>
                  <p className="font-bold text-[#14211B] text-[11px] truncate">Tiếp công dân</p>
                  <p className="text-[9px] text-[#6B7C73]">56 k dân</p>
                </div>

                <div className="p-1.5 bg-white rounded border border-[#E8E2D5]">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#4A5B52]">
                    <span>14:00</span>
                    <span>12 k dân</span>
                  </div>
                  <p className="font-bold text-[#14211B] text-[11px] truncate">Duyệt văn bản</p>
                </div>
              </div>
            </div>

            <a
              href="https://lichcongtac.easupso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 py-1.5 px-3 bg-white hover:bg-gray-100 text-[#173C2D] text-[11px] font-bold rounded-lg text-center shadow-xs transition"
            >
              Xem lịch tuần &rarr;
            </a>
          </div>

          {/* ====================================================================
              THẺ 2: TIẾNG NÓI CỬ TRI (ykien.easupso.com)
             ==================================================================== */}
          <div className="bg-[#173C2D] rounded-2xl p-3.5 flex flex-col justify-between border-b-4 border-r-2 border-[#C85A32] shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-center mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-yellow-200 transition">
                Tiếng Nói Cử Tri
              </h3>
              <p className="text-[10px] text-[#A3D7BB] font-mono">
                ykien.easupso.com
              </p>
            </div>

            {/* Inner Content Card (Bản đồ số phản ánh) */}
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex-1 flex flex-col justify-between text-xs space-y-2 border border-[#E8E2D5]">
              {/* Giả lập giao diện bản đồ GIS với các tọa độ phản ánh */}
              <div className="relative h-28 w-full bg-[#E3EFE8] rounded-lg overflow-hidden border border-[#A3D7BB] flex items-center justify-center">
                {/* Đường nét bản đồ trừu tượng */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#1B4332_1px,transparent_1px)] [background-size:10px_10px]" />
                
                {/* Các điểm Pin màu cam, xanh, đỏ */}
                <div className="absolute top-3 left-4 w-3.5 h-3.5 rounded-full bg-[#C85A32] border-2 border-white shadow-sm flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
                <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-[#1B4332] border-2 border-white shadow-sm flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="absolute bottom-4 left-8 w-3.5 h-3.5 rounded-full bg-[#3B82F6] border-2 border-white shadow-sm flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>

                {/* Nút phóng to thu nhỏ */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 bg-white/90 rounded p-0.5 text-[8px] font-bold text-gray-700 shadow-xs">
                  <span>+</span>
                  <span>-</span>
                </div>

                {/* Badge số liệu */}
                <div className="absolute bottom-1.5 right-1.5 bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#173C2D] shadow-xs">
                  2.5k phản ánh
                </div>
              </div>

              <div className="text-center pt-1">
                <span className="text-[10px] text-[#6B7C73] block font-medium">Theo dõi hiện trường 20 thôn buôn</span>
              </div>
            </div>

            <a
              href="https://ykien.easupso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 py-1.5 px-3 bg-white hover:bg-gray-100 text-[#173C2D] text-[11px] font-bold rounded-lg text-center shadow-xs transition"
            >
              Gửi ý kiến &amp; phản ánh
            </a>
          </div>

          {/* ====================================================================
              THẺ 3: NÔNG NGHIỆP THÔNG MINH (nongnghiep.easupso.com)
             ==================================================================== */}
          <div className="bg-[#173C2D] rounded-2xl p-3.5 flex flex-col justify-between border-b-4 border-r-2 border-[#C85A32] shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-center mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-yellow-200 transition">
                Nông Nghiệp Thông Minh
              </h3>
              <p className="text-[10px] text-[#A3D7BB] font-mono">
                nongnghiep.easupso.com
              </p>
            </div>

            {/* Inner Content Card (Giá nông sản & Bản đồ vùng trồng) */}
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex-1 flex flex-col justify-between text-xs space-y-2 border border-[#E8E2D5]">
              <div className="bg-white rounded-lg p-2 border border-[#E8E2D5]">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#14211B] mb-1">
                  <span>Giá nông sản hôm</span>
                  <span className="flex items-center gap-0.5 px-1 rounded bg-[#E8F5EE] text-[#1B4332] text-[9px]">
                    <QrCode className="w-2.5 h-2.5" /> Truy xuất
                  </span>
                </div>
                <div className="flex justify-between text-[10px] pt-0.5 border-t border-[#E8E2D5]/50">
                  <span className="text-[#6B7C73]">Giá nông sản:</span>
                  <span className="font-bold text-[#C85A32]">Cà phê: 110k/kg</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#6B7C73]">Giá cấn:</span>
                  <span className="font-bold text-[#1B4332]">Lúa: 8.5k/kg</span>
                </div>
              </div>

              {/* Bản đồ vùng trồng màu xanh lá */}
              <div className="relative h-14 w-full bg-[#A3D7BB] rounded-lg overflow-hidden flex items-center justify-center">
                <span className="text-white font-serif font-black text-lg opacity-80">🌾</span>
                <span className="absolute bottom-1 right-1 text-[8px] bg-white/80 px-1 rounded font-bold text-[#173C2D]">
                  Vùng lúa &amp; xoài
                </span>
              </div>
            </div>

            <a
              href="https://nongnghiep.easupso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 py-1.5 px-3 bg-white hover:bg-gray-100 text-[#173C2D] text-[11px] font-bold rounded-lg text-center shadow-xs transition"
            >
              Chợ nông sản số
            </a>
          </div>

          {/* ====================================================================
              THẺ 4: DU LỊCH & ẨM THỰC EA SÚP (dulich.easupso.com)
             ==================================================================== */}
          <div className="bg-[#173C2D] rounded-2xl p-3.5 flex flex-col justify-between border-b-4 border-r-2 border-[#C85A32] shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-center mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-yellow-200 transition">
                Du Lịch &amp; Ẩm Thực Ea Súp
              </h3>
              <p className="text-[10px] text-[#A3D7BB] font-mono">
                dulich.easupso.com
              </p>
            </div>

            {/* Inner Content Card (Ảnh tháp Chăm & ẩm thực) */}
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex-1 flex flex-col justify-between text-xs space-y-2 border border-[#E8E2D5]">
              <div
                className="relative h-28 w-full rounded-lg overflow-hidden bg-cover bg-center flex flex-col justify-end p-2 border border-[#E8E2D5]"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=400&q=80')`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative z-10 text-white">
                  <p className="text-[10px] font-bold drop-shadow leading-tight">
                    Tháp Yang Prong &amp; Lòng hồ Ea Súp Thượng
                  </p>
                  <p className="text-[8px] text-yellow-200 drop-shadow">
                    Cồng chiêng 3 Buôn &amp; Cơm lam
                  </p>
                </div>
              </div>

              <div className="text-center pt-0.5">
                <span className="text-[10px] text-[#6B7C73] font-medium">Bản sắc văn hóa Tây Nguyên</span>
              </div>
            </div>

            <a
              href="https://dulich.easupso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 py-1.5 px-3 bg-white hover:bg-gray-100 text-[#173C2D] text-[11px] font-bold rounded-lg text-center shadow-xs transition"
            >
              Khám phá
            </a>
          </div>

          {/* ====================================================================
              THẺ 5: NGHIỆP VỤ HỘI CCB (ccb.easupso.com)
             ==================================================================== */}
          <div className="bg-[#173C2D] rounded-2xl p-3.5 flex flex-col justify-between border-b-4 border-r-2 border-[#C85A32] shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-center mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-yellow-200 transition">
                Nghiệp Vụ Hội CCB
              </h3>
              <p className="text-[10px] text-[#A3D7BB] font-mono">
                ccb.easupso.com
              </p>
            </div>

            {/* Inner Content Card (Huy hiệu CCB & Quản lý hội viên) */}
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex-1 flex flex-col justify-between text-xs space-y-2 border border-[#E8E2D5]">
              <div className="flex flex-col items-center justify-center pt-1">
                {/* Huy hiệu Cựu Chiến Binh */}
                <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-yellow-400 flex items-center justify-center shadow-sm">
                  <span className="text-yellow-300 font-serif font-black text-sm">★</span>
                </div>
                <p className="text-[11px] font-bold text-[#14211B] mt-1.5">
                  Hội Cựu chiến binh
                </p>
              </div>

              <div className="bg-white rounded-lg p-1.5 border border-[#E8E2D5] flex items-center justify-around text-center text-[10px]">
                <div>
                  <span className="text-[#6B7C73] block text-[9px]">Chi hội</span>
                  <strong className="text-[#173C2D]">20 Chi hội</strong>
                </div>
                <div className="h-5 w-px bg-gray-200" />
                <div>
                  <span className="text-[#6B7C73] block text-[9px]">Hội viên</span>
                  <strong className="text-[#C85A32]">654 đ/chí</strong>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[9px] text-[#6B7C73]">Điểm danh QR &bull; Vốn vay NHCSXH</span>
              </div>
            </div>

            <a
              href="https://ccb.easupso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 py-1.5 px-3 bg-white hover:bg-gray-100 text-[#173C2D] text-[11px] font-bold rounded-lg text-center shadow-xs transition"
            >
              Quản lý hội viên
            </a>
          </div>

          {/* ====================================================================
              THẺ 6 (MỤC MỚI YÊU CẦU): AN SINH XÃ HỘI (nguoingheo.easupso.com)
             ==================================================================== */}
          <div className="bg-[#173C2D] rounded-2xl p-3.5 flex flex-col justify-between border-b-4 border-r-2 border-[#C85A32] shadow-md hover:-translate-y-1 transition-all group">
            <div className="text-center mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-yellow-200 transition">
                An Sinh Xã Hội
              </h3>
              <p className="text-[10px] text-[#A3D7BB] font-mono">
                nguoingheo.easupso.com
              </p>
            </div>

            {/* Inner Content Card (Quỹ Vì Người Nghèo & Xóa nhà tạm) */}
            <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex-1 flex flex-col justify-between text-xs space-y-2 border border-[#E8E2D5]">
              <div className="flex flex-col items-center justify-center pt-1">
                {/* Biểu tượng Trái tim Nghĩa tình */}
                <div className="w-10 h-10 rounded-full bg-[#FAF0EC] border-2 border-[#EBBAA7] flex items-center justify-center shadow-sm">
                  <HeartHandshake className="w-5 h-5 text-[#C85A32]" />
                </div>
                <p className="text-[11px] font-bold text-[#C85A32] mt-1.5 text-center">
                  Quỹ Vì Người Nghèo
                </p>
              </div>

              <div className="bg-white rounded-lg p-1.5 border border-[#E8E2D5] flex items-center justify-around text-center text-[10px]">
                <div>
                  <span className="text-[#6B7C73] block text-[9px]">Nhà ĐĐK</span>
                  <strong className="text-[#173C2D]">14 Căn</strong>
                </div>
                <div className="h-5 w-px bg-gray-200" />
                <div>
                  <span className="text-[#6B7C73] block text-[9px]">Huy động</span>
                  <strong className="text-[#C85A32]">850 Tr</strong>
                </div>
              </div>

              <div className="text-center bg-white/80 p-1 rounded border border-[#E8E2D5]">
                <span className="text-[9px] text-[#173C2D] font-bold block truncate">
                  BIDV: 8630100930
                </span>
                <span className="text-[8px] text-emerald-700 font-semibold">Sao kê thời gian thực 100%</span>
              </div>
            </div>

            <a
              href="https://nguoingheo.easupso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 py-1.5 px-3 bg-[#C85A32] hover:bg-[#A84622] text-white text-[11px] font-bold rounded-lg text-center shadow-xs transition"
            >
              Ủng hộ &amp; Sao kê
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}

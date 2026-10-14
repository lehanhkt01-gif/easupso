import React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  Shield,
  Heart,
  Globe2,
} from 'lucide-react';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

export function Footer() {
  return (
    <footer className="bg-[#14211B] text-[#FAF7F2] border-t-4 border-[#C85A32] mt-auto">
      {/* 1. KHỐI NỘI DUNG CHÍNH CỦA FOOTER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* CỘT 1: CƠ QUAN CHỦ QUẢN & LIÊN HỆ ĐIỀU HÀNH (4 CỘT) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B4332] border border-[#D4AF37] flex items-center justify-center font-serif text-[#D4AF37] font-bold text-lg">
                ★
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">
                  Cơ quan chủ quản hệ thống
                </p>
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  ỦY BAN MẶT TRẬN TỔ QUỐC VIỆT NAM XÃ EA SÚP
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A3D7BB] leading-relaxed">
              Chủ trì, phối hợp cùng Đảng ủy, HĐND, UBND và các tổ chức chính trị - xã hội xã Ea Súp, 
              tỉnh Đắk Lắk (Hội LH Phụ nữ, Hội Nông dân, Đoàn TNCS Hồ Chí Minh, Hội Cựu chiến binh).
            </p>

            <div className="space-y-2 text-xs text-[#E8F5EE] pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C85A32] flex-shrink-0 mt-0.5" />
                <span>Trụ sở Cơ quan xã Ea Súp, tỉnh Đắk Lắk</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span>Đường dây nóng điều hành: </span>
                <a href="tel:0943170770" className="font-bold text-white hover:text-[#D4AF37] underline">
                  0943 170 770
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#A3D7BB] flex-shrink-0" />
                <span>Thư điện tử công vụ: </span>
                <a href="mailto:noreply@easupso.com" className="font-bold text-white hover:underline">
                  noreply@easupso.com
                </a>
              </div>
            </div>
          </div>

          {/* CỘT 2: 5 PHÂN HỆ SỐ CỐT LÕI (3 CỘT) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] border-b border-[#1B4332] pb-2">
              5 Phân Hệ Số Cốt Lõi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://lichcongtac.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
                >
                  <span>1. Lịch Công Tác Số</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://ykien.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
                >
                  <span>2. Tiếng Nói Cử Tri &amp; GIS</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://nongnghiep.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
                >
                  <span>3. Nông Nghiệp &amp; Nông Sản</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://dulich.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
                >
                  <span>4. Du Lịch &amp; Văn Hóa Ea Súp</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://ccb.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
                >
                  <span>5. Hội Cựu Chiến Binh</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://nguoingheo.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
                >
                  <span>6. An Sinh Xã Hội</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li className="pt-2 border-t border-[#1B4332]">
                <a
                  href="https://nguoingheo.easupso.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] hover:underline flex items-center justify-between font-bold"
                >
                  <span>Quỹ Vì Người Nghèo (Sao kê)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* CỘT 3: 20 BAN CÔNG TÁC MẶT TRẬN THÔN, BUÔN (4 CỘT) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] border-b border-[#1B4332] pb-2">
              20 Ban Công Tác Mặt Trận Thôn, Buôn
            </h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#A3D7BB]">
              {EA_SUP_VILLAGES.map((v) => (
                <div key={v.code} className="truncate hover:text-white transition">
                  &bull; {v.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. DÒNG KHẲNG ĐỊNH CHỦ QUYỀN TRANG TRỌNG */}
        <div className="mt-10 pt-6 border-t border-[#1B4332] text-center text-xs text-[#A3D7BB] bg-[#0E1713] p-4 rounded-lg">
          <p className="flex items-center justify-center gap-2 flex-wrap font-medium">
            <Globe2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
            <span>
              Bản đồ số trong Hệ sinh thái Ea Súp Số khẳng định chủ quyền biên giới quốc gia và hai quần đảo{' '}
              <strong className="text-white">Hoàng Sa</strong>, <strong className="text-white">Trường Sa</strong> là của Việt Nam.
            </span>
          </p>
        </div>

        {/* 3. DÒNG BẢN QUYỀN & MÔ HÌNH HÀNH CHÍNH 3 CẤP */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7C73] border-t border-[#1B4332]/50 pt-4">
          <p>
            &copy; {new Date().getFullYear()} Cổng thông tin điện tử easupso.com. Bản quyền thuộc Ủy ban MTTQ Việt Nam xã Ea Súp.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[#A3D7BB]">Mô hình chính quyền 3 cấp (Xã trực thuộc tỉnh Đắk Lắk)</span>
            <span>&bull;</span>
            <Link href="/login" className="text-[#D4AF37] hover:underline font-semibold">
              Khu vực Cán bộ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

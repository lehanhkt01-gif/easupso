import React from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#14211B] text-[#FAF7F2] border-t-4 border-[#C85A32] mt-auto">
      {/* 1. KHỐI NỘI DUNG CHÍNH CỦA FOOTER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* CỘT 1: CƠ QUAN CHỦ QUẢN & LIÊN HỆ ĐIỀU HÀNH */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 shadow-md overflow-hidden border border-[#D4AF37] bg-white flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-mttq.png"
                  alt="Biểu trưng Mặt trận Tổ quốc Việt Nam"
                  className="w-full h-full object-contain rounded-full"
                />
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

            <div className="space-y-2 text-xs text-[#E8F5EE] pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C85A32] flex-shrink-0 mt-0.5" />
                <span>Trụ sở Cơ quan xã Ea Súp, tỉnh Đắk Lắk</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span>Đường dây nóng điều hành: </span>
                <a href="tel:0888023023" className="font-bold text-white hover:text-[#D4AF37] underline">
                  0888 023 023
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#A3D7BB] flex-shrink-0" />
                <span>Thư điện tử công vụ: </span>
                <a href="mailto:Easupsohoa@gmail.com" className="font-bold text-white hover:underline">
                  Easupsohoa@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* CỘT 2: 5 PHÂN HỆ SỐ CỐT LÕI */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] border-b border-[#1B4332] pb-2">
              Các Phân Hệ Số Cốt Lõi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <a
                href="https://lichcongtac.easupso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
              >
                <span>1. Lịch Công Tác</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <a
                href="https://ykien.easupso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
              >
                <span>2. Ý Kiến Cử Tri</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <a
                href="https://nongnghiep.easupso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
              >
                <span>3. Nông Nghiệp Số</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <a
                href="https://dulich.easupso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
              >
                <span>4. Du Lịch &amp; Văn Hóa</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <a
                href="https://ccb.easupso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] flex items-center justify-between py-1 transition"
              >
                <span>5. Hội Cựu Chiến Binh</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <a
                href="https://nguoingheo.easupso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] hover:underline flex items-center justify-between py-1 font-bold"
              >
                <span>6. Quỹ Vì Người Nghèo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. DÒNG BẢN QUYỀN */}
        <div className="mt-8 pt-4 border-t border-[#1B4332]/50 text-center text-xs text-[#6B7C73]">
          <p>
            &copy; {new Date().getFullYear()} Cổng thông tin điện tử easupso.com. Bản quyền thuộc Ủy ban MTTQ Việt Nam xã Ea Súp.
          </p>
        </div>
      </div>
    </footer>
  );
}

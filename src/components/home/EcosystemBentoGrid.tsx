'use client';

import React from 'react';
import {
  CalendarDays,
  MessageSquareText,
  Sprout,
  Compass,
  ShieldCheck,
  HeartHandshake,
  ArrowUpRight,
} from 'lucide-react';

const ECOSYSTEM_APPS = [
  {
    id: 'lichcongtac',
    title: 'Lịch Công Tác Số',
    domain: 'lichcongtac.easupso.com',
    url: 'https://lichcongtac.easupso.com',
    desc: 'Lịch họp, lịch tiếp dân & điều hành của Đảng ủy, HĐND, UBND, MTTQ',
    actionText: 'Xem lịch tuần',
    icon: CalendarDays,
    colorStyle: {
      borderTop: 'border-t-[#1B4332]',
      borderHover: 'hover:border-[#1B4332]',
      iconGradient: 'from-[#1B4332] to-[#2D6A4F]',
      hoverBg: 'hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/80',
      hoverGlow: 'hover:shadow-[0_16px_30px_-6px_rgba(27,67,50,0.32)]',
      domainBadge: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80',
      btnBg: 'bg-[#1B4332] hover:bg-[#143326]',
      accentColor: '#1B4332',
    },
  },
  {
    id: 'ykien',
    title: 'Tiếng Nói Cử Tri',
    domain: 'ykien.easupso.com',
    url: 'https://ykien.easupso.com',
    desc: 'Tiếp nhận phản ánh, tâm tư và kiến nghị của nhân dân 20 thôn, buôn',
    actionText: 'Gửi phản ánh',
    icon: MessageSquareText,
    colorStyle: {
      borderTop: 'border-t-[#C85A32]',
      borderHover: 'hover:border-[#C85A32]',
      iconGradient: 'from-[#C85A32] to-[#E06D43]',
      hoverBg: 'hover:bg-gradient-to-b hover:from-white hover:to-orange-50/80',
      hoverGlow: 'hover:shadow-[0_16px_30px_-6px_rgba(200,90,50,0.35)]',
      domainBadge: 'bg-orange-50/80 text-orange-900 border-orange-200/80',
      btnBg: 'bg-[#C85A32] hover:bg-[#A84520]',
      accentColor: '#C85A32',
    },
  },
  {
    id: 'nongnghiep',
    title: 'Nông Nghiệp Số',
    domain: 'nongnghiep.easupso.com',
    url: 'https://nongnghiep.easupso.com',
    desc: 'Giá nông sản Ea Súp (lúa, xoài, cà phê, điều), khuyến nông & mùa vụ',
    actionText: 'Chợ nông sản',
    icon: Sprout,
    colorStyle: {
      borderTop: 'border-t-[#15803D]',
      borderHover: 'hover:border-[#15803D]',
      iconGradient: 'from-[#15803D] to-[#22C55E]',
      hoverBg: 'hover:bg-gradient-to-b hover:from-white hover:to-green-50/80',
      hoverGlow: 'hover:shadow-[0_16px_30px_-6px_rgba(21,128,61,0.35)]',
      domainBadge: 'bg-green-50/80 text-green-900 border-green-200/80',
      btnBg: 'bg-[#15803D] hover:bg-[#166534]',
      accentColor: '#15803D',
    },
  },
  {
    id: 'dulich',
    title: 'Du Lịch & Văn Hóa',
    domain: 'dulich.easupso.com',
    url: 'https://dulich.easupso.com',
    desc: 'Tháp Chăm Yang Prông, hồ Ea Súp Thượng, cồng chiêng & ẩm thực',
    actionText: 'Khám phá ngay',
    icon: Compass,
    colorStyle: {
      borderTop: 'border-t-[#D4AF37]',
      borderHover: 'hover:border-[#D4AF37]',
      iconGradient: 'from-[#D4AF37] to-[#B45309]',
      hoverBg: 'hover:bg-gradient-to-b hover:from-white hover:to-amber-50/80',
      hoverGlow: 'hover:shadow-[0_16px_30px_-6px_rgba(212,175,55,0.38)]',
      domainBadge: 'bg-amber-50/80 text-amber-900 border-amber-200/80',
      btnBg: 'bg-[#B45309] hover:bg-[#92400E]',
      accentColor: '#B45309',
    },
  },
  {
    id: 'ccb',
    title: 'Hội Cựu Chiến Binh',
    domain: 'ccb.easupso.com',
    url: 'https://ccb.easupso.com',
    desc: 'Hoạt động truyền thống, nghĩa tình đồng đội 20 chi hội thôn buôn',
    actionText: 'Vào phân hệ',
    icon: ShieldCheck,
    colorStyle: {
      borderTop: 'border-t-[#DC2626]',
      borderHover: 'hover:border-[#DC2626]',
      iconGradient: 'from-[#B91C1C] to-[#EF4444]',
      hoverBg: 'hover:bg-gradient-to-b hover:from-white hover:to-red-50/80',
      hoverGlow: 'hover:shadow-[0_16px_30px_-6px_rgba(220,38,38,0.35)]',
      domainBadge: 'bg-red-50/80 text-red-900 border-red-200/80',
      btnBg: 'bg-[#B91C1C] hover:bg-[#991B1B]',
      accentColor: '#DC2626',
    },
  },
  {
    id: 'nguoingheo',
    title: 'An Sinh Xã Hội',
    domain: 'nguoingheo.easupso.com',
    url: 'https://nguoingheo.easupso.com',
    desc: 'Quỹ Vì người nghèo, nhà Đại đoàn kết, sao kê minh bạch thời gian thực',
    actionText: 'Ủng hộ & Sao kê',
    icon: HeartHandshake,
    colorStyle: {
      borderTop: 'border-t-[#E11D48]',
      borderHover: 'hover:border-[#E11D48]',
      iconGradient: 'from-[#C85A32] to-[#E11D48]',
      hoverBg: 'hover:bg-gradient-to-b hover:from-white hover:to-rose-50/80',
      hoverGlow: 'hover:shadow-[0_16px_30px_-6px_rgba(225,29,72,0.35)]',
      domainBadge: 'bg-rose-50/80 text-rose-900 border-rose-200/80',
      btnBg: 'bg-[#E11D48] hover:bg-[#BE123C]',
      accentColor: '#E11D48',
    },
  },
];

export function EcosystemBentoGrid() {
  return (
    <section id="ecosystem-grid" className="pt-2 pb-8 sm:pb-12 bg-transparent relative z-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TIÊU ĐỀ KHU VỰC */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            CÁC ỨNG DỤNG THUỘC HỆ SINH THÁI EA SÚP SỐ
          </h2>
        </div>

        {/* LƯỚI 6 THẺ PHÂN HỆ SỐ CỐT LÕI - TĂNG MÀU SẮC, HIỆU ỨNG CHỌN NỔI BẬT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
          {ECOSYSTEM_APPS.map((app) => {
            const IconComponent = app.icon;
            const style = app.colorStyle;

            return (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-[#E8E2D5] border-t-4 ${style.borderTop} ${style.borderHover} ${style.hoverBg} ${style.hoverGlow} shadow-xs hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex flex-col`}
              >
                {/* Header: Icon badge sắc nét & Mũi tên tương tác */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${style.iconGradient} text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center group-hover:bg-white group-hover:shadow-xs transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#6B7C73] group-hover:text-[#14211B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* Tên phân hệ */}
                <h3 className="text-sm sm:text-base font-extrabold text-[#14211B] group-hover:text-[#1B4332] transition-colors leading-snug">
                  {app.title}
                </h3>

                {/* Tên miền phân hệ dạng huy hiệu nổi bật */}
                <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md mt-2 truncate max-w-full font-semibold self-start ${style.domainBadge}`}>
                  {app.domain}
                </span>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
}

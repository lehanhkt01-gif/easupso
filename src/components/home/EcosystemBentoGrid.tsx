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
    desc: 'Lịch công tác tuần của Đảng ủy, HĐND, UBND, UBMTTQ',
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
    desc: 'Trung tâm tiếp nhận, trả lời phản ánh của cử tri',
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
    desc: 'Khởi tạo nông hộ, nhật ký vụ mùa, mã số vùng trồng; CHỢ NÔNG SẢN SỐ',
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
    desc: 'Món ngon Ea Súp, Bản đồ danh lam/thắng cảnh',
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
    desc: 'Hệ thống điều hành và Nghiệp vụ Hội Cựu chiến binh E-CCB',
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
    desc: 'Ủng hộ Quỹ vì người nghèo, sao kê thu chi theo thời gian thực...',
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
        
        {/* TIÊU ĐỀ KHU VỰC: NỀN ĐỎ CHỮ SÁNG MÀU VÀNG TRANG TRỌNG */}
        <div className="text-center mb-6 sm:mb-8 flex justify-center">
          <div className="inline-block bg-gradient-to-r from-red-700 via-red-600 to-red-700 px-6 py-2.5 sm:px-10 sm:py-3 rounded-xl border border-yellow-400/60 shadow-lg shadow-black/35">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-serif font-bold text-yellow-300 uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              CÁC ỨNG DỤNG THUỘC HỆ SINH THÁI EA SÚP SỐ
            </h2>
          </div>
        </div>

        {/* LƯỚI 6 THẺ PHÂN HỆ SỐ CỐT LÕI - TỐI ƯU BỐ CỤC KHÔNG ĐỂ TRỐNG */}
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
                className={`group bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-4.5 border border-[#E8E2D5] border-t-4 ${style.borderTop} ${style.borderHover} ${style.hoverBg} ${style.hoverGlow} shadow-xs hover:-translate-y-1.5 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-out flex flex-col justify-between h-full`}
              >
                {/* PHẦN TRÊN: ICON NẰM NGANG VỚI TÊN PHÂN HỆ & LINK DOMAIN */}
                <div>
                  <div className="flex items-start gap-3">
                    {/* Icon container */}
                    <div className={`w-12 h-12 sm:w-10 sm:h-10 lg:w-10 lg:h-10 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br ${style.iconGradient} text-white shadow-md group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 sm:w-5 sm:h-5" />
                    </div>

                    {/* Dòng tên và link nằm ngang với icon */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-base sm:text-sm lg:text-[14px] xl:text-[15px] font-bold text-[#14211B] group-hover:text-[#1B4332] transition-colors leading-tight">
                          {app.title}
                        </h3>
                        <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8E2D5] shrink-0 flex items-center justify-center group-hover:bg-white group-hover:shadow-xs transition-colors">
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#6B7C73] group-hover:text-[#14211B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Subdomain link badge */}
                      <span className={`inline-block text-xs sm:text-[10px] font-mono px-2 py-0.5 rounded-md mt-1 truncate max-w-full font-semibold ${style.domainBadge}`}>
                        {app.domain}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PHẦN DƯỚI: NỘI DUNG MÔ TẢ ĐƯỢC ĐIỀN ĐẦY ĐỦ ĐỂ TRÁNH TRỐNG */}
                <div className="mt-3.5 pt-3 border-t border-[#E8E2D5]/70 flex-1 flex flex-col justify-between">
                  <p className="text-sm sm:text-xs text-[#556960] group-hover:text-[#14211B] leading-relaxed transition-colors">
                    {app.desc}
                  </p>
                </div>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
}

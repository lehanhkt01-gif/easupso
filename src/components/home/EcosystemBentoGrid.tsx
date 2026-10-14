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
  },
  {
    id: 'ykien',
    title: 'Tiếng Nói Cử Tri',
    domain: 'ykien.easupso.com',
    url: 'https://ykien.easupso.com',
    desc: 'Tiếp nhận phản ánh, tâm tư và kiến nghị của nhân dân 20 thôn, buôn',
    actionText: 'Gửi phản ánh',
    icon: MessageSquareText,
  },
  {
    id: 'nongnghiep',
    title: 'Nông Nghiệp Số',
    domain: 'nongnghiep.easupso.com',
    url: 'https://nongnghiep.easupso.com',
    desc: 'Giá nông sản Ea Súp (lúa, xoài, cà phê, điều), khuyến nông & mùa vụ',
    actionText: 'Chợ nông sản',
    icon: Sprout,
  },
  {
    id: 'dulich',
    title: 'Du Lịch & Văn Hóa',
    domain: 'dulich.easupso.com',
    url: 'https://dulich.easupso.com',
    desc: 'Tháp Chăm Yang Prông, hồ Ea Súp Thượng, cồng chiêng & ẩm thực',
    actionText: 'Khám phá ngay',
    icon: Compass,
  },
  {
    id: 'ccb',
    title: 'Hội Cựu Chiến Binh',
    domain: 'ccb.easupso.com',
    url: 'https://ccb.easupso.com',
    desc: 'Hoạt động truyền thống, nghĩa tình đồng đội 20 chi hội thôn buôn',
    actionText: 'Vào phân hệ',
    icon: ShieldCheck,
  },
  {
    id: 'nguoingheo',
    title: 'An Sinh Xã Hội',
    domain: 'nguoingheo.easupso.com',
    url: 'https://nguoingheo.easupso.com',
    desc: 'Quỹ Vì người nghèo, nhà Đại đoàn kết, sao kê minh bạch thời gian thực',
    actionText: 'Ủng hộ & Sao kê',
    icon: HeartHandshake,
  },
];

export function EcosystemBentoGrid() {
  return (
    <section id="ecosystem-grid" className="py-6 sm:py-8 bg-[#FAF7F2]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TIÊU ĐỀ KHU VỰC THU GỌN THANH THOÁT */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1B4332]/10 border border-[#1B4332]/20 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] animate-pulse" />
            <span className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider">
              Hệ thống 6 phân hệ cốt lõi
            </span>
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[#14211B] uppercase tracking-wide">
            TRUNG TÂM ĐIỀU HÀNH &amp; ỨNG DỤNG SỐ
          </h2>
        </div>

        {/* LƯỚI 6 THẺ PHÂN HỆ SỐ CỐT LÕI - THU GỌN, ĐƠN GIẢN, HIỆN ĐẠI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {ECOSYSTEM_APPS.map((app) => {
            const IconComponent = app.icon;
            return (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs hover:shadow-md hover:border-[#1B4332]/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Header: Icon badge & Arrow link */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FAF7F2] border border-[#E8E2D5] group-hover:border-[#1B4332] group-hover:bg-[#1B4332] text-[#1B4332] group-hover:text-white transition-all duration-200 shadow-2xs">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#C85A32] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>

                  {/* Tên phân hệ */}
                  <h3 className="text-xs sm:text-sm font-bold text-[#14211B] group-hover:text-[#1B4332] transition-colors leading-snug">
                    {app.title}
                  </h3>

                  {/* Tên miền phân hệ */}
                  <p className="text-[10px] text-[#8C7E6A] font-mono mt-0.5 truncate">
                    {app.domain}
                  </p>

                  {/* Mô tả ngắn gọn súc tích */}
                  <p className="text-[11px] text-[#4A5B52] leading-relaxed line-clamp-2 mt-2">
                    {app.desc}
                  </p>
                </div>

                {/* Nút hành động gọn nhẹ */}
                <div className="mt-3 pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] font-semibold text-[#1B4332] group-hover:text-[#C85A32] transition-colors">
                  <span>{app.actionText}</span>
                  <span className="text-xs transition-transform group-hover:translate-x-0.5">&rarr;</span>
                </div>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
}

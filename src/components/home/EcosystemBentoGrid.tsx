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
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface EcosystemApp {
  id: number;
  title: string;
  subdomain: string;
  desc: string;
  color: string;
  glowColor: string;
  borderHover: string;
  badgeColor: string;
  icon: React.ElementType;
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: 1,
    title: 'Lịch Công Tác Số',
    subdomain: 'lichcongtac.easupso.com',
    desc: 'Theo dõi và quản lý lịch họp, sự kiện của hệ thống chính trị xã',
    color: 'from-emerald-500 to-teal-600',
    glowColor: 'group-hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.35)]',
    borderHover: 'group-hover:border-emerald-400/60',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CalendarDays,
  },
  {
    id: 2,
    title: 'Tiếng Nói Cử Tri',
    subdomain: 'ykien.easupso.com',
    desc: 'Tiếp nhận và xử lý kiến nghị, phản ánh trực tuyến của nhân dân',
    color: 'from-amber-500 to-orange-600',
    glowColor: 'group-hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.35)]',
    borderHover: 'group-hover:border-amber-400/60',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: MessageSquareText,
  },
  {
    id: 3,
    title: 'Nông Nghiệp Số',
    subdomain: 'nongnghiep.easupso.com',
    desc: 'Thông tin giá cả nông sản, kỹ thuật canh tác và thời tiết nông vụ',
    color: 'from-green-500 to-lime-600',
    glowColor: 'group-hover:shadow-[0_20px_40px_-12px_rgba(34,197,94,0.35)]',
    borderHover: 'group-hover:border-green-400/60',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30',
    icon: Sprout,
  },
  {
    id: 4,
    title: 'Du Lịch & Văn Hóa',
    subdomain: 'dulich.easupso.com',
    desc: 'Quảng bá điểm đến, bản sắc văn hóa và đặc sản vùng biên giới',
    color: 'from-blue-500 to-indigo-600',
    glowColor: 'group-hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.35)]',
    borderHover: 'group-hover:border-blue-400/60',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: Compass,
  },
  {
    id: 5,
    title: 'Hội Cựu Chiến Binh',
    subdomain: 'ccb.easupso.com',
    desc: 'Không gian sinh hoạt hội viên, nghĩa tình đồng đội và tư liệu truyền thống',
    color: 'from-rose-500 to-red-600',
    glowColor: 'group-hover:shadow-[0_20px_40px_-12px_rgba(244,63,94,0.35)]',
    borderHover: 'group-hover:border-rose-400/60',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    icon: ShieldCheck,
  },
  {
    id: 6,
    title: 'An Sinh Xã Hội',
    subdomain: 'nguoingheo.easupso.com',
    desc: 'Cứu trợ, hỗ trợ hộ nghèo, gia đình chính sách và quỹ vì người nghèo',
    color: 'from-pink-500 to-rose-600',
    glowColor: 'group-hover:shadow-[0_20px_40px_-12px_rgba(236,72,153,0.35)]',
    borderHover: 'group-hover:border-pink-400/60',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    icon: HeartHandshake,
  },
];

export function EcosystemBentoGrid() {
  return (
    <section id="ecosystem-grid" className="py-8 sm:py-12 lg:py-16 bg-[#0B132B]/80 backdrop-blur-md relative z-10 overflow-hidden border-y border-slate-800/80">
      {/* Hiệu ứng hào quang nền công nghệ */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER KHU VỰC CÔNG NGHỆ TINH GỌN */}
        <div className="text-center mb-8 sm:mb-12">
          {/* Badge nhỏ: Viền xanh neon & chữ phát sáng */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>CỔNG DỊCH VỤ SỐ ĐỊA PHƯƠNG</span>
          </div>

          {/* Heading: Gradient chữ trắng sang xanh ngọc */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            Hệ Sinh Thái Số Ea Súp
          </h2>

          {/* Phụ đề hướng tới người dân */}
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Nền tảng kết nối chính quyền, người dân và phát triển kinh tế - xã hội địa phương
          </p>
        </div>

        {/* LƯỚI BENTO GRID 6 ỨNG DỤNG CỐT LÕI */}
        {/* Responsive: Mobile 2 cột compact | Tablet 2 cột x 3 hàng | Desktop 3 cột x 2 hàng */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {ECOSYSTEM_APPS.map((app) => {
            const IconComponent = app.icon;

            return (
              <a
                key={app.id}
                href={`https://${app.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative rounded-2xl p-3.5 sm:p-5 lg:p-6 bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 ${app.borderHover} ${app.glowColor} transition-all duration-300 ease-out flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden`}
              >
                {/* Lớp phản chiếu ánh sáng nhẹ góc card khi hover */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                <div>
                  {/* Top Bar trong thẻ: Icon + Subdomain Badge + Action Arrow */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    {/* Icon container với gradient nhận diện */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${app.color} text-white shadow-lg shadow-black/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    {/* Mũi tên liên kết trên desktop/tablet */}
                    <div className="flex items-center gap-2">
                      <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${app.badgeColor}`}>
                        {app.subdomain}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 group-hover:bg-emerald-950/40 transition-all duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Tiêu đề ứng dụng */}
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {app.title}
                  </h3>

                  {/* Mô tả ứng dụng (ẩn bớt trên mobile siêu nhỏ, hiện đầy đủ từ tablet) */}
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2 leading-relaxed">
                    {app.desc}
                  </p>
                </div>

                {/* Subdomain hiển thị ở đáy card trên mobile compact */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between sm:hidden">
                  <span className="text-[10px] font-mono text-emerald-400/90 truncate max-w-[120px]">
                    {app.subdomain.replace('.easupso.com', '')}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>

                {/* Nút hành động trực quan trên Desktop */}
                <div className="hidden lg:flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs font-medium text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <span>Truy cập phân hệ</span>
                  <span className="font-mono text-[11px] text-slate-500 group-hover:text-slate-400">
                    https://{app.subdomain}
                  </span>
                </div>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  User,
  ChevronDown,
  FileText,
  LogOut,
  CalendarDays,
  MessageSquareText,
  Sprout,
  Compass,
  ShieldCheck,
  HeartHandshake,
  Award,
  ExternalLink,
  Home,
} from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Đóng menu và dropdown khi nhấn ra ngoài hoặc bấm Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // CÁC ỨNG DỤNG CỐT LÕI HỆ SINH THÁI SỐ XÃ EA SÚP + NÚT TRANG CHỦ
  const navLinks = [
    {
      label: 'Trang chủ',
      href: '/',
      isExternal: false,
      icon: Home,
      domain: '',
    },
    {
      label: 'Lịch công tác số',
      href: 'https://lichcongtac.easupso.com',
      isExternal: true,
      icon: CalendarDays,
      domain: 'lichcongtac.easupso.com',
    },
    {
      label: 'Tiếng nói cử tri',
      href: 'https://ykien.easupso.com',
      isExternal: true,
      icon: MessageSquareText,
      domain: 'ykien.easupso.com',
    },
    {
      label: 'Nông nghiệp số',
      href: 'https://nongnghiep.easupso.com',
      isExternal: true,
      icon: Sprout,
      domain: 'nongnghiep.easupso.com',
    },
    {
      label: 'Du lịch & Văn hóa',
      href: 'https://dulich.easupso.com',
      isExternal: true,
      icon: Compass,
      domain: 'dulich.easupso.com',
    },
    {
      label: 'Hội Cựu chiến binh',
      href: 'https://ccb.easupso.com',
      isExternal: true,
      icon: ShieldCheck,
      domain: 'ccb.easupso.com',
    },
    {
      label: 'An sinh xã hội',
      href: 'https://nguoingheo.easupso.com',
      isExternal: true,
      icon: HeartHandshake,
      domain: 'nguoingheo.easupso.com',
    },
    {
      label: 'Thi trực tuyến',
      href: 'https://thi.easupso.com',
      isExternal: true,
      icon: Award,
      domain: 'thi.easupso.com',
    },
  ];

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-[#FAF7F2] border-b border-[#E8E2D5] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          
          {/* 1. KHỐI LOGO & ĐỊNH DANH HÀNH CHÍNH (RỘNG RÃI, THOÁNG ĐÃNG, KHÔNG BAO GIỜ BỊ CHE CHỮ) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-lg min-w-0"
          >
            {/* Huy hiệu chính thức xã Ea Súp */}
            <div className="relative shrink-0 w-10 h-10 sm:w-13 sm:h-13 rounded-full p-0.5 shadow-md group-hover:scale-105 transition-transform overflow-hidden border-2 border-[#D4AF37] bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-easup.png"
                alt="Huy hiệu chính thức xã Ea Súp"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[9.5px] sm:text-xs font-bold tracking-wider text-[#1B4332] uppercase truncate">
                HỆ SINH THÁI SỐ XÃ EA SÚP
              </span>
              <span className="text-base sm:text-2xl font-black tracking-tight leading-none truncate inline-flex items-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
                <span className="bg-gradient-to-b from-[#A3E635] to-[#22C55E] bg-clip-text text-transparent">
                  EA
                </span>
                <span className="bg-gradient-to-b from-[#FBBF24] to-[#EA580C] bg-clip-text text-transparent">
                  SUP
                </span>
                <span className="bg-gradient-to-b from-[#22D3EE] to-[#2563EB] bg-clip-text text-transparent">
                  SO.COM
                </span>
              </span>
            </div>
          </Link>

          {/* 2. CỤM NÚT ĐIỀU HƯỚNG BÊN PHẢI (NÚT 3 GẠCH NGANG CHỨA CÁC LIÊN KẾT & ĐĂNG NHẬP) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* NÚT 3 GẠCH NGANG (HAMBURGER MENU): Chứa Trang chủ và tất cả các phân hệ liên kết */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white text-[#1B4332] border border-[#E8E2D5] hover:border-[#1B4332] hover:bg-[#FAF7F2] active:scale-95 transition flex items-center gap-2 shadow-2xs font-bold text-xs sm:text-sm cursor-pointer"
              aria-label="Danh mục ứng dụng hệ sinh thái số"
              title="Danh mục ứng dụng hệ sinh thái số"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#C85A32]" />
              ) : (
                <Menu className="w-5 h-5 text-[#1B4332]" />
              )}
              <span className="hidden sm:inline font-bold">Hệ sinh thái số</span>
            </button>

            {/* NÚT ĐĂNG NHẬP / PROFILE CÁN BỘ */}
            {status === 'loading' ? (
              <div className="h-9 w-20 bg-[#E8E2D5] animate-pulse rounded-xl" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B4332] text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#165B44] transition shadow-xs text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-[100px] sm:max-w-[140px] truncate">{session.user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E2D5] rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-[#E8E2D5] bg-[#FAF7F2]">
                      <p className="text-xs font-bold text-[#14211B]">{session.user.name}</p>
                      <p className="text-[11px] text-[#6B7C73] truncate">{session.user.email}</p>
                    </div>

                    {session.user.role !== 'PUBLIC' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1B4332] hover:bg-[#FAF7F2]"
                      >
                        <FileText className="w-4 h-4" />
                        Quản trị CMS Nội bộ
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left border-t border-[#E8E2D5] cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#C85A32] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#A84622] active:scale-95 transition shrink-0"
                title="Đăng nhập hệ thống"
              >
                <User className="w-4 h-4" />
                <span className="hidden xs:inline">Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* DANH MỤC HỆ SINH THÁI SỐ (SỔ XUỐNG KHI BẤM NÚT 3 DẤU GẠCH NGANG TRÊN CẢ MÁY TÍNH VÀ ĐIỆN THOẠI) */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E8E2D5] bg-[#FAF7F2] px-3 sm:px-6 lg:px-8 py-4 sm:py-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-[1440px] mx-auto space-y-3 sm:space-y-4">
            <div className="px-1 pb-2 border-b border-[#E8E2D5] flex items-center justify-between text-xs font-bold text-[#1B4332] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span>DANH MỤC CÁC PHÂN HỆ HỆ SINH THÁI SỐ XÃ EA SÚP</span>
              </div>
              <span className="text-[11px] text-[#8A9A90] font-mono lowercase">easupso.com</span>
            </div>

            {/* Lưới các nút phân hệ: 1 cột trên mobile, 2 cột trên tablet, 4 cột trên laptop/desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {navLinks.map((item) => {
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#1B4332] hover:bg-emerald-50/40 hover:shadow-xs active:scale-[0.99] transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#1B4332] group-hover:bg-[#1B4332] group-hover:text-white transition-colors shrink-0">
                        <IconComp className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#14211B] group-hover:text-[#1B4332] truncate">
                          {item.label}
                        </span>
                        {item.domain && (
                          <span className="text-[10.5px] font-mono text-[#8A9A90] truncate">
                            {item.domain}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.isExternal && (
                      <ExternalLink className="w-3.5 h-3.5 text-[#8A9A90] group-hover:text-[#1B4332] shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Thông tin tài khoản nhanh phía dưới menu khi mở */}
            {session?.user && (
              <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#1B4332] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Đang đăng nhập: <strong>{session.user.name}</strong> ({session.user.email})</span>
                </div>
                <div className="flex items-center gap-2">
                  {session.user.role !== 'PUBLIC' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-[#D4AF37] font-bold text-xs hover:bg-[#165B44] transition"
                    >
                      Quản trị CMS
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 transition cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

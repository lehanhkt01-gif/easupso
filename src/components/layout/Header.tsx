'use client';

import React, { useState } from 'react';
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
  ExternalLink,
  Home,
} from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // 6 ỨNG DỤNG CỐT LÕI HỆ SINH THÁI SỐ XÃ EA SÚP + NÚT TRANG CHỦ
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
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2] border-b border-[#E8E2D5] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. KHỐI LOGO & ĐỊNH DANH HÀNH CHÍNH */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-lg shrink-0"
          >
            {/* Huy hiệu chính thức xã Ea Súp */}
            <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 shadow-md group-hover:scale-105 transition-transform overflow-hidden border-2 border-[#D4AF37] bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-easup.png"
                alt="Huy hiệu chính thức xã Ea Súp"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs font-bold tracking-wider text-[#1B4332] uppercase">
                HỆ SINH THÁI SỐ XÃ EA SÚP
              </span>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-[#14211B] leading-none">
                EASUPSO.COM
              </span>
            </div>
          </Link>

          {/* 2. THANH ĐIỀU HƯỚNG MÁY TÍNH (HIỂN THỊ ĐỦ TRÊN MÀN HÌNH MÁY TÍNH) */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target={item.isExternal ? '_blank' : undefined}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                className="px-2.5 py-1.5 rounded-lg text-xs 2xl:text-[13px] font-bold text-[#14211B] hover:text-[#1B4332] hover:bg-[#1B4332]/5 transition-all whitespace-nowrap flex items-center gap-1 group"
              >
                <span>{item.label}</span>
                {item.isExternal && (
                  <ExternalLink className="w-3 h-3 text-[#8A9A90] group-hover:text-[#1B4332] transition-colors" />
                )}
              </Link>
            ))}

            {/* Nút Đăng nhập SSO chuẩn màu Đất Bazan */}
            {status === 'loading' ? (
              <div className="h-10 w-32 bg-[#E8E2D5] animate-pulse rounded-lg" />
            ) : session?.user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#C85A32] text-white hover:bg-[#A84622] transition shadow-sm text-xs font-bold cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">{session.user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E2D5] rounded-xl shadow-xl py-2 z-50">
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
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#C85A32] text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-[#A84622] active:translate-y-0.5 transition min-h-[40px] ml-2 shrink-0"
                title="Đăng nhập tài khoản Gmail / Cán bộ"
              >
                <User className="w-4 h-4" />
                <span>+ Đăng nhập Gmail</span>
              </Link>
            )}
          </nav>

          {/* 3. NÚT HAMBURGER MOBILE (3 GẠCH NGANG) */}
          <div className="flex xl:hidden items-center gap-2">
            {!session?.user && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-bold shadow-xs hover:bg-[#A84622] transition sm:hidden"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-[#1B4332] hover:bg-white border border-[#E8E2D5] min-h-[44px] min-w-[44px] flex items-center justify-center transition shadow-2xs cursor-pointer"
              aria-label="Mở menu 6 ứng dụng hệ sinh thái số"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER: 6 ỨNG DỤNG NẰM GỌN TRONG NÚT 3 GẠCH NGANG TRÊN ĐIỆN THOẠI */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#E8E2D5] bg-[#FAF7F2] px-4 py-4 space-y-3 shadow-lg">
          <div className="px-2 pb-1 border-b border-[#E8E2D5]/70 flex items-center justify-between text-xs font-bold text-[#1B4332] uppercase tracking-wider">
            <span>HỆ SINH THÁI SỐ EA SÚP</span>
            <span className="text-[10px] text-[#8A9A90] font-mono">easupso.com</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#1B4332] hover:bg-emerald-50/40 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#1B4332] group-hover:bg-[#1B4332] group-hover:text-white transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#14211B] group-hover:text-[#1B4332] truncate">
                        {item.label}
                      </span>
                      {item.domain && (
                        <span className="text-[10px] font-mono text-[#8A9A90] truncate">
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

          {/* Phần tài khoản đăng nhập trên mobile */}
          <div className="pt-3 border-t border-[#E8E2D5]">
            {session?.user ? (
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-[#E8E2D5]">
                  <p className="text-sm font-bold text-[#1B4332]">{session.user.name}</p>
                  <p className="text-xs text-[#6B7C73]">{session.user.email}</p>
                </div>
                {session.user.role !== 'PUBLIC' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-bold shadow-xs"
                  >
                    Vào Quản trị CMS
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-center py-2.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C85A32] text-white text-sm font-bold shadow-sm hover:bg-[#A84622] transition"
              >
                <User className="w-4 h-4" />
                <span>+ Đăng nhập Gmail / Cán bộ</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

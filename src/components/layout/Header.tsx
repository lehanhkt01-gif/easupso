'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown,
  FileText,
  User,
  Heart,
  Globe2,
} from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: '20 Thôn Buôn', href: '/thon-buon' },
    { label: 'Văn bản số', href: '#van-ban' },
    {
      label: 'Quỹ Vì người nghèo',
      href: 'https://nguoingheo.easupso.com',
      isExternal: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2] border-b border-[#E8E2D5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. KHỐI LOGO & ĐỊNH DANH HÀNH CHÍNH (THEO THIẾT KẾ MẪU) */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded-lg"
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
              <span className="text-xs font-bold tracking-wider text-[#1B4332] uppercase">
                HỆ SINH THÁI SỐ XÃ EA SÚP
              </span>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-[#14211B] leading-none">
                EASUPSO.COM
              </span>
            </div>
          </Link>

          {/* 2. THANH ĐIỀU HƯỚNG MÁY TÍNH */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target={item.isExternal ? '_blank' : undefined}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                className="text-sm font-semibold text-[#14211B] hover:text-[#1B4332] transition-colors py-2"
              >
                {item.label}
              </Link>
            ))}

            {/* Nút Đăng nhập SSO chuẩn màu Đất Bazan */}
            {status === 'loading' ? (
              <div className="h-10 w-32 bg-[#E8E2D5] animate-pulse rounded-lg" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#C85A32] text-white hover:bg-[#A84622] transition shadow-sm text-xs font-bold"
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
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left border-t border-[#E8E2D5]"
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
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#C85A32] text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-[#A84622] active:translate-y-0.5 transition min-h-[42px]"
                title="Đăng nhập tài khoản Gmail / Cán bộ"
              >
                <User className="w-4 h-4" />
                <span>+ Đăng nhập Gmail</span>
              </Link>
            )}
          </nav>

          {/* 3. NÚT HAMBURGER MOBILE */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-[#1B4332] hover:bg-[#FAF7F2] border border-[#E8E2D5] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E2D5] bg-[#FAF7F2] px-4 py-4 space-y-2">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-[#14211B] hover:bg-white"
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-[#E8E2D5]">
            {session?.user ? (
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg border border-[#E8E2D5]">
                  <p className="text-sm font-bold text-[#1B4332]">{session.user.name}</p>
                  <p className="text-xs text-[#6B7C73]">{session.user.email}</p>
                </div>
                {session.user.role !== 'PUBLIC' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold"
                  >
                    Vào Quản trị CMS
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-center py-2.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#C85A32] text-white text-sm font-bold shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>+ Đăng nhập Gmail</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

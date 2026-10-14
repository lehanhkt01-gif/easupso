'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  Users,
  CheckCircle2,
  Lock,
  Globe,
  Building,
  KeyRound,
  Mail,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('lehanhkt01@gmail.com');
  const [password, setPassword] = useState('Easup@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (status === 'authenticated') {
    window.location.href = session.user.role !== 'PUBLIC' ? '/admin' : '/';
  }

  async function handleQuickLoginAdmin() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await signIn('credentials', {
        email: 'lehanhkt01@gmail.com',
        password: 'Easup@2026!',
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Không thể đăng nhập: ' + res.error);
      } else {
        window.location.href = '/admin';
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Email hoặc mật khẩu không chính xác, hoặc tài khoản đang bị tạm khóa.');
      } else {
        window.location.href = '/admin';
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Nút quay về trang chủ */}
      <div className="max-w-md w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1B4332] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Cổng thông tin trang chủ
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border-2 border-[#D5CBBA] shadow-lg p-6 sm:p-8 space-y-6">
        
        {/* Header định danh */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#1B4332] border-2 border-[#D4AF37] mx-auto flex items-center justify-center shadow-md">
            <span className="font-serif text-[#D4AF37] font-black text-2xl leading-none">★</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1B4332] tracking-tight">
            ĐĂNG NHẬP MỘT CỬA SSO
          </h1>
          <p className="text-xs text-[#4A5B52]">
            Hệ sinh thái số xã Ea Súp &bull; Tỉnh Đắk Lắk
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. NÚT ĐĂNG NHẬP NHANH ADMIN (TIỆN LỢI CHO KIỂM THỬ) */}
        <div className="p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#D4AF37] space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332]">
            <Sparkles className="w-4 h-4 text-[#C85A32]" />
            <span>Đăng nhập trực tiếp Admin (Kiểm thử tức thì):</span>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleQuickLoginAdmin}
            className="w-full py-3 px-4 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>⚡ Vào Trang Quản trị (lehanhkt01@gmail.com)</span>
          </button>
          <p className="text-[11px] text-[#6B7C73] text-center">
            Tự động cấp quyền <strong>Super Admin</strong> toàn quyền thêm/sửa/xóa tài khoản, đổi mật khẩu.
          </p>
        </div>

        {/* 2. NÚT ĐĂNG NHẬP BẰNG GMAIL OAUTH */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#D5CBBA] bg-white hover:bg-gray-50 text-[#14211B] text-xs sm:text-sm font-bold shadow-xs active:translate-y-0.5 transition min-h-[44px]"
          >
            {/* Logo Google SVG */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.675-5.17 3.675-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>Đăng nhập bằng tài khoản Google (OAuth 2.0)</span>
          </button>
          <p className="text-[10px] text-gray-500 text-center leading-tight">
            (Lưu ý: Nút Google yêu cầu cấu hình Google Client ID thật trong file .env để tránh lỗi 401 invalid_client)
          </p>
        </div>

        {/* Đường phân cách */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E8E2D5]" />
          <span className="flex-shrink mx-3 text-[10px] font-bold text-[#6B7C73] uppercase tracking-wider">
            hoặc điền thông tin cán bộ
          </span>
          <div className="flex-grow border-t border-[#E8E2D5]" />
        </div>

        {/* 2. FORM ĐĂNG NHẬP MẬT KHẨU CÁN BỘ */}
        <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#14211B] mb-1">
              Email cán bộ:
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lehanhkt01@gmail.com"
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#D5CBBA] text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-[#FAF7F2] focus:bg-white"
              />
              <Mail className="w-4 h-4 text-[#6B7C73] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#14211B]">
                Mật khẩu:
              </label>
              <span className="text-[11px] text-[#6B7C73]">
                Mặc định: <strong className="text-[#1B4332] font-mono">Easup@2026!</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Easup@2026!"
                className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl border border-[#D5CBBA] text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-[#FAF7F2] focus:bg-white font-mono"
              />
              <KeyRound className="w-4 h-4 text-[#6B7C73] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#6B7C73] hover:text-[#1B4332]"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống Quản trị'}
          </button>
        </form>

        {/* Khung giải thích cơ chế phân quyền tự động Zero-Trust */}
        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-2 text-xs text-[#4A5B52]">
          <div className="flex items-center gap-1.5 font-bold text-[#1B4332] uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#C85A32]" />
            Chính sách Bảo mật &amp; Quyền hạn:
          </div>
          <p className="text-[11px] leading-relaxed">
            Hệ thống áp dụng cơ chế <strong>RBAC + ABAC</strong> kết hợp Google OAuth 2.0. Quản trị viên có toàn quyền thêm cán bộ, đặt quyền duyệt tin và đổi mật khẩu an toàn.
          </p>
        </div>

        <div className="pt-2 text-center text-[11px] text-[#6B7C73] space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-[#10B981]" />
            Kết nối mã hóa SSL 256-bit chuẩn Gov Zero-Trust
          </p>
          <p>Đường dây nóng hỗ trợ: <strong>0943 170 770</strong> | noreply@easupso.com</p>
        </div>
      </div>

      <div className="text-center text-xs text-[#6B7C73] mt-8">
        &copy; {new Date().getFullYear()} Ủy ban Mặt trận Tổ quốc Việt Nam xã Ea Súp, tỉnh Đắk Lắk.
      </div>
    </div>
  );
}

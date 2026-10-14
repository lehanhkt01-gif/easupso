'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  KeyRound,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chuyển hướng an toàn qua useEffect nếu phiên đăng nhập đã xác thực là cán bộ
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role && session.user.role !== 'PUBLIC') {
        window.location.href = '/admin';
      }
    }
  }, [status, session]);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn('credentials', {
        email: cleanEmail,
        password: cleanPassword,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Email hoặc mật khẩu không chính xác, hoặc tài khoản đang bị tạm khóa.');
        setIsLoading(false);
      } else if (res?.ok) {
        // Đăng nhập thành công -> chuyển thẳng tới trang quản trị
        window.location.href = '/admin';
      } else {
        setErrorMsg('Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
        setIsLoading(false);
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ xác thực.');
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
            ĐĂNG NHẬP HỆ THỐNG
          </h1>
          <p className="text-xs text-[#4A5B52]">
            Cổng thông tin &amp; Quản trị số xã Ea Súp &bull; Tỉnh Đắk Lắk
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM ĐĂNG NHẬP CÁN BỘ */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#14211B] mb-1.5">
              Email cán bộ:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email cán bộ (vd: lehanhkt01@gmail.com)"
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#D5CBBA] text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-[#FAF7F2] focus:bg-white"
              />
              <Mail className="w-4 h-4 text-[#6B7C73] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14211B] mb-1.5">
              Mật khẩu:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
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
            className="w-full py-3 px-4 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-0.5"
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

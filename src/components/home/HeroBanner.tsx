'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  AlertCircle,
  BellRing,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';

interface QuickAnnouncementData {
  id: string;
  title: string;
  content: string;
  linkUrl?: string | null;
  isUrgent: boolean;
}

interface SearchResults {
  query: string;
  apps: Array<{ id: string; name: string; subdomainUrl: string; shortDescription: string; badgeText: string }>;
  articles: Array<{ id: string; title: string; slug: string; summary: string; category?: { name: string } }>;
  announcements: Array<{ id: string; title: string; content: string; linkUrl?: string | null }>;
  totalResults: number;
}

export function HeroBanner({
  initialAnnouncements = [],
  heroImageUrl,
}: {
  initialAnnouncements?: QuickAnnouncementData[];
  heroImageUrl?: string | null;
}) {
  const [announcements, setAnnouncements] = useState<QuickAnnouncementData[]>(initialAnnouncements);
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);

  // Tìm kiếm hợp nhất
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Luân chuyển Ticker
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTickerIdx((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const currentAnnouncement = announcements[activeTickerIdx];

  return (
    <section className="relative overflow-hidden">
      
      {/* 1. DẢI TICKER THÔNG BÁO (NHỎ GỌN TRÊN CÙNG) */}
      {currentAnnouncement && (
        <div className={`py-1.5 px-4 text-xs font-medium border-b ${
          currentAnnouncement.isUrgent
            ? 'bg-[#C85A32] text-white border-[#A44725]'
            : 'bg-[#1B4332] text-white border-[#143326]'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 whitespace-nowrap">
                {currentAnnouncement.isUrgent ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-yellow-300 animate-pulse" />
                    Khẩn
                  </>
                ) : (
                  <>
                    <BellRing className="w-3 h-3 text-green-300" />
                    Thông báo
                  </>
                )}
              </span>

              <p className="truncate text-white/90 text-xs">
                <strong className="font-semibold">{currentAnnouncement.title}:</strong>{' '}
                <span className="opacity-95">{currentAnnouncement.content}</span>
              </p>
            </div>

            {currentAnnouncement.linkUrl && (
              <a
                href={currentAnnouncement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold underline hover:text-yellow-200 whitespace-nowrap ml-2"
              >
                Chi tiết <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. KHUNG HERO TOÀN CẢNH HỒ EA SÚP & THÁP YANG PRONG (THEO HÌNH ẢNH MẪU) */}
      <div className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] flex items-center justify-center">
        {/* Hình nền toàn cảnh Hồ Ea Súp Thượng và Tháp Chăm Yang Prong */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `url('${heroImageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85'}')`,
          }}
        />

        {/* Lớp phủ Gradient điện ảnh: Bảo đảm độ tương phản chữ trắng tuyệt đối */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F251C]/85 via-[#1B4332]/65 to-[#C85A32]/45" />

        {/* Khối nội dung chính giữa */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-10 sm:py-14 space-y-5">
          
          {/* Tiêu đề chính luận theo chuẩn hình mẫu */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] uppercase">
            CỔNG THÔNG TIN &amp; DỊCH VỤ SỐ
            <span className="block mt-1 sm:mt-2">XÃ EA SÚP</span>
          </h1>

          {/* Thanh tìm kiếm tròn bo cong theo hình ảnh mẫu */}
          <div ref={searchContainerRef} className="relative max-w-xl mx-auto">
            <div className="relative flex items-center bg-white rounded-full shadow-2xl px-4 py-2 border-2 border-white/80 focus-within:ring-4 focus-within:ring-[#D4AF37]/40 transition-all">
              <Search className="w-5 h-5 text-[#4A5B52] flex-shrink-0 mr-2.5" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults && searchResults.totalResults > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder="Tìm kiếm thông tin, dịch vụ công, tin tức..."
                className="w-full py-1.5 text-xs sm:text-sm text-[#14211B] placeholder-[#6B7C73] focus:outline-none bg-transparent"
                aria-label="Tìm kiếm"
              />

              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C85A32]" />
              ) : searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                    setIsDropdownOpen(false);
                  }}
                  className="text-[#6B7C73] hover:text-[#14211B]"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Dropdown kết quả tìm kiếm */}
            {isDropdownOpen && searchResults && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#D5CBBA] text-left z-50 overflow-hidden max-h-[380px] overflow-y-auto">
                <div className="p-3 bg-[#FAF7F2] border-b border-[#E8E2D5] flex items-center justify-between text-xs text-[#4A5B52]">
                  <span>Kết quả cho: &ldquo;<strong>{searchResults.query}</strong>&rdquo;</span>
                  <span className="font-bold text-[#1B4332]">{searchResults.totalResults} kết quả</span>
                </div>

                {searchResults.totalResults === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B7C73]">
                    Không tìm thấy dữ liệu phù hợp với từ khóa này.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8E2D5] text-xs">
                    {searchResults.apps.length > 0 && (
                      <div className="p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A32] block mb-1">
                          Phân hệ số
                        </span>
                        {searchResults.apps.map((app) => (
                          <a
                            key={app.id}
                            href={app.subdomainUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF7F2] transition"
                          >
                            <span className="font-bold text-[#1B4332]">{app.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#C85A32]" />
                          </a>
                        ))}
                      </div>
                    )}

                    {searchResults.articles.length > 0 && (
                      <div className="p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332] block mb-1">
                          Bản tin hoạt động
                        </span>
                        {searchResults.articles.map((art) => (
                          <Link
                            key={art.id}
                            href={`/news/${art.slug}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="block p-2 rounded-lg hover:bg-[#FAF7F2] transition"
                          >
                            <p className="font-semibold text-[#14211B] line-clamp-1">{art.title}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

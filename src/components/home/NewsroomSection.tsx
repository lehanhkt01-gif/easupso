'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string | null;
  orgCode: string;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  category: {
    id: string;
    slug: string;
    name: string;
    badgeColor: string;
  };
  village?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả', slug: '' },
  { id: 'mttq', label: 'Ủy ban MTTQ', slug: 'mat-tran-to-quoc' },
  { id: 'phu-nu', label: 'Hội Phụ nữ', slug: 'hoi-phu-nu' },
  { id: 'nong-dan', label: 'Hội Nông dân', slug: 'hoi-nong-dan' },
  { id: 'doan-tn', label: 'Đoàn Thanh niên', slug: 'doan-thanh-nien' },
  { id: 'ccb', label: 'Hội CCB', slug: 'hoi-cuu-chien-binh' },
  { id: 'thon-buon', label: '20 Thôn Buôn', slug: 'hoat-dong-thon-buon' },
];

export function NewsroomSection({
  initialArticles = [],
}: {
  initialArticles?: NewsItem[];
}) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [articles, setArticles] = useState<NewsItem[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch khi đổi tab
  useEffect(() => {
    let isMounted = true;
    async function loadFilteredNews() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        params.set('limit', '6');

        const res = await fetch(`/api/public/news?${params.toString()}`);
        const json = await res.json();
        if (isMounted && json.success) {
          setArticles(json.data);
        }
      } catch (err) {
        console.error('Lỗi tải tin tức:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (selectedCategory) {
      loadFilteredNews();
    } else if (initialArticles.length > 0 && articles.length === 0) {
      setArticles(initialArticles);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, initialArticles]);

  // Danh sách bài hiển thị (tối đa 3-6 bài)
  const displayArticles = articles.length > 0 ? articles : [
    {
      id: 'mock-1',
      title: 'Tập huấn chuyển đổi số tổ công nghệ số cộng đồng',
      slug: 'tap-huan-chuyen-doi-so-to-cong-nghe-so-cong-dong',
      summary: 'Đoàn Thanh niên và cán bộ Mặt trận xã hướng dẫn bà con 20 thôn buôn sử dụng dịch vụ công trực tuyến.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
      category: { name: 'Chuyển đổi số' },
    },
    {
      id: 'mock-2',
      title: 'Hoạt động các Thôn Buôn',
      slug: 'hoat-dong-cac-thon-buon',
      summary: 'Nhân dân các thôn buôn sôi nổi họp bàn kế hoạch thi đua xây dựng nông thôn mới và giữ gìn bản sắc văn hóa.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80',
      category: { name: '20 Thôn Buôn' },
    },
    {
      id: 'mock-3',
      title: 'Quỹ vì người nghèo Ea Súp',
      slug: 'quy-vi-nguoi-ngheo-ea-sup',
      summary: 'Trao tặng nhà Đại đoàn kết và vốn sinh kế cho hộ nghèo, cận nghèo trên địa bàn xã Ea Súp năm 2026.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80',
      category: { name: 'Vì người nghèo' },
    },
  ];

  return (
    <section id="tin-tuc" className="py-10 sm:py-14 bg-[#FAF7F2] border-t border-[#E8E2D5]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TIÊU ĐỀ KHU VỰC THEO HÌNH ẢNH MẪU */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#14211B] uppercase tracking-wide">
            BẢN TIN HOẠT ĐỘNG MẶT TRẬN &amp; CÁC ĐOÀN THỂ
          </h2>
        </div>

        {/* CÁC NÚT TAB TRÒN BO CONG (PILL TABS THEO HÌNH ẢNH MẪU) */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.slug;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#173C2D] text-white border-[#173C2D] shadow-xs'
                    : 'bg-white text-[#4A5B52] border-[#D5CBBA] hover:border-[#173C2D] hover:text-[#173C2D]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* LƯỚI THẺ BÀI VIẾT THEO HÌNH ẢNH MẪU (3 CỘT ĐỀU ĐẶN) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-72 bg-gray-200 rounded-2xl" />
            <div className="h-72 bg-gray-200 rounded-2xl" />
            <div className="h-72 bg-gray-200 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayArticles.slice(0, 3).map((art: any) => (
              <Link
                key={art.id}
                href={`/news/${art.slug}`}
                className="bg-white rounded-2xl overflow-hidden border border-[#D5CBBA] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col justify-between"
              >
                {/* Ảnh bài viết */}
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                  <img
                    src={art.thumbnailUrl || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80'}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Tiêu đề & nội dung bài viết */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#14211B] group-hover:text-[#1B4332] leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#6B7C73] mt-2 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E2D5] flex items-center justify-between text-xs text-[#1B4332] font-semibold">
                    <span className="text-[11px] text-[#C85A32]">{art.category?.name || 'Mặt trận'}</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

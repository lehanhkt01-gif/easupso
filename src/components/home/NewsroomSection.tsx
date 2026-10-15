'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  PlusCircle,
  Edit2,
  Trash2,
  Images,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { NewsEditorModal } from '@/components/news/NewsEditorModal';
import { ArticleMediaItem } from '@/lib/news-gallery';

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml?: string;
  thumbnailUrl: string | null;
  images?: string[];
  mediaItems?: ArticleMediaItem[];
  orgCode: string;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  category: {
    id: string;
    slug: string;
    name: string;
    badgeColor?: string;
  };
  village?: {
    id: string;
    name: string;
    code: string;
  } | null;
  author?: {
    name?: string | null;
    positionTitle?: string | null;
  } | null;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả bản tin', slug: '' },
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
  const { data: session } = useSession();
  const isStaff = Boolean(session?.user && session.user.role && session.user.role !== 'PUBLIC');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [articles, setArticles] = useState<NewsItem[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch khi đổi tab chuyên mục
  useEffect(() => {
    let isMounted = true;
    async function loadFilteredNews() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        params.set('limit', '12');

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

    loadFilteredNews();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // Mở modal tạo mới
  function handleOpenCreateModal() {
    setEditingArticle(null);
    setIsModalOpen(true);
  }

  // Mở modal sửa
  function handleOpenEditModal(e: React.MouseEvent, art: any) {
    e.preventDefault();
    e.stopPropagation();
    setEditingArticle(art);
    setIsModalOpen(true);
  }

  // Xóa bài viết
  async function handleDeleteArticle(e: React.MouseEvent, art: any) {
    e.preventDefault();
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Đồng chí có chắc chắn muốn XÓA VĨNH VIỄN bản tin:\n"${art.title}"?\n\nHành động này không thể hoàn tác.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/news/${art.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setArticles((prev) => prev.filter((item) => item.id !== art.id));
        setActionNotice(`Đã xóa bản tin "${art.title}" thành công!`);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        alert(json.error || 'Xóa bài viết thất bại.');
      }
    } catch {
      alert('Lỗi mạng khi xóa bài viết.');
    }
  }

  // Callback sau khi lưu thành công từ Modal
  function handleSaveSuccess(savedArticle: any) {
    if (editingArticle) {
      setArticles((prev) =>
        prev.map((item) => (item.id === savedArticle.id ? { ...item, ...savedArticle } : item))
      );
      setActionNotice('Đã cập nhật bản tin thành công!');
    } else {
      setArticles((prev) => [savedArticle, ...prev]);
      setActionNotice('Đã đăng bản tin mới thành công!');
    }
    setTimeout(() => setActionNotice(null), 4000);
  }

  // Phân chia bài viết cho bố cục Editorial: 1 Tin tiêu điểm lớn + Các tin vệ tinh
  const leadStory = articles[0] || null;
  const secondaryStories = articles.slice(1, 4);
  const remainingStories = articles.slice(4);

  return (
    <section id="tin-tuc" className="py-12 sm:py-16 bg-[#FAF7F2] border-t border-[#E8E2D5] overflow-x-clip">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TIÊU ĐỀ KHU VỰC BẢN TIN CHUẨN BÁO CHÍ */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>TÒA SOẠN SỐ MẶT TRẬN &amp; ĐOÀN THỂ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14211B] tracking-tight uppercase">
            BẢN TIN HOẠT ĐỘNG XÃ EA SÚP
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5B52] mt-1.5 max-w-2xl mx-auto">
            Tin tức thời sự, phong trào thi đua và hoạt động đại đoàn kết toàn dân tộc tại 20 thôn buôn
          </p>
        </div>

        {/* THÔNG BÁO THAO TÁC CÁN BỘ (NẾU CÓ) */}
        {actionNotice && (
          <div className="max-w-xl mx-auto mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* THANH CÔNG CỤ CÁN BỘ KHI ĐÃ ĐĂNG NHẬP */}
        {isStaff && (
          <div className="max-w-4xl mx-auto mb-8 p-3.5 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-8 h-8 rounded-lg bg-[#1B4332] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-xs">
                ★
              </span>
              <div>
                <p className="font-bold text-[#1B4332]">
                  Quyền Quản lý Tòa soạn: {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-[11px] text-[#6B7C73]">
                  Hỗ trợ định dạng bài viết chuyên nghiệp, dàn trang ảnh thông minh &bull; Tối đa 7 ảnh/bài
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Đăng bản tin mới</span>
            </button>
          </div>
        )}

        {/* CÁC NÚT TAB CHUYÊN MỤC TRÒN BO CONG */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.slug;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.slug)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#173C2D] text-white border-[#173C2D] shadow-sm'
                    : 'bg-white text-[#4A5B52] border-[#D5CBBA] hover:border-[#173C2D] hover:text-[#173C2D]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* KHU VỰC HIỂN THỊ NỘI DUNG (LOADING / EMPTY / EDITORIAL GRID) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="col-span-1 md:col-span-2 h-96 bg-gray-200 rounded-2xl" />
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#D5CBBA] p-8 max-w-md mx-auto">
            <p className="text-sm font-bold text-[#14211B]">Chưa có bản tin nào thuộc chuyên mục này.</p>
            {isStaff && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-3 px-4 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>Đăng bản tin đầu tiên ngay</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. KHỐI TIÊU ĐIỂM BÁO CHÍ (EDITORIAL HERO SECTION) */}
            {leadStory && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* TIN TIÊU ĐIỂM LỚN (FEATURED LEAD STORY - Chiếm 7 hoặc 12 cột) */}
                <div
                  className={`${
                    secondaryStories.length > 0 ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'
                  } bg-white rounded-2xl border border-[#D5CBBA] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group relative`}
                >
                  {/* BẢNG THAO TÁC CÁN BỘ (SỬA / XÓA) */}
                  {isStaff && (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1.5 rounded-xl border border-white/20 shadow-md">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(e, leadStory)}
                        className="px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-yellow-600 text-[#14211B] font-bold text-xs flex items-center gap-1 transition shadow-xs"
                        title="Chỉnh sửa bản tin này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteArticle(e, leadStory)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                        title="Xóa vĩnh viễn bản tin này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}

                  <Link href={`/news/${leadStory.slug}`} className="flex flex-col h-full justify-between">
                    {/* Ảnh lớn bìa tiêu điểm */}
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-stone-100 overflow-hidden">
                      <img
                        src={
                          leadStory.thumbnailUrl ||
                          leadStory.images?.[0] ||
                          'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'
                        }
                        alt={leadStory.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Huy hiệu số lượng ảnh */}
                      {(leadStory.images?.length || 0) > 1 && (
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 shadow">
                          <Images className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>📸 {leadStory.images?.length} ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Nội dung tiêu điểm */}
                    <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Huy hiệu Chuyên mục & Thôn buôn */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-[#1B4332] text-white">
                            {leadStory.category?.name || 'Ủy ban MTTQ xã'}
                          </span>
                          {leadStory.village && (
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#FAF0EC] text-[#C85A32] border border-[#EBBAA7] flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{leadStory.village.name}</span>
                            </span>
                          )}
                          <span className="text-[11px] text-[#6B7C73] flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3 text-[#C85A32]" />
                            <span>
                              {leadStory.publishedAt
                                ? new Date(leadStory.publishedAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : 'Vừa đăng'}
                            </span>
                          </span>
                        </div>

                        {/* Tiêu đề tiêu điểm báo chí */}
                        <h3 className="font-serif text-lg sm:text-2xl font-bold text-[#14211B] group-hover:text-[#1B4332] leading-snug tracking-tight mb-2.5 transition-colors">
                          {leadStory.title}
                        </h3>

                        {/* Sapo tiêu điểm */}
                        <p className="text-xs sm:text-sm text-[#4A5B52] leading-relaxed line-clamp-3">
                          {leadStory.summary}
                        </p>
                      </div>

                      {/* Footer thẻ */}
                      <div className="mt-5 pt-3.5 border-t border-[#E8E2D5] flex items-center justify-between text-xs font-bold text-[#1B4332]">
                        <span className="text-[#C85A32]">
                          {leadStory.author?.name || 'Ủy ban MTTQ Việt Nam xã Ea Súp'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform text-[#1B4332]">
                          <span>Xem toàn văn bài báo</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* DANH SÁCH BẢN TIN VỆ TINH PHÍA PHẢI (NẾU CÓ) */}
                {secondaryStories.length > 0 && (
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                    {secondaryStories.map((art) => {
                      const imageCount = art.images?.length || (art.thumbnailUrl ? 1 : 0);
                      return (
                        <div
                          key={art.id}
                          className="bg-white rounded-2xl border border-[#D5CBBA] shadow-xs hover:shadow-md transition-all overflow-hidden p-3.5 sm:p-4 group relative flex flex-col justify-between"
                        >
                          {/* Nút sửa/xóa cho cán bộ */}
                          {isStaff && (
                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditModal(e, art)}
                                className="p-1 rounded bg-[#D4AF37] text-[#14211B] text-[10px] font-bold"
                                title="Sửa bài"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteArticle(e, art)}
                                className="p-1 rounded bg-red-600 text-white text-[10px] font-bold"
                                title="Xóa bài"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <Link href={`/news/${art.slug}`} className="flex gap-3.5 items-start">
                            {/* Ảnh thumbnail nhỏ */}
                            <div className="relative w-24 sm:w-28 aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 shrink-0">
                              <img
                                src={
                                  art.thumbnailUrl ||
                                  art.images?.[0] ||
                                  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=300&q=80'
                                }
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              {imageCount > 1 && (
                                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-white text-[9px] font-mono">
                                  📸{imageCount}
                                </span>
                              )}
                            </div>

                            {/* Tiêu đề & metadata */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase text-[#C85A32] truncate">
                                  {art.category?.name || 'Mặt trận'}
                                </span>
                                {art.village && (
                                  <span className="text-[10px] text-[#6B7C73] truncate">
                                    &bull; {art.village.name}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-[#14211B] group-hover:text-[#1B4332] leading-snug line-clamp-2">
                                {art.title}
                              </h4>

                              <p className="text-[11px] text-[#6B7C73] line-clamp-1 mt-1">
                                {art.summary}
                              </p>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* 2. LƯỚI BẢN TIN BỔ SUNG (NẾU CÒN NHIỀU BÀI VIẾT) */}
            {remainingStories.length > 0 && (
              <div className="pt-6 border-t border-[#E8E2D5]">
                <h4 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide mb-4">
                  Các bản tin hoạt động khác
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {remainingStories.map((art) => {
                    const imageCount = art.images?.length || (art.thumbnailUrl ? 1 : 0);
                    return (
                      <div
                        key={art.id}
                        className="bg-white rounded-2xl overflow-hidden border border-[#D5CBBA] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between relative"
                      >
                        {isStaff && (
                          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1.5 rounded-xl border border-white/20 shadow-md">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(e, art)}
                              className="px-2 py-1 rounded-lg bg-[#D4AF37] hover:bg-yellow-600 text-[#14211B] font-bold text-[11px] flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteArticle(e, art)}
                              className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}

                        <Link href={`/news/${art.slug}`} className="flex flex-col h-full justify-between">
                          <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden">
                            <img
                              src={
                                art.thumbnailUrl ||
                                art.images?.[0] ||
                                'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80'
                              }
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {imageCount > 1 && (
                              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1">
                                <Images className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>📸 {imageCount} ảnh</span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span className="font-bold text-[#C85A32] uppercase">
                                  {art.category?.name || 'Mặt trận'}
                                </span>
                                {art.village && <span className="text-[#6B7C73]">{art.village.name}</span>}
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-[#14211B] group-hover:text-[#1B4332] leading-snug line-clamp-2">
                                {art.title}
                              </h3>
                              <p className="text-xs text-[#6B7C73] mt-2 line-clamp-2 leading-relaxed">
                                {art.summary}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#E8E2D5] flex items-center justify-between text-xs text-[#1B4332] font-semibold">
                              <span>Xem chi tiết</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL SOẠN THẢO BẢN TIN TÒA SOẠN CHUYÊN NGHIỆP */}
      <NewsEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveSuccess}
        articleToEdit={editingArticle}
      />
    </section>
  );
}

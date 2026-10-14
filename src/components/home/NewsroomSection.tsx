'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  PlusCircle,
  Edit2,
  Trash2,
  Images,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { NewsEditorModal } from '@/components/news/NewsEditorModal';

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml?: string;
  thumbnailUrl: string | null;
  images?: string[];
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
        params.set('limit', '9');

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

  // Xử lý mở modal thêm mới bài viết
  function handleOpenCreateModal() {
    setEditingArticle(null);
    setIsModalOpen(true);
  }

  // Xử lý mở modal chỉnh sửa bài viết
  function handleOpenEditModal(e: React.MouseEvent, art: any) {
    e.preventDefault();
    e.stopPropagation();
    setEditingArticle(art);
    setIsModalOpen(true);
  }

  // Xử lý xóa bài viết
  async function handleDeleteArticle(e: React.MouseEvent, art: any) {
    e.preventDefault();
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Đồng chí có chắc chắn muốn XÓA bản tin:\n"${art.title}"?\n\nHành động này không thể hoàn tác.`
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
      // Cập nhật bài cũ
      setArticles((prev) =>
        prev.map((item) => (item.id === savedArticle.id ? { ...item, ...savedArticle } : item))
      );
      setActionNotice('Đã cập nhật bài viết thành công!');
    } else {
      // Thêm bài mới lên đầu danh sách
      setArticles((prev) => [savedArticle, ...prev]);
      setActionNotice('Đã đăng bản tin mới thành công!');
    }
    setTimeout(() => setActionNotice(null), 4000);
  }

  return (
    <section id="tin-tuc" className="py-10 sm:py-14 bg-[#FAF7F2] border-t border-[#E8E2D5]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TIÊU ĐỀ KHU VỰC BẢN TIN */}
        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#14211B] uppercase tracking-wide">
            BẢN TIN HOẠT ĐỘNG MẶT TRẬN &amp; CÁC ĐOÀN THỂ
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5B52] mt-1">
            Thông tin tuyên truyền, phong trào thi đua và tin tức cơ sở 20 thôn buôn xã Ea Súp
          </p>
        </div>

        {/* THÔNG BÁO THAO TÁC CÁN BỘ (NẾU CÓ) */}
        {actionNotice && (
          <div className="max-w-xl mx-auto mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* THANH CÔNG CỤ CÁN BỘ KHI ĐÃ ĐĂNG NHẬP */}
        {isStaff && (
          <div className="max-w-4xl mx-auto mb-6 p-3 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-7 h-7 rounded-lg bg-[#1B4332] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-xs">
                ★
              </span>
              <div>
                <p className="font-bold text-[#1B4332]">
                  Quyền Biên tập viên: {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-[11px] text-[#6B7C73]">
                  Đồng chí có quyền Đăng mới, Chỉnh sửa và Xóa bản tin (Tối đa 7 ảnh/bài, &lt; 5MB/ảnh)
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Đăng bản tin mới</span>
            </button>
          </div>
        )}

        {/* CÁC NÚT TAB CHUYÊN MỤC TRÒN BO CONG */}
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

        {/* LƯỚI THẺ BÀI VIẾT (3 CỘT ĐỀU ĐẶN) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-80 bg-gray-200 rounded-2xl" />
            <div className="h-80 bg-gray-200 rounded-2xl" />
            <div className="h-80 bg-gray-200 rounded-2xl" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art: any) => {
              const imageCount = art.images?.length || (art.thumbnailUrl ? 1 : 0);
              return (
                <div
                  key={art.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#D5CBBA] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between relative"
                >
                  {/* BẢNG THAO TÁC CÁN BỘ (SỬA / XÓA) */}
                  {isStaff && (
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1.5 rounded-xl border border-white/20 shadow-md">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(e, art)}
                        className="px-2 py-1 rounded-lg bg-[#D4AF37] hover:bg-yellow-600 text-[#14211B] font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                        title="Chỉnh sửa bản tin này"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteArticle(e, art)}
                        className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                        title="Xóa vĩnh viễn bản tin này"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}

                  <Link href={`/news/${art.slug}`} className="flex flex-col h-full justify-between">
                    {/* Ảnh bài viết */}
                    <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
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

                      {/* Huy hiệu số lượng ảnh đính kèm (nếu có từ 2 ảnh trở lên) */}
                      {imageCount > 1 && (
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1 shadow">
                          <Images className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>📸 {imageCount} ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Tiêu đề & nội dung tóm tắt */}
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
                        <span className="text-[11px] text-[#C85A32] font-bold">
                          {art.category?.name || 'Mặt trận'}
                        </span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL SOẠN THẢO BẢN TIN (THÊM / SỬA CÓ TỐI ĐA 7 ẢNH) */}
      <NewsEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveSuccess}
        articleToEdit={editingArticle}
      />
    </section>
  );
}

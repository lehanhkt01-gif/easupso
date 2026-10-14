'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Building,
  MapPin,
  Sparkles,
  Eye,
} from 'lucide-react';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';

export const MAX_ARTICLE_IMAGES = 7;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface NewsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (article: any) => void;
  articleToEdit?: any | null; // Nếu có -> Chế độ Chỉnh sửa; Nếu null -> Tạo mới
  categories?: Array<{ id: string; name: string; orgCode: string; slug: string }>;
}

export function NewsEditorModal({
  isOpen,
  onClose,
  onSuccess,
  articleToEdit,
  categories = [
    { id: 'cat-mttq', name: 'Ủy ban MTTQ xã', orgCode: 'MTTQ', slug: 'mat-tran-to-quoc' },
    { id: 'cat-phunu', name: 'Hội LH Phụ nữ', orgCode: 'PHU_NU', slug: 'hoi-phu-nu' },
    { id: 'cat-nongdan', name: 'Hội Nông dân', orgCode: 'NONG_DAN', slug: 'hoi-nong-dan' },
    { id: 'cat-doantn', name: 'Đoàn Thanh niên', orgCode: 'DOAN_TN', slug: 'doan-thanh-nien' },
    { id: 'cat-ccb', name: 'Hội Cựu chiến binh', orgCode: 'CCB', slug: 'hoi-cuu-chien-binh' },
    { id: 'cat-thonbuon', name: '20 Thôn Buôn', orgCode: 'THON_BUON', slug: 'hoat-dong-thon-buon' },
    { id: 'cat-vinguoingheo', name: 'Vì người nghèo', orgCode: 'MTTQ', slug: 'vi-nguoi-ngheo' },
  ],
}: NewsEditorModalProps) {
  const isEditMode = Boolean(articleToEdit?.id);

  const [categoriesList, setCategoriesList] = useState(categories);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [villageId, setVillageId] = useState('');
  const [orgCode, setOrgCode] = useState('MTTQ');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  // Nạp danh mục thực tế từ CSDL
  useEffect(() => {
    async function loadRealCategories() {
      try {
        const res = await fetch('/api/public/categories');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategoriesList(json.data);
          if (!articleToEdit && !categoryId) {
            setCategoryId(json.data[0].id);
            setOrgCode(json.data[0].orgCode);
          }
        }
      } catch {}
    }
    loadRealCategories();
  }, [articleToEdit, categoryId]);

  // Quản lý tối đa 7 ảnh
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo dữ liệu khi mở modal hoặc đổi bài viết cần sửa
  useEffect(() => {
    if (articleToEdit) {
      setTitle(articleToEdit.title || '');
      setSummary(articleToEdit.summary || '');
      
      // Khử HTML để hiển thị dạng văn bản tự nhiên trong textarea
      let rawContent = articleToEdit.contentHtml || '';
      rawContent = rawContent
        .replace(/<!-- EASUPSO_GALLERY:\[.*?\] -->/g, '')
        .replace(/<div class="easup-photo-gallery".*?<\/div><!-- END_EASUPSO_GALLERY -->/s, '')
        .replace(/<\/p><p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
      setContent(rawContent);

      setCategoryId(articleToEdit.categoryId || categories[0]?.id || '');
      setVillageId(articleToEdit.villageId || '');
      setOrgCode(articleToEdit.orgCode || 'MTTQ');
      setStatus(articleToEdit.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');

      // Danh sách ảnh
      const initialImages: string[] = [];
      if (articleToEdit.images && Array.isArray(articleToEdit.images)) {
        initialImages.push(...articleToEdit.images);
      } else if (articleToEdit.thumbnailUrl) {
        initialImages.push(articleToEdit.thumbnailUrl);
      }
      setImages(initialImages.slice(0, MAX_ARTICLE_IMAGES));
      setCoverIndex(0);
    } else {
      // Reset khi tạo mới
      setTitle('');
      setSummary('');
      setContent('');
      setCategoryId(categories[0]?.id || '');
      setVillageId('');
      setOrgCode('MTTQ');
      setStatus('PUBLISHED');
      setImages([]);
      setCoverIndex(0);
    }
    setUploadError(null);
    setSubmitError(null);
  }, [articleToEdit, isOpen]);

  // Cập nhật orgCode tương ứng khi chọn Category
  function handleCategoryChange(selectedCatId: string) {
    setCategoryId(selectedCatId);
    const found = categoriesList.find((c) => c.id === selectedCatId);
    if (found?.orgCode) {
      setOrgCode(found.orgCode);
    }
  }

  // Xử lý chọn và upload ảnh (Kiểm tra tối đa 7 ảnh, mỗi ảnh < 5MB)
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploadError(null);

    // 1. Kiểm tra số lượng ảnh còn được phép chọn
    const remainingSlots = MAX_ARTICLE_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setUploadError(`Bản tin đã đạt giới hạn tối đa ${MAX_ARTICLE_IMAGES} tấm ảnh.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setUploadError(
        `Đồng chí chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (Tổng tối đa 7 ảnh mỗi bản tin).`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Kiểm tra dung lượng từng tấm ảnh (< 5MB)
    for (const f of selectedFiles) {
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
        setUploadError(`Ảnh "${f.name}" có dung lượng ${sizeMb} MB, vượt quá giới hạn tối đa 5MB!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // 3. Tiến hành tải lên qua API /api/admin/upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.urls) {
        const newImagesList = [...images, ...json.urls].slice(0, MAX_ARTICLE_IMAGES);
        setImages(newImagesList);
      } else {
        setUploadError(json.error || 'Tải ảnh lên máy chủ thất bại.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Lỗi mạng khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Xóa một ảnh khỏi danh sách
  function handleRemoveImage(indexToRemove: number) {
    const nextImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(nextImages);
    if (coverIndex === indexToRemove) {
      setCoverIndex(0);
    } else if (coverIndex > indexToRemove) {
      setCoverIndex(coverIndex - 1);
    }
  }

  // Đặt làm ảnh bìa
  function handleSetAsCover(idx: number) {
    setCoverIndex(idx);
    // Đẩy ảnh bìa lên đầu danh sách để đảm bảo hiển thị đồng bộ
    const reordered = [images[idx], ...images.filter((_, i) => i !== idx)];
    setImages(reordered);
    setCoverIndex(0);
  }

  // Xử lý gửi Form (Tạo mới hoặc Cập nhật)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Vui lòng nhập tiêu đề bản tin.');
      return;
    }
    if (!content.trim()) {
      setSubmitError('Vui lòng nhập nội dung chi tiết bài viết.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Chuẩn hóa định dạng nội dung HTML từ các dòng văn bản
      const paragraphs = content
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');

      const coverImageUrl = images.length > 0 ? images[coverIndex] || images[0] : null;

      const payload = {
        title: title.trim(),
        summary: summary.trim() || title.trim().slice(0, 160),
        contentHtml: paragraphs,
        categoryId,
        villageId: villageId || null,
        orgCode,
        thumbnailUrl: coverImageUrl,
        images,
        status,
      };

      const url = isEditMode ? `/api/admin/news/${articleToEdit.id}` : '/api/admin/news';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onSuccess(json.data);
        onClose();
      } else {
        setSubmitError(json.error || 'Thao tác lưu bài viết thất bại.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Lỗi mạng khi lưu bài viết.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] w-full max-w-3xl rounded-2xl border-2 border-[#D5CBBA] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-[#1B4332] text-white flex items-center justify-between border-b-2 border-[#D4AF37] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm">
              {isEditMode ? '✏️' : '📝'}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                {isEditMode ? 'Chỉnh sửa bản tin hoạt động' : 'Đăng bản tin mới — Cổng Ea Súp'}
              </h3>
              <p className="text-[11px] text-[#A3B899]">
                Quy định chuẩn: Đăng tối đa 7 ảnh, mỗi ảnh dưới 5MB &bull; Kiểm duyệt an toàn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. Tiêu đề bản tin */}
          <div>
            <label className="block text-xs font-bold text-[#14211B] mb-1.5 uppercase tracking-wide">
              Tiêu đề bản tin <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vd: Hội Cựu chiến binh xã Ea Súp trao tặng nhà Nghĩa tình đồng đội..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBBA] bg-white text-sm font-semibold text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          {/* 2. Chuyên mục & Địa bàn 20 thôn buôn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#14211B] mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Chuyên mục / Đoàn thể</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm font-medium text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              >
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14211B] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Thôn / Buôn cơ sở (Nếu có)</span>
              </label>
              <select
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm font-medium text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              >
                <option value="">Toàn xã Ea Súp (Tin chung cấp xã)</option>
                {EA_SUP_VILLAGES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.type === 'BUON' ? 'Buôn' : 'Thôn'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Tóm tắt bản tin */}
          <div>
            <label className="block text-xs font-bold text-[#14211B] mb-1.5">
              Tóm tắt súc tích (1-2 câu hiển thị ở trang chủ)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tóm tắt ngắn gọn sự kiện, kết quả hoặc ý nghĩa của hoạt động..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          {/* 4. Nội dung chi tiết */}
          <div>
            <label className="block text-xs font-bold text-[#14211B] mb-1.5 uppercase tracking-wide">
              Nội dung chi tiết bản tin <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung bài viết. Bạn có thể xuống 2 dòng để tự động tạo một đoạn văn mới..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332] leading-relaxed"
            />
          </div>

          {/* 5. KHU VỰC TẢI ẢNH (TỐI ĐA 7 TẤM ẢNH, MỖI TẤM < 5MB) */}
          <div className="p-4 rounded-xl bg-white border border-[#D5CBBA] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C85A32]" />
                <span className="text-xs font-bold text-[#14211B] uppercase tracking-wide">
                  Album ảnh bản tin ({images.length}/{MAX_ARTICLE_IMAGES} tấm ảnh)
                </span>
              </div>
              <span className="text-[11px] text-[#6B7C73]">
                Tối đa 7 ảnh &bull; Mỗi ảnh &lt; 5MB
              </span>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Khung nút bấm tải ảnh */}
            {images.length < MAX_ARTICLE_IMAGES && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#D4AF37] hover:border-[#1B4332] bg-[#FAF7F2] hover:bg-emerald-50/50 rounded-xl transition flex flex-col items-center justify-center gap-1.5 text-xs text-[#1B4332] font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#1B4332]" />
                      <span>Đang tải ảnh lên máy chủ...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-[#C85A32]" />
                      <span>Nhấn để chọn ảnh từ máy tính (Có thể chọn nhiều ảnh cùng lúc)</span>
                      <span className="text-[10px] text-[#6B7C73]">
                        Hỗ trợ định dạng JPG, PNG, WebP &bull; Dung lượng tối đa 5MB/ảnh
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Danh sách ảnh đã chọn */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((url, idx) => {
                  const isCover = idx === coverIndex;
                  return (
                    <div
                      key={url + idx}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 bg-gray-100 group shadow-xs ${
                        isCover ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' : 'border-[#D5CBBA]'
                      }`}
                    >
                      <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Huy hiệu ảnh bìa */}
                      {isCover && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#D4AF37] text-white text-[10px] font-bold flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Ảnh bìa</span>
                        </span>
                      )}

                      {/* Số thứ tự ảnh */}
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                        {idx + 1}/{images.length}
                      </span>

                      {/* Các nút thao tác hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetAsCover(idx)}
                            className="p-1.5 rounded-lg bg-[#D4AF37] text-white hover:bg-yellow-600 transition"
                            title="Đặt làm ảnh bìa bài viết"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                          title="Xóa tấm ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Trạng thái xuất bản */}
          <div className="flex items-center gap-4 pt-1">
            <label className="text-xs font-bold text-[#14211B]">Trạng thái đăng:</label>
            <label className="flex items-center gap-1.5 text-xs text-[#14211B] cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PUBLISHED"
                checked={status === 'PUBLISHED'}
                onChange={() => setStatus('PUBLISHED')}
                className="text-[#1B4332] focus:ring-[#1B4332]"
              />
              <span className="font-semibold text-[#1B4332]">Xuất bản ngay</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[#14211B] cursor-pointer">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                checked={status === 'DRAFT'}
                onChange={() => setStatus('DRAFT')}
                className="text-[#1B4332] focus:ring-[#1B4332]"
              />
              <span className="text-[#6B7C73]">Lưu bản nháp</span>
            </label>
          </div>

          {/* MODAL FOOTER */}
          <div className="pt-4 border-t border-[#D5CBBA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#D5CBBA] text-xs sm:text-sm font-bold text-[#4A5B52] hover:bg-gray-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isEditMode ? 'Lưu thay đổi' : 'Đăng bản tin'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

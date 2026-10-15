'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  MapPin,
  Eye,
  Edit3,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignJustify,
  AlignLeft,
  AlignCenter,
  Wand2,
  ArrowUp,
  ArrowDown,
  Camera,
  Feather,
  Save,
  RotateCcw,
} from 'lucide-react';
import { EA_SUP_VILLAGES } from '@/constants/easup-data';
import {
  MAX_ARTICLE_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  ArticleMediaItem,
  ImagePlacement,
  extractGalleryMedia,
  stripGalleryFromHtml,
} from '@/lib/news-gallery';
import { EditorialArticleView } from './EditorialArticleView';

interface NewsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (article: any) => void;
  articleToEdit?: any | null;
  categories?: Array<{ id: string; name: string; orgCode: string; slug: string }>;
}

const DEFAULT_CATEGORIES = [
  { id: 'cat-mttq', name: 'Ủy ban MTTQ xã', orgCode: 'MTTQ', slug: 'mat-tran-to-quoc' },
  { id: 'cat-phunu', name: 'Hội LH Phụ nữ', orgCode: 'PHU_NU', slug: 'hoi-phu-nu' },
  { id: 'cat-nongdan', name: 'Hội Nông dân', orgCode: 'NONG_DAN', slug: 'hoi-nong-dan' },
  { id: 'cat-doantn', name: 'Đoàn Thanh niên', orgCode: 'DOAN_TN', slug: 'doan-thanh-nien' },
  { id: 'cat-ccb', name: 'Hội Cựu chiến binh', orgCode: 'CCB', slug: 'hoi-cuu-chien-binh' },
  { id: 'cat-thonbuon', name: '20 Thôn Buôn', orgCode: 'THON_BUON', slug: 'hoat-dong-thon-buon' },
  { id: 'cat-cds', name: 'Chuyển đổi số & BDHVS', orgCode: 'MTTQ', slug: 'chuyen-doi-so' },
  { id: 'cat-vinguoingheo', name: 'Vì người nghèo', orgCode: 'MTTQ', slug: 'vi-nguoi-ngheo' },
];

function getSuggestedAuthor(orgCode: string, catName?: string): string {
  switch (orgCode) {
    case 'MTTQ':
      return 'Tin, ảnh: Ủy ban MTTQ Việt Nam xã Ea Súp';
    case 'PHU_NU':
      return 'Tin, ảnh: Hội LH Phụ nữ xã Ea Súp';
    case 'NONG_DAN':
      return 'Tin, ảnh: Hội Nông dân xã Ea Súp';
    case 'DOAN_TN':
      return 'Tin, ảnh: Đoàn TNCS Hồ Chí Minh xã Ea Súp';
    case 'CCB':
      return 'Tin, ảnh: Hội Cựu chiến binh xã Ea Súp';
    case 'THON_BUON':
      return 'Tin, ảnh: Ban Công tác Mặt trận cơ sở';
    default:
      return catName ? `Tin, ảnh: ${catName}` : 'Tin, ảnh: Ủy ban MTTQ Việt Nam xã Ea Súp';
  }
}

export function NewsEditorModal({
  isOpen,
  onClose,
  onSuccess,
  articleToEdit,
  categories = DEFAULT_CATEGORIES,
}: NewsEditorModalProps) {
  const isEditMode = Boolean(articleToEdit?.id);

  // Chế độ hiển thị: 'editor' (Soạn thảo) hoặc 'preview' (Xem trước tòa soạn)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const [categoriesList, setCategoriesList] = useState(categories);
  const [villagesList, setVillagesList] = useState(EA_SUP_VILLAGES as readonly any[]);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [villageId, setVillageId] = useState('');
  const [orgCode, setOrgCode] = useState('MTTQ');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  // Quản lý Album Media Items (Tối đa 7 ảnh kèm caption & placement)
  const [mediaItems, setMediaItems] = useState<ArticleMediaItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Nạp danh mục và thôn buôn thực tế từ CSDL
  useEffect(() => {
    async function loadRealData() {
      try {
        const [catRes, vilRes] = await Promise.all([
          fetch('/api/public/categories'),
          fetch('/api/public/villages'),
        ]);
        const catJson = await catRes.json();
        const vilJson = await vilRes.json();

        if (catJson.success && Array.isArray(catJson.data) && catJson.data.length > 0) {
          setCategoriesList(catJson.data);
          if (!articleToEdit && !categoryId) {
            setCategoryId(catJson.data[0].id);
            setOrgCode(catJson.data[0].orgCode);
            setAuthorName(getSuggestedAuthor(catJson.data[0].orgCode, catJson.data[0].name));
          }
        }
        if (vilJson.success && Array.isArray(vilJson.data) && vilJson.data.length > 0) {
          setVillagesList(vilJson.data);
        }
      } catch {}
    }
    loadRealData();
  }, [articleToEdit, categoryId]);

  // Khởi tạo dữ liệu khi mở Modal
  useEffect(() => {
    if (!isOpen) return;

    if (articleToEdit) {
      setTitle(articleToEdit.title || '');
      setSummary(articleToEdit.summary || '');

      // Tách văn bản thuần từ contentHtml
      let rawContent = stripGalleryFromHtml(articleToEdit.contentHtml || '');
      rawContent = rawContent
        .replace(/<\/p><p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '')
        .trim();
      setContent(rawContent);

      setCategoryId(articleToEdit.categoryId || categories[0]?.id || '');
      setVillageId(articleToEdit.villageId || '');
      setOrgCode(articleToEdit.orgCode || 'MTTQ');
      setAuthorName(articleToEdit.author?.name || getSuggestedAuthor(articleToEdit.orgCode || 'MTTQ'));
      setStatus(articleToEdit.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');

      // Khôi phục Media Items
      if (articleToEdit.mediaItems && Array.isArray(articleToEdit.mediaItems) && articleToEdit.mediaItems.length > 0) {
        setMediaItems(articleToEdit.mediaItems.slice(0, MAX_ARTICLE_IMAGES));
      } else {
        const extracted = extractGalleryMedia(articleToEdit.contentHtml || '', articleToEdit.thumbnailUrl);
        setMediaItems(extracted.slice(0, MAX_ARTICLE_IMAGES));
      }
      setHasDraftNotice(false);
    } else {
      // Kiểm tra bản nháp tự động trong localStorage khi tạo mới
      const draftJson = typeof window !== 'undefined' ? localStorage.getItem('easupso_news_editor_draft') : null;
      if (draftJson) {
        try {
          const draft = JSON.parse(draftJson);
          if (draft && draft.title) {
            setTitle(draft.title || '');
            setSummary(draft.summary || '');
            setContent(draft.content || '');
            setCategoryId(draft.categoryId || categories[0]?.id || '');
            setVillageId(draft.villageId || '');
            setOrgCode(draft.orgCode || 'MTTQ');
            setAuthorName(draft.authorName || getSuggestedAuthor(draft.orgCode || 'MTTQ'));
            if (Array.isArray(draft.mediaItems)) {
              setMediaItems(draft.mediaItems.slice(0, MAX_ARTICLE_IMAGES));
            }
            setHasDraftNotice(true);
            return;
          }
        } catch {}
      }

      // Mặc định tạo mới hoàn toàn
      setTitle('');
      setSummary('');
      setContent('');
      setCategoryId(categories[0]?.id || '');
      setVillageId('');
      setOrgCode('MTTQ');
      setAuthorName(getSuggestedAuthor('MTTQ'));
      setStatus('PUBLISHED');
      setMediaItems([]);
      setHasDraftNotice(false);
    }

    setUploadError(null);
    setSubmitError(null);
    setActiveTab('editor');
  }, [articleToEdit, isOpen, categories]);

  // Tự động lưu bản nháp vào localStorage khi tạo mới
  useEffect(() => {
    if (isEditMode || !isOpen) return;
    if (!title && !content && mediaItems.length === 0) return;

    const timer = setTimeout(() => {
      try {
        const draft = {
          title,
          summary,
          content,
          categoryId,
          villageId,
          orgCode,
          authorName,
          mediaItems,
          savedAt: Date.now(),
        };
        localStorage.setItem('easupso_news_editor_draft', JSON.stringify(draft));
      } catch {}
    }, 800);

    return () => clearTimeout(timer);
  }, [title, summary, content, categoryId, villageId, orgCode, authorName, mediaItems, isEditMode, isOpen]);

  // Xóa bản nháp
  function handleClearDraft() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('easupso_news_editor_draft');
    }
    setTitle('');
    setSummary('');
    setContent('');
    setAuthorName(getSuggestedAuthor(orgCode));
    setMediaItems([]);
    setHasDraftNotice(false);
  }

  // Cập nhật orgCode & gợi ý tác giả khi đổi chuyên mục
  function handleCategoryChange(selectedCatId: string) {
    setCategoryId(selectedCatId);
    const found = categoriesList.find((c) => c.id === selectedCatId);
    if (found?.orgCode) {
      setOrgCode(found.orgCode);
      if (!authorName || authorName.startsWith('Tin, ảnh:')) {
        setAuthorName(getSuggestedAuthor(found.orgCode, found.name));
      }
    }
  }

  // THANH CÔNG CỤ ĐỊNH DẠNG VĂN BẢN (Editorial Toolbar)
  function applyFormatting(prefix: string, suffix = '', placeholder = '') {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || placeholder;

    const replacement = `${prefix}${selected}${suffix}`;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(nextContent);

    // Đưa con trỏ chuột về vị trí hợp lý
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  }

  // Dọn dẹp khoảng trắng thừa và định dạng đoạn văn từ Word/Zalo
  function handleCleanAndNormalizeText() {
    if (!content) return;
    let cleaned = content;
    // Bỏ ký tự điều khiển độc hại
    cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    // Chuẩn hóa dòng trắng thừa (tối đa 2 dấu xuống dòng)
    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
    setContent(cleaned.trim());
  }

  // XỬ LÝ TẢI ẢNH (Tối đa 7 ảnh, mỗi ảnh < 5MB)
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploadError(null);

    const remainingSlots = MAX_ARTICLE_IMAGES - mediaItems.length;
    if (remainingSlots <= 0) {
      setUploadError(`Bản tin đã đạt giới hạn tối đa ${MAX_ARTICLE_IMAGES} tấm ảnh.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setUploadError(
        `Đồng chí chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (Tổng tối đa ${MAX_ARTICLE_IMAGES} ảnh mỗi bản tin).`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    for (const f of selectedFiles) {
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
        setUploadError(`Ảnh "${f.name}" có dung lượng ${sizeMb} MB, vượt quá giới hạn tối đa 5MB!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

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
        const newItems: ArticleMediaItem[] = json.urls.map((url: string, idx: number) => {
          const detail = json.files?.[idx];
          return {
            url,
            caption: '',
            placement: 'auto' as ImagePlacement,
            isCover: mediaItems.length === 0 && idx === 0,
            size: detail?.size || 0,
          };
        });

        const merged = [...mediaItems, ...newItems].slice(0, MAX_ARTICLE_IMAGES);
        setMediaItems(merged);
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

  // Cập nhật Caption ảnh
  function handleCaptionChange(idx: number, caption: string) {
    setMediaItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], caption };
      return copy;
    });
  }

  // Cập nhật Vị trí hiển thị ảnh trong bài báo (Placement)
  function handlePlacementChange(idx: number, placement: ImagePlacement) {
    setMediaItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], placement };
      return copy;
    });
  }

  // Chọn làm ảnh bìa
  function handleSetAsCover(idx: number) {
    setMediaItems((prev) => {
      return prev.map((item, i) => ({
        ...item,
        isCover: i === idx,
      }));
    });
  }

  // Đổi thứ tự ảnh (Lên / Xuống)
  function handleMoveMedia(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= mediaItems.length) return;

    setMediaItems((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  }

  // Xóa ảnh
  function handleRemoveMedia(idxToRemove: number) {
    setMediaItems((prev) => {
      const filtered = prev.filter((_, i) => i !== idxToRemove);
      if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  }

  // GỬI DỮ LIỆU ĐĂNG BÀI
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Vui lòng nhập tiêu đề bản tin.');
      setActiveTab('editor');
      return;
    }
    if (!content.trim()) {
      setSubmitError('Vui lòng nhập nội dung chi tiết bài viết.');
      setActiveTab('editor');
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

      const coverItem = mediaItems.find((m) => m.isCover);
      const coverImageUrl = coverItem?.url || (mediaItems.length > 0 ? mediaItems[0].url : null);
      const simpleImageList = mediaItems.map((m) => m.url);

      const payload = {
        title: title.trim(),
        summary: summary.trim() || title.trim().slice(0, 160),
        contentHtml: paragraphs,
        categoryId,
        villageId: villageId || null,
        orgCode,
        authorName: authorName.trim() || getSuggestedAuthor(orgCode),
        thumbnailUrl: coverImageUrl,
        images: simpleImageList,
        mediaItems,
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
        // Xóa bản nháp lưu tạm khi đã lưu thành công
        if (typeof window !== 'undefined') {
          localStorage.removeItem('easupso_news_editor_draft');
        }
        onSuccess(json.data);
        onClose();
      } else {
        const errorMsg = json.error || 'Thao tác lưu bài viết thất bại.';
        setSubmitError(errorMsg);
        alert(`Không thể lưu bản tin: ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi mạng khi lưu bài viết.';
      setSubmitError(errorMsg);
      alert(`Lỗi hệ thống: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Tên chuyên mục và thôn buôn được chọn
  const selectedCatObj = categoriesList.find((c) => c.id === categoryId);
  const selectedVilObj = villagesList.find((v) => (v.code || v.id) === villageId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F2] w-full max-w-4xl lg:max-w-5xl rounded-2xl border-2 border-[#D5CBBA] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-[#1B4332] text-white flex items-center justify-between border-b-2 border-[#D4AF37] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm">
              {isEditMode ? '✏️' : '📰'}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                {isEditMode ? 'Biên tập & Nâng cấp bản tin' : 'Tòa soạn điện tử — Đăng bản tin mới'}
              </h3>
              <p className="text-[11px] text-[#A3B899]">
                Chuẩn báo chí chính luận &bull; Tối đa 7 ảnh kèm chú thích &amp; dàn trang thông minh
              </p>
            </div>
          </div>

          {/* CỤM NÚT TAB: SOẠN THẢO vs XEM TRƯỚC TRANG BÁO */}
          <div className="flex items-center gap-2">
            <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'editor'
                    ? 'bg-[#D4AF37] text-[#14211B] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Soạn thảo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'preview'
                    ? 'bg-[#D4AF37] text-[#14211B] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước trang báo</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THÔNG BÁO KHÔI PHỤC BẢN NHÁP (NẾU CÓ) */}
        {hasDraftNotice && !isEditMode && activeTab === 'editor' && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hệ thống đã tự động khôi phục nội dung bản nháp đồng chí đang soạn thảo trước đó.</span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bản nháp, viết mới</span>
            </button>
          </div>
        )}

        {/* NỘI DUNG CHÍNH: SOẠN THẢO HOẶC XEM TRƯỚC */}
        {activeTab === 'preview' ? (
          /* TAB 2: LIVE PREVIEW TRANG BÁO CHÍ */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2]">
            <div className="max-w-4xl mx-auto mb-4">
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Đây là giao diện thực tế mà người dân và cán bộ sẽ nhìn thấy khi đọc bài báo. Đồng chí có thể bấm tab &ldquo;Soạn thảo&rdquo; để điều chỉnh lại vị trí ảnh hoặc nội dung.
                </span>
              </div>

              <EditorialArticleView
                title={title || 'Tiêu đề bản tin mẫu...'}
                summary={summary || 'Đoạn dẫn mở đầu bài báo (Sapo)...'}
                contentHtml={
                  content
                    ? content
                        .split('\n\n')
                        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
                        .join('')
                    : '<p>Nội dung chi tiết bài viết sẽ được dàn trang tại đây...</p>'
                }
                mediaItems={mediaItems}
                categoryName={selectedCatObj?.name || 'Ủy ban MTTQ xã'}
                villageName={selectedVilObj?.name || null}
                authorName={authorName || getSuggestedAuthor(orgCode)}
                publishedAt={new Date()}
                viewCount={1}
                beneficiaryName={null}
              />
            </div>
          </div>
        ) : (
          /* TAB 1: FORM SOẠN THẢO BÀI VIẾT */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* 1. Tiêu đề bản tin (Hỗ trợ tới 300 ký tự) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#14211B] uppercase tracking-wide">
                  Tiêu đề bản tin <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-[#6B7C73]">
                  {title.length}/300 ký tự
                </span>
              </div>
              <textarea
                rows={2}
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết (Vd: Hội Cựu chiến binh xã Ea Súp trao tặng nhà Nghĩa tình đồng đội tại Thôn Đoàn Kết...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBBA] bg-white text-sm font-bold text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332] leading-snug"
              />
            </div>

            {/* 2. Chuyên mục, Thôn buôn & Tác giả */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#14211B] mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>Chuyên mục / Đoàn thể</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm font-medium text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
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
                  <span>Thôn / Buôn cơ sở</span>
                </label>
                <select
                  value={villageId}
                  onChange={(e) => setVillageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm font-medium text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                >
                  <option value="">Toàn xã Ea Súp (Tin chung cấp xã)</option>
                  {villagesList.map((v) => (
                    <option key={v.code || v.id} value={v.code || v.id}>
                      {v.name} ({v.type === 'BUON' ? 'Buôn' : 'Thôn'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14211B] mb-1.5 flex items-center gap-1.5">
                  <Feather className="w-3.5 h-3.5 text-[#1B4332]" />
                  <span>Tác giả / Nguồn bản tin</span>
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="VD: Tin, ảnh: Ủy ban MTTQ xã"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>

            {/* 3. Tóm tắt súc tích (Sapo bài báo) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#14211B] flex items-center gap-1.5">
                  <span>Đoạn dẫn (Sapo) mở đầu bài báo</span>
                  <span className="text-[11px] font-normal text-[#6B7C73]">(In đậm trang trọng ở đầu trang đọc và hiển thị ngoài trang chủ)</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tóm tắt ngắn gọn sự kiện, kết quả hoặc ý nghĩa của hoạt động..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            {/* 4. Nội dung chi tiết & THANH ĐỊNH DẠNG CHỮ CHUYÊN NGHIỆP */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#14211B] uppercase tracking-wide">
                  Nội dung chi tiết bản tin <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleCleanAndNormalizeText}
                  className="text-[11px] text-[#1B4332] hover:text-[#C85A32] font-semibold flex items-center gap-1 transition"
                  title="Tự động xóa khoảng trắng thừa và làm sạch định dạng copy từ Word/Zalo"
                >
                  <Wand2 className="w-3 h-3 text-[#D4AF37]" />
                  <span>Làm sạch văn bản Word/Zalo</span>
                </button>
              </div>

              {/* THANH CÔNG CỤ EDITORIAL TOOLBAR */}
              <div className="p-1.5 bg-[#F4F1EA] border border-[#D5CBBA] border-b-0 rounded-t-xl flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyFormatting('**', '**', 'chữ in đậm')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition font-bold"
                  title="In đậm (Bold)"
                >
                  <Bold className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => applyFormatting('*', '*', 'chữ in nghiêng')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition"
                  title="In nghiêng (Italic)"
                >
                  <Italic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => applyFormatting('<u>', '</u>', 'chữ gạch chân')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition"
                  title="Gạch chân (Underline)"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>

                <span className="w-px h-4 bg-[#D5CBBA] mx-1" />

                <button
                  type="button"
                  onClick={() => applyFormatting('\n\n## ', '\n\n', 'Tiêu đề phụ lớn')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition flex items-center gap-1 text-xs font-bold"
                  title="Tiêu đề phụ lớn (Heading H2)"
                >
                  <Heading2 className="w-4 h-4" />
                  <span>H2</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyFormatting('\n\n### ', '\n\n', 'Tiêu đề phụ nhỏ')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition flex items-center gap-1 text-xs font-bold"
                  title="Tiêu đề phụ nhỏ (Heading H3)"
                >
                  <Heading3 className="w-4 h-4" />
                  <span>H3</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyFormatting('\n\n> "', '"\n\n', 'Lời phát biểu chỉ đạo của Lãnh đạo hoặc ý kiến cử tri...')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition"
                  title="Khung trích dẫn nổi bật (Blockquote)"
                >
                  <Quote className="w-4 h-4" />
                </button>

                <span className="w-px h-4 bg-[#D5CBBA] mx-1" />

                <button
                  type="button"
                  onClick={() => applyFormatting('\n- ', '\n- ', 'Ý thứ nhất')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition"
                  title="Danh sách gạch đầu dòng"
                >
                  <List className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => applyFormatting('\n1. ', '\n2. ', 'Bước thứ nhất')}
                  className="p-1.5 rounded-lg hover:bg-white text-[#14211B] transition"
                  title="Danh sách đánh số"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                <span className="w-px h-4 bg-[#D5CBBA] mx-1" />

                <div className="flex items-center gap-1 text-xs text-[#6B7C73] ml-auto">
                  <span className="hidden sm:inline">Mẹo: Xuống 2 dòng để tạo đoạn văn mới</span>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung bài viết. Bạn có thể bôi đen văn bản và dùng thanh công cụ phía trên để in đậm, tạo tiêu đề mục hoặc trích dẫn..."
                className="w-full px-3.5 py-2.5 rounded-b-xl border border-[#D5CBBA] bg-white text-xs sm:text-sm text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332] leading-relaxed font-sans"
              />
            </div>

            {/* 5. QUẢN LÝ ALBUM ẢNH BẢN TIN, CHÚ THÍCH & VỊ TRÍ SẮP XẾP */}
            <div className="p-4 rounded-xl bg-white border border-[#D5CBBA] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#C85A32]" />
                  <span className="text-xs font-bold text-[#14211B] uppercase tracking-wide">
                    Album ảnh &amp; Thẻ biên tập ảnh ({mediaItems.length}/{MAX_ARTICLE_IMAGES} tấm)
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7C73]">
                  Tối đa 7 ảnh &bull; Mỗi ảnh &lt; 5MB &bull; Có ô ghi chú thích &amp; chọn vị trí dàn trang
                </span>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Khung nút bấm tải ảnh */}
              {mediaItems.length < MAX_ARTICLE_IMAGES && (
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
                        <span className="text-[10px] text-[#6B7C73] font-normal">
                          Hỗ trợ JPG, PNG, WebP &bull; Dung lượng tối đa 5MB/ảnh
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* DANH SÁCH THẺ BIÊN TẬP ẢNH (PHOTO EDITORIAL CARDS) */}
              {mediaItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  {mediaItems.map((item, idx) => (
                    <div
                      key={item.url + idx}
                      className="p-3 sm:p-4 rounded-xl border border-[#D5CBBA] bg-[#FAF7F2] flex flex-col sm:flex-row gap-3 sm:gap-4 items-start relative group"
                    >
                      {/* Cột 1: Thumbnail ảnh & Badge Bìa */}
                      <div className="relative w-28 sm:w-36 aspect-[4/3] rounded-lg overflow-hidden border border-[#D5CBBA] bg-stone-200 shrink-0">
                        <img
                          src={item.url}
                          alt={`Ảnh ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {item.isCover && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#1B4332] text-[#D4AF37] text-[10px] font-bold">
                            ★ Ảnh bìa
                          </span>
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Cột 2: Ô chú thích & Chọn vị trí dàn trang */}
                      <div className="flex-1 w-full space-y-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[#14211B] mb-1">
                            Ghi chú / Chú thích ảnh (Photo Caption)
                          </label>
                          <input
                            type="text"
                            value={item.caption || ''}
                            onChange={(e) => handleCaptionChange(idx, e.target.value)}
                            placeholder="Nhập chú thích ảnh (VD: Quang cảnh hội nghị tập huấn chuyển đổi số tại xã Ea Súp...)"
                            className="w-full px-3 py-1.5 rounded-lg border border-[#D5CBBA] bg-white text-xs text-[#14211B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#6B7C73] mb-0.5">
                              Vị trí hiển thị trong bài báo
                            </label>
                            <select
                              value={item.placement || 'auto'}
                              onChange={(e) => handlePlacementChange(idx, e.target.value as ImagePlacement)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5CBBA] bg-white text-xs text-[#14211B] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                            >
                              <option value="auto">Tự động sắp xếp thông minh (Mặc định)</option>
                              <option value="lead">Đầu bài viết (Ngay dưới đoạn Sapo)</option>
                              <option value="after-p1">Xen kẽ sau Đoạn văn số 1</option>
                              <option value="after-p2">Xen kẽ sau Đoạn văn số 2</option>
                              <option value="after-p3">Xen kẽ sau Đoạn văn số 3</option>
                              <option value="after-p4">Xen kẽ sau Đoạn văn số 4</option>
                              <option value="pair">Ghép đôi 2 ảnh song song (2-Column Grid)</option>
                              <option value="bottom">Cuối bài viết (Phóng sự ảnh)</option>
                            </select>
                          </div>

                          <div className="flex items-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetAsCover(idx)}
                              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                                item.isCover
                                  ? 'bg-[#1B4332] text-[#D4AF37] border-[#1B4332]'
                                  : 'bg-white text-[#4A5B52] border-[#D5CBBA] hover:bg-stone-50'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${item.isCover ? 'fill-[#D4AF37]' : ''}`} />
                              <span>{item.isCover ? 'Đang làm ảnh bìa' : 'Chọn làm ảnh bìa'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cột 3: Nút điều hướng thứ tự & xóa */}
                      <div className="flex sm:flex-col items-center gap-1 shrink-0 self-center sm:self-start">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMedia(idx, 'up')}
                          className="p-1.5 rounded-lg bg-white border border-[#D5CBBA] hover:bg-stone-100 text-[#14211B] disabled:opacity-30 transition"
                          title="Di chuyển ảnh lên trên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mediaItems.length - 1}
                          onClick={() => handleMoveMedia(idx, 'down')}
                          className="p-1.5 rounded-lg bg-white border border-[#D5CBBA] hover:bg-stone-100 text-[#14211B] disabled:opacity-30 transition"
                          title="Di chuyển ảnh xuống dưới"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Trạng thái xuất bản */}
            <div className="flex items-center gap-5 pt-2">
              <span className="text-xs font-bold text-[#14211B]">Trạng thái:</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#14211B] cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                  className="accent-[#1B4332]"
                />
                <span>Xuất bản ngay</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#14211B] cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                  className="accent-[#1B4332]"
                />
                <span>Lưu bản nháp</span>
              </label>
            </div>
          </form>
        )}

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-white border-t border-[#D5CBBA] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#6B7C73]">
            {isUploading ? (
              <span className="text-[#1B4332] font-semibold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tải ảnh lên máy chủ...
              </span>
            ) : (
              <span>Đã chọn {mediaItems.length}/7 ảnh &bull; Nháp tự lưu cục bộ</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D5CBBA] text-xs font-semibold text-[#4A5B52] hover:bg-stone-50 transition"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={isSubmitting || isUploading}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Đang lưu bản tin...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isEditMode ? 'Cập nhật bản tin' : 'Xuất bản tin tức'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

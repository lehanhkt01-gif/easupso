'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ArticleGalleryProps {
  images: string[];
  title?: string;
}

export function ArticleGallery({ images, title }: ArticleGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const validImages = (images || []).filter((img) => typeof img === 'string' && img.trim().length > 0);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === null || prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === null || prev === validImages.length - 1 ? 0 : prev + 1));
  }, [validImages.length]);

  // Điều khiển phím Escape và Mũi tên trái / phải
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleClose, handlePrev, handleNext]);

  if (validImages.length === 0) return null;

  return (
    <div className="my-8 pt-6 border-t-2 border-[#D5CBBA]">
      {/* Tiêu đề Album */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#C85A32]" />
          <span>Hình ảnh phóng sự hoạt động ({validImages.length} tấm ảnh)</span>
        </h3>
        <span className="text-xs text-[#6B7C73]">Bản quyền ảnh: Xã Ea Súp</span>
      </div>

      {/* Lưới hình ảnh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {validImages.map((url, idx) => (
          <div
            key={url + idx}
            onClick={() => setLightboxIndex(idx)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-[#D5CBBA] bg-stone-100 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            role="button"
            tabIndex={0}
            aria-label={`Xem ảnh ${idx + 1}`}
          >
            <img
              src={url}
              alt={title ? `${title} - Ảnh ${idx + 1}` : `Ảnh hoạt động ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Lớp phủ khi hover */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="p-2 rounded-full bg-white/80 text-[#1B4332] shadow-sm">
                <ZoomIn className="w-5 h-5" />
              </span>
            </div>

            {/* Số thứ tự ảnh */}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
              Ảnh {idx + 1}/{validImages.length}
            </span>
          </div>
        ))}
      </div>

      {/* Lightbox xem ảnh toàn màn hình */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={handleClose}
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
            aria-label="Đóng xem ảnh"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Nút chuyển lùi */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Vùng hiển thị ảnh */}
          <div
            className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validImages[lightboxIndex]}
              alt={`Ảnh phóng sự ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 text-center text-white/90 text-sm font-medium">
              Ảnh {lightboxIndex + 1} trên {validImages.length}
              {title && <span className="block text-xs text-white/60 mt-0.5">{title}</span>}
            </div>
          </div>

          {/* Nút chuyển tiếp */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

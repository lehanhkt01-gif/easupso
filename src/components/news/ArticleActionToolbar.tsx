'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2 } from 'lucide-react';
import { NewsEditorModal } from '@/components/news/NewsEditorModal';

interface ArticleActionToolbarProps {
  article: any;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function ArticleActionToolbar({ article, user }: ArticleActionToolbarProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(article);

  async function handleDelete() {
    const ok = window.confirm(
      `Đồng chí có chắc chắn muốn XÓA VĨNH VIỄN bản tin:\n"${currentArticle.title}"?\n\nHành động này không thể hoàn tác.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/news/${currentArticle.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert('Đã xóa bản tin thành công!');
        window.location.href = '/#tin-tuc';
      } else {
        alert(json.error || 'Xóa bài thất bại.');
      }
    } catch {
      alert('Lỗi mạng khi xóa bài viết.');
    }
  }

  function handleUpdateSuccess(updatedArticle: any) {
    setCurrentArticle(updatedArticle);
    // Tải lại trang để áp dụng nội dung mới
    window.location.reload();
  }

  return (
    <>
      <div className="mb-4 sm:mb-6 flex items-center justify-end gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-yellow-600 text-[#14211B] text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          title="Chỉnh sửa nội dung bản tin"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Chỉnh sửa bản tin</span>
        </button>

        <button
          onClick={handleDelete}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          title="Xóa vĩnh viễn bản tin này"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa bài</span>
        </button>
      </div>

      <NewsEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        articleToEdit={currentArticle}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
}

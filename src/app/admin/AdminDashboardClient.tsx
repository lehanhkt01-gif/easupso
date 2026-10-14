'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  FileText,
  PlusCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Send,
  Eye,
  Trash2,
  CheckCheck,
  Megaphone,
  History,
  Lock,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Users,
  UserPlus,
  KeyRound,
  UserCheck,
  UserX,
  X,
  Edit2,
  Shield,
  Upload,
} from 'lucide-react';
import { Role, OrgCode, ArticleStatus } from '@prisma/client';
import { NewsEditorModal } from '@/components/news/NewsEditorModal';

interface AdminDashboardClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: Role;
    orgCode?: OrgCode | null;
    villageId?: string | null;
    positionTitle?: string | null;
  };
  categories: Array<{ id: string; name: string; orgCode: OrgCode; slug: string }>;
  villages: readonly any[];
  initialArticles: any[];
  pendingArticles: any[];
  auditLogs: any[];
  quickAnnouncements: any[];
  currentHeroImage?: string | null;
  initialUsers?: any[];
}

export function AdminDashboardClient({
  user,
  categories,
  villages,
  initialArticles,
  pendingArticles,
  auditLogs,
  quickAnnouncements,
  currentHeroImage,
  initialUsers = [],
}: AdminDashboardClientProps) {
  const isExecutiveOrSuper = user.role === Role.EXECUTIVE || user.role === Role.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'news' | 'approvals' | 'announcements' | 'audit' | 'settings' | 'users'>('news');
  const [articlesList, setArticlesList] = useState(initialArticles);
  const [pendingList, setPendingList] = useState(pendingArticles);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [articleBeingEdited, setArticleBeingEdited] = useState<any | null>(null);

  // Quản lý Tài khoản Cán bộ & Phân quyền
  const [usersList, setUsersList] = useState<any[]>(initialUsers);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<any | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userFeedbackMsg, setUserFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Thêm tài khoản mới
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>(Role.SPECIALIST);
  const [newUserOrgCode, setNewUserOrgCode] = useState<OrgCode>(OrgCode.MTTQ);
  const [newUserVillageId, setNewUserVillageId] = useState('');
  const [newUserPosition, setNewUserPosition] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Form Đổi mật khẩu
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Quản lý ảnh bìa Website (Hero Banner)
  const defaultScenicCover =
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85';
  const [heroImageUrl, setHeroImageUrl] = useState<string>(currentHeroImage || defaultScenicCover);
  const [previewHeroUrl, setPreviewHeroUrl] = useState<string>(currentHeroImage || defaultScenicCover);
  const [isSavingHero, setIsSavingHero] = useState<boolean>(false);
  const [heroMessage, setHeroMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Danh mục ảnh danh lam thắng cảnh Ea Súp cài sẵn
  const heroPresets = [
    {
      name: 'Toàn cảnh Hồ Ea Súp Thượng (Mặc định)',
      desc: 'Công trình đại thủy nông biểu tượng cho nguồn nước tưới tiêu và sức sống trù phú của vùng biên giới Ea Súp.',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85',
    },
    {
      name: 'Tháp Chăm Yang Prong huyền bí',
      desc: 'Di tích kiến trúc - tôn giáo độc nhất vô nhị của người Chăm xây dựng tại Tây Nguyên, niềm tự hào di sản Ea Súp.',
      url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=2000&q=85',
    },
    {
      name: 'Cánh đồng lúa nước và nương rẫy Ea Súp',
      desc: 'Màu vàng ấm áp của cánh đồng lúa chín và đất đai phì nhiêu trải dài khắp 20 thôn buôn.',
      url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=85',
    },
    {
      name: 'Rừng khộp và hoàng hôn buôn làng Tây Nguyên',
      desc: 'Bản sắc rừng khộp đặc hữu giao hòa cùng ánh chiều tà bình yên bên mái nhà dài truyền thống.',
      url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2000&q=85',
    },
  ];

  async function handleSaveHeroImage(overrideUrl?: string) {
    const finalUrl = (overrideUrl !== undefined ? overrideUrl : heroImageUrl).trim();
    if (!finalUrl) {
      setHeroMessage({ text: 'Vui lòng nhập đường dẫn hình ảnh hợp lệ.', type: 'error' });
      return;
    }

    setIsSavingHero(true);
    setHeroMessage(null);

    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'HERO_BANNER_IMAGE_URL',
          value: finalUrl,
          description: 'Ảnh bìa toàn cảnh Hero Banner trang chủ easupso.com',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setHeroImageUrl(finalUrl);
        setPreviewHeroUrl(finalUrl);
        setHeroMessage({
          text: 'Đã cập nhật ảnh bìa website thành công! Trang chủ easupso.com đã tự động cập nhật diện mạo mới.',
          type: 'success',
        });
      } else {
        setHeroMessage({ text: data.error || 'Cập nhật ảnh bìa thất bại.', type: 'error' });
      }
    } catch (err: any) {
      setHeroMessage({ text: err?.message || 'Lỗi hệ thống khi cập nhật ảnh bìa.', type: 'error' });
    } finally {
      setIsSavingHero(false);
    }
  }

  // Tải ảnh trực tiếp từ máy tính lên máy chủ
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const heroFileInputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleHeroFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setHeroMessage({ text: 'Vui lòng chọn đúng file hình ảnh (JPG, PNG, WebP).', type: 'error' });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setHeroMessage({ text: 'Kích thước file ảnh không được vượt quá 15MB.', type: 'error' });
      return;
    }

    // Hiển thị ngay ảnh vừa chọn lên khung xem trước
    const localBlobUrl = URL.createObjectURL(file);
    setPreviewHeroUrl(localBlobUrl);
    setIsUploadingImage(true);
    setHeroMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setHeroImageUrl(data.url);
        setPreviewHeroUrl(data.url);
        setHeroMessage({
          text: `Đã tải ảnh lên máy chủ thành công (${(file.size / (1024 * 1024)).toFixed(2)} MB)! Vui lòng nhấn "Lưu thay đổi & Áp dụng" để công bố ra Trang chủ.`,
          type: 'success',
        });
      } else {
        setHeroMessage({ text: data.error || 'Lỗi khi tải ảnh lên máy chủ.', type: 'error' });
      }
    } catch (err: any) {
      setHeroMessage({ text: err?.message || 'Lỗi kết nối khi tải ảnh lên.', type: 'error' });
    } finally {
      setIsUploadingImage(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  }

  // --- CÁC HÀM XỬ LÝ QUẢN TRỊ TÀI KHOẢN CÁN BỘ & MẬT KHẨU ---

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      setUserFeedbackMsg({ text: 'Vui lòng nhập Email cán bộ.', type: 'error' });
      return;
    }

    setUserActionLoading(true);
    setUserFeedbackMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim() || 'Cán bộ xã',
          email: newUserEmail.trim().toLowerCase(),
          role: newUserRole,
          orgCode: newUserRole === Role.SPECIALIST || newUserRole === Role.EXECUTIVE ? newUserOrgCode : null,
          villageId: newUserRole === Role.VILLAGE_LEADER ? newUserVillageId || null : null,
          positionTitle: newUserPosition.trim() || null,
          initialPassword: newUserPassword.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserFeedbackMsg({
          text: `Đã tạo tài khoản thành công cho ${newUserEmail}!`,
          type: 'success',
        });
        // Tải lại danh sách
        const refreshed = await fetch('/api/admin/users');
        const refJson = await refreshed.json();
        if (refJson.success) {
          setUsersList(refJson.data);
        }
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserPosition('');
      } else {
        setUserFeedbackMsg({ text: data.error || 'Tạo tài khoản thất bại.', type: 'error' });
      }
    } catch (err: any) {
      setUserFeedbackMsg({ text: err?.message || 'Lỗi kết nối khi tạo tài khoản.', type: 'error' });
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setUserActionLoading(true);
    setUserFeedbackMsg(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
          orgCode: editingUser.orgCode || null,
          villageId: editingUser.villageId || null,
          positionTitle: editingUser.positionTitle || null,
          isActive: editingUser.isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserFeedbackMsg({ text: 'Cập nhật thông tin cán bộ thành công!', type: 'success' });
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.data } : u))
        );
        setEditingUser(null);
      } else {
        setUserFeedbackMsg({ text: data.error || 'Cập nhật thất bại.', type: 'error' });
      }
    } catch (err: any) {
      setUserFeedbackMsg({ text: err?.message || 'Lỗi khi cập nhật.', type: 'error' });
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordResetUser) return;
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setUserFeedbackMsg({ text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.', type: 'error' });
      return;
    }

    setUserActionLoading(true);
    setUserFeedbackMsg(null);

    try {
      const res = await fetch(`/api/admin/users/${passwordResetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserFeedbackMsg({
          text: `Đã đổi mật khẩu thành công cho tài khoản ${passwordResetUser.email}!`,
          type: 'success',
        });
        setUsersList((prev) =>
          prev.map((u) => (u.id === passwordResetUser.id ? { ...u, hasPassword: true } : u))
        );
        setPasswordResetUser(null);
        setResetNewPassword('');
      } else {
        setUserFeedbackMsg({ text: data.error || 'Đổi mật khẩu thất bại.', type: 'error' });
      }
    } catch (err: any) {
      setUserFeedbackMsg({ text: err?.message || 'Lỗi khi đổi mật khẩu.', type: 'error' });
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleToggleUserStatus(targetUser: any) {
    if (targetUser.isRootAdmin) {
      alert('Không thể khóa tài khoản Quản trị viên tối cao lehanhkt01@gmail.com!');
      return;
    }
    if (targetUser.id === user.id) {
      alert('Đồng chí không thể tự khóa tài khoản của chính mình!');
      return;
    }

    const nextStatus = !targetUser.isActive;
    const confirmMsg = nextStatus
      ? `Đồng chí có chắc chắn muốn MỞ KHÓA tài khoản ${targetUser.email}?`
      : `Đồng chí có chắc chắn muốn TẠM KHÓA tài khoản ${targetUser.email}? Cán bộ này sẽ không thể đăng nhập.`;

    if (!confirm(confirmMsg)) return;

    setUserActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: nextStatus } : u))
        );
        setUserFeedbackMsg({
          text: `Đã ${nextStatus ? 'mở khóa' : 'khóa'} tài khoản ${targetUser.email} thành công!`,
          type: 'success',
        });
      } else {
        alert(data.error || 'Thao tác thất bại.');
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi hệ thống.');
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleDeleteUser(targetUser: any) {
    if (targetUser.isRootAdmin) {
      alert('Tuyệt đối không được xóa tài khoản Quản trị viên tối cao lehanhkt01@gmail.com!');
      return;
    }
    if (targetUser.id === user.id) {
      alert('Đồng chí không thể tự xóa tài khoản của chính mình khi đang đăng nhập!');
      return;
    }

    if (!confirm(`CẢNH BÁO: Đồng chí có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${targetUser.email}? Hành động này sẽ được ghi vết kiểm toán.`)) {
      return;
    }

    setUserActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
        setUserFeedbackMsg({
          text: `Đã xóa tài khoản ${targetUser.email} khỏi hệ thống.`,
          type: 'success',
        });
      } else {
        alert(data.error || 'Xóa tài khoản thất bại.');
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi hệ thống.');
    } finally {
      setUserActionLoading(false);
    }
  }

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [villageId, setVillageId] = useState(user.villageId || '');
  const [orgCode, setOrgCode] = useState<OrgCode>(user.orgCode || OrgCode.MTTQ);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Xử lý tạo bản tin mới
  async function handleCreateArticle(statusTarget: ArticleStatus) {
    if (!title.trim() || !contentHtml.trim()) {
      setFormMessage({ text: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          contentHtml: `<p>${contentHtml.replace(/\n/g, '</p><p>')}</p>`,
          categoryId,
          villageId: villageId || null,
          orgCode,
          beneficiaryName: beneficiaryName.trim() || null,
          thumbnailUrl: thumbnailUrl.trim() || null,
          status: statusTarget,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFormMessage({ text: 'Đã gửi bản tin thành công!', type: 'success' });
        setArticlesList([json.data, ...articlesList]);
        setTitle('');
        setSummary('');
        setContentHtml('');
        setBeneficiaryName('');
        setThumbnailUrl('');
        setShowCreateForm(false);
      } else {
        setFormMessage({ text: json.error || 'Lỗi tạo bài viết.', type: 'error' });
      }
    } catch (err) {
      setFormMessage({ text: 'Lỗi mạng khi gửi bài viết.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Xử lý duyệt bài viết (Chỉ dành cho Lãnh đạo UBMTTQ xã)
  async function handleApproveArticle(id: string) {
    if (!confirm('Xác nhận phê duyệt và xuất bản công khai bản tin này lên Cổng easupso.com?')) return;

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ArticleStatus.PUBLISHED }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingList(pendingList.filter((a) => a.id !== id));
        alert('Đã phê duyệt xuất bản thành công!');
      } else {
        alert(json.error || 'Lỗi phê duyệt bài viết.');
      }
    } catch (err) {
      alert('Lỗi mạng khi duyệt bài.');
    }
  }

  // Xử lý xóa bản tin
  async function handleDeleteArticle(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa bản tin này?')) return;

    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setArticlesList(articlesList.filter((a) => a.id !== id));
      } else {
        alert(json.error || 'Không thể xóa bài viết.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa bài.');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#14211B] flex flex-col">
      {/* 1. THANH ĐIỀU HÀNH CÁN BỘ TRÊN CÙNG */}
      <header className="bg-[#1B4332] text-white border-b-2 border-[#D4AF37] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-xs font-bold"
              title="Về trang chủ Cổng thông tin"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang chủ</span>
            </Link>

            <div className="h-6 w-px bg-white/20 hidden sm:block" />

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] block">
                Phân hệ Quản trị CMS Nội bộ
              </span>
              <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                HỆ ĐIỀU HÀNH BẢN TIN MẶT TRẬN &amp; 20 THÔN BUÔN
              </h1>
            </div>
          </div>

          {/* Thông tin Cán bộ đang đăng nhập */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-white">{user.name}</p>
              <p className="text-[10px] text-[#A3D7BB]">
                {user.positionTitle ||
                  (user.role === Role.EXECUTIVE
                    ? 'Lãnh đạo UBMTTQ xã'
                    : user.role === Role.VILLAGE_LEADER
                    ? 'Trưởng thôn/buôn'
                    : 'Cán bộ đoàn thể')}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. THANH CHUYỂN TAB CHỨC NĂNG */}
      <div className="bg-white border-b border-[#E8E2D5] shadow-sm sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'news'
                ? 'bg-[#1B4332] text-white shadow-sm'
                : 'text-[#4A5B52] hover:bg-[#FAF7F2] hover:text-[#1B4332]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bản tin của tôi &amp; Soạn bài</span>
          </button>

          {isExecutiveOrSuper && (
            <>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap min-h-[44px] ${
                  activeTab === 'approvals'
                    ? 'bg-[#C85A32] text-white shadow-sm'
                    : 'text-[#4A5B52] hover:bg-[#FAF7F2] hover:text-[#C85A32]'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>Duyệt bài cơ sở</span>
                {pendingList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white text-[#C85A32]">
                    {pendingList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap min-h-[44px] ${
                  activeTab === 'announcements'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#4A5B52] hover:bg-[#FAF7F2] hover:text-[#1B4332]'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Thông báo Ticker ({quickAnnouncements.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap min-h-[44px] ${
                  activeTab === 'audit'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#4A5B52] hover:bg-[#FAF7F2] hover:text-[#1B4332]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Nhật ký Kiểm toán (Zero-Trust)</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap min-h-[44px] ${
                  activeTab === 'settings'
                    ? 'bg-[#C85A32] text-white shadow-sm'
                    : 'text-[#4A5B52] hover:bg-[#FAF7F2] hover:text-[#C85A32]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Ảnh bìa Website (Hero)</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap min-h-[44px] ${
                  activeTab === 'users'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#4A5B52] hover:bg-[#FAF7F2] hover:text-[#1B4332]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Quản lý Tài khoản ({usersList.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. KHU VỰC NỘI DUNG TỪNG TAB */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* ====================================================================
            TAB 1: BẢN TIN CỦA TÔI & SOẠN THẢO BÀI MỚI
           ==================================================================== */}
        {activeTab === 'news' && (
          <div className="space-y-8">
            {/* Header và nút mở Form */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
              <div>
                <h2 className="text-xl font-bold text-[#1B4332]">Danh sách bản tin cơ quan &amp; thôn buôn</h2>
                <p className="text-xs text-[#6B7C73]">
                  Quản lý các tin bài do đơn vị hoặc địa bàn của đồng chí khởi tạo.
                </p>
              </div>

              <button
                onClick={() => {
                  setArticleBeingEdited(null);
                  setEditorModalOpen(true);
                }}
                className="btn-hallmark-primary text-xs sm:text-sm py-2.5 px-4 h-11 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Soạn bài viết mới (Tối đa 7 ảnh)</span>
              </button>
            </div>

            {/* FORM SOẠN THẢO BẢN TIN MỚI */}
            {showCreateForm && (
              <div className="bg-white rounded-2xl border-2 border-[#1B4332] p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                  <h3 className="text-lg font-bold text-[#1B4332] flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[#C85A32]" />
                    Soạn thảo bản tin hoạt động mới
                  </h3>
                  <span className="text-xs text-[#6B7C73]">Chuẩn kiểm duyệt Stored XSS 100%</span>
                </div>

                {formMessage && (
                  <div
                    className={`p-4 rounded-lg text-xs font-bold ${
                      formMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {formMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chọn chuyên mục */}
                  <div>
                    <label className="block text-xs font-bold text-[#14211B] mb-1">
                      Chuyên mục đoàn thể <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        const cat = categories.find((c) => c.id === e.target.value);
                        if (cat) setOrgCode(cat.orgCode);
                      }}
                      className="w-full bg-[#FAF7F2] border border-[#D5CBBA] rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chọn địa bàn 20 thôn buôn */}
                  <div>
                    <label className="block text-xs font-bold text-[#14211B] mb-1">
                      Gắn với địa bàn Thôn, Buôn
                    </label>
                    <select
                      value={villageId}
                      onChange={(e) => setVillageId(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#D5CBBA] rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    >
                      <option value="">Tin chung toàn xã (Không gắn thôn)</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tiêu đề bài viết */}
                <div>
                  <label className="block text-xs font-bold text-[#14211B] mb-1">
                    Tiêu đề bản tin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề rõ ràng, trang trọng, không in nghiêng..."
                    className="w-full bg-white border border-[#D5CBBA] rounded-lg p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>

                {/* Tóm tắt */}
                <div>
                  <label className="block text-xs font-bold text-[#14211B] mb-1">
                    Đoạn tóm tắt (Sapo)
                  </label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn nội dung sự kiện (1-2 câu)..."
                    className="w-full bg-white border border-[#D5CBBA] rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>

                {/* Nội dung chi tiết */}
                <div>
                  <label className="block text-xs font-bold text-[#14211B] mb-1">
                    Nội dung chi tiết bài viết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder="Nhập nội dung bài viết. Có thể xuống dòng giữa các đoạn văn..."
                    className="w-full bg-white border border-[#D5CBBA] rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Link ảnh bìa */}
                  <div>
                    <label className="block text-xs font-bold text-[#14211B] mb-1">
                      Đường dẫn ảnh minh họa (URL)
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white border border-[#D5CBBA] rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    />
                  </div>

                  {/* Thông tin ủy quyền cơ sở */}
                  <div>
                    <label className="block text-xs font-bold text-[#14211B] mb-1">
                      Ủy quyền đưa tin hộ cơ sở (nếu có)
                    </label>
                    <input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Ví dụ: Ban Tự quản Thôn 3, Chi hội Phụ nữ Buôn A..."
                      className="w-full bg-white border border-[#D5CBBA] rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    />
                  </div>
                </div>

                {/* Các nút hành động theo thẩm quyền */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateArticle(ArticleStatus.DRAFT)}
                    className="btn-hallmark-outline text-xs h-11"
                  >
                    Lưu bản nháp
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateArticle(ArticleStatus.PENDING_APPROVAL)}
                    className="btn-hallmark-accent text-xs h-11"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Trình duyệt lên Thường trực MTTQ
                  </button>

                  {isExecutiveOrSuper && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleCreateArticle(ArticleStatus.PUBLISHED)}
                      className="btn-hallmark-primary text-xs h-11"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Phê duyệt &amp; Xuất bản ngay
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* BẢNG DANH SÁCH BÀI VIẾT */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#1B4332] uppercase tracking-wider font-bold border-b border-[#E8E2D5]">
                    <tr>
                      <th className="p-3.5">Tiêu đề bản tin</th>
                      <th className="p-3.5">Chuyên mục / Địa bàn</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5">Ngày cập nhật</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {articlesList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#6B7C73]">
                          Chưa có bản tin nào. Hãy nhấn &quot;Soạn bài viết mới&quot; để tạo bài đầu tiên.
                        </td>
                      </tr>
                    ) : (
                      articlesList.map((art) => (
                        <tr key={art.id} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="p-3.5 font-bold text-[#14211B] max-w-sm">
                            <Link href={`/news/${art.slug}`} className="hover:text-[#1B4332] line-clamp-2">
                              {art.title}
                            </Link>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-semibold block">{art.category?.name}</span>
                            {art.village && (
                              <span className="text-[11px] text-[#C85A32] font-medium">{art.village.name}</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                                art.status === ArticleStatus.PUBLISHED
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : art.status === ArticleStatus.PENDING_APPROVAL
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {art.status === ArticleStatus.PUBLISHED
                                ? 'Đã xuất bản'
                                : art.status === ArticleStatus.PENDING_APPROVAL
                                ? 'Chờ duyệt'
                                : 'Bản nháp'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[#6B7C73]">
                            {new Date(art.updatedAt || art.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => {
                                setArticleBeingEdited(art);
                                setEditorModalOpen(true);
                              }}
                              className="p-1.5 text-amber-700 hover:bg-amber-100 rounded inline-block transition"
                              title="Chỉnh sửa bản tin này"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="p-1.5 text-[#1B4332] hover:bg-[#E8F5EE] rounded inline-block transition"
                              title="Xem trước"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteArticle(art.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded inline-block transition"
                              title="Xóa bài"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: HÀNG ĐỢI PHÊ DUYỆT (CHỦ TỊCH UBMTTQ XÃ / EXECUTIVE)
           ==================================================================== */}
        {activeTab === 'approvals' && isExecutiveOrSuper && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-[#C85A32]" />
                Hàng đợi kiểm duyệt xuất bản bản tin cơ sở
              </h2>
              <p className="text-xs text-[#6B7C73]">
                Thẩm quyền Thường trực UBMTTQ Việt Nam xã Ea Súp phê duyệt tin từ 20 thôn buôn và các đoàn thể.
              </p>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-[#E8E2D5]">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-[#14211B]">Tất cả bản tin đã được xử lý xong!</p>
                <p className="text-xs text-[#6B7C73] mt-1">Hiện không có bài viết nào chờ phê duyệt.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingList.map((art) => (
                  <div
                    key={art.id}
                    className="p-6 bg-white rounded-xl border border-[#D5CBBA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#FAF0EC] text-[#C85A32] font-bold">
                          {art.category?.name}
                        </span>
                        {art.village && (
                          <span className="font-bold text-[#1B4332]">&bull; {art.village.name}</span>
                        )}
                        <span className="text-[#6B7C73]">
                          Người gửi: <strong>{art.author?.name}</strong> ({art.author?.positionTitle || 'Cơ sở'})
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[#14211B]">{art.title}</h4>
                      <p className="text-xs text-[#4A5B52] line-clamp-2 leading-relaxed">{art.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/news/${art.slug}`}
                        target="_blank"
                        className="btn-hallmark-outline text-xs h-10 px-3"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem nội dung
                      </Link>
                      <button
                        onClick={() => handleApproveArticle(art.id)}
                        className="btn-hallmark-primary text-xs h-10 px-4"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Duyệt xuất bản
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 3: QUẢN LÝ THÔNG BÁO TICKER BAR
           ==================================================================== */}
        {activeTab === 'announcements' && isExecutiveOrSuper && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#C85A32]" />
                Thông báo điều hành trên Dải Ticker Bar
              </h2>
              <p className="text-xs text-[#6B7C73]">
                Dòng thông báo khẩn, lịch họp tiếp dân chạy trên đầu trang chủ easupso.com.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D5] p-4 divide-y divide-[#E8E2D5]">
              {quickAnnouncements.map((ann) => (
                <div key={ann.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ann.isUrgent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ann.isUrgent ? 'Khẩn' : 'Bình thường'}
                      </span>
                      <strong className="text-sm text-[#14211B]">{ann.title}</strong>
                    </div>
                    <p className="text-xs text-[#4A5B52] mt-1">{ann.content}</p>
                  </div>
                  <span className="text-[11px] text-[#6B7C73] whitespace-nowrap">
                    {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: NHẬT KÝ KIỂM TOÁN ZERO-TRUST (AUDIT LOG)
           ==================================================================== */}
        {activeTab === 'audit' && isExecutiveOrSuper && (
          <div className="space-y-6">
            <div className="border-b border-[#E8E2D5] pb-4">
              <h2 className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
                <History className="w-5 h-5 text-[#C85A32]" />
                Nhật ký kiểm toán bất biến (Zero-Trust Audit Log)
              </h2>
              <p className="text-xs text-[#6B7C73]">
                Lưu vết toàn bộ mọi hành vi can thiệp dữ liệu, xuất bản hoặc đồng bộ số liệu hệ thống.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#1B4332] font-bold uppercase tracking-wider border-b border-[#E8E2D5]">
                    <tr>
                      <th className="p-3.5">Thời gian</th>
                      <th className="p-3.5">Hành động</th>
                      <th className="p-3.5">Cán bộ thực hiện</th>
                      <th className="p-3.5">Bảng dữ liệu</th>
                      <th className="p-3.5">Địa chỉ IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#6B7C73]">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action === 'CREATE'
                                ? 'bg-blue-100 text-blue-800'
                                : log.action === 'APPROVE'
                                ? 'bg-green-100 text-green-800'
                                : log.action === 'DELETE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-[#14211B]">{log.userEmail || 'Hệ thống'}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#4A5B52]">{log.targetTable}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#6B7C73]">{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: QUẢN LÝ ẢNH BÌA WEBSITE (HERO BANNER)
           ==================================================================== */}
        {activeTab === 'settings' && isExecutiveOrSuper && (
          <div className="space-y-8">
            {/* Header tab */}
            <div className="bg-white rounded-2xl border border-[#E8E2D5] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center shrink-0 border border-[#1B4332]/20">
                    <ImageIcon className="w-6 h-6 text-[#1B4332]" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1B4332] uppercase tracking-tight">
                      Quản lý Ảnh bìa Website (Hero Banner)
                    </h2>
                    <p className="text-xs sm:text-sm text-[#4A5B52] mt-1">
                      Tùy chỉnh hình ảnh toàn cảnh xuất hiện trên Trang chủ <span className="font-semibold text-[#1B4332]">easupso.com</span>. Cập nhật được áp dụng tức thì cho người dân và cán bộ khi truy cập.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#1B4332]" />
                    Quyền Lãnh đạo MTTQ / Super Admin
                  </span>
                </div>
              </div>

              {/* Thông báo kết quả lưu */}
              {heroMessage && (
                <div
                  className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
                    heroMessage.type === 'success'
                      ? 'bg-green-50 text-green-900 border-green-200'
                      : 'bg-red-50 text-red-900 border-red-200'
                  }`}
                >
                  {heroMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <span>{heroMessage.text}</span>
                </div>
              )}

              {/* KHUNG XEM TRƯỚC THỰC TẾ (LIVE PREVIEW) */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#14211B] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C85A32]" />
                    Khung xem trước giao diện thực tế (Live Preview)
                  </label>
                  <span className="text-xs text-[#6B7C73]">
                    Tỉ lệ toàn cảnh Panoramic 21:9 chuẩn @hallmark
                  </span>
                </div>

                <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border-2 border-[#1B4332]/20 shadow-lg bg-[#14211B]">
                  {/* Ảnh bìa hiển thị */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewHeroUrl || defaultScenicCover}
                    alt="Xem trước ảnh bìa Ea Súp"
                    className="w-full h-full object-cover transition-all duration-500"
                    onError={() => {
                      setPreviewHeroUrl(defaultScenicCover);
                    }}
                  />

                  {/* Lớp phủ chuyển tiếp đồng bộ Trang chủ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35 pointer-events-none" />

                  {/* Mockup nội dung như Trang chủ để dễ hình dung */}
                  <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                        <span>ỦY BAN MTTQ VN XÃ EA SÚP</span>
                      </div>

                      <span className="px-3 py-1 rounded-md text-[11px] font-bold bg-[#C85A32] text-white shadow-sm">
                        Chế độ xem trước
                      </span>
                    </div>

                    <div className="max-w-xl space-y-2">
                      <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">
                        Cổng Thông Tin &amp; Dịch Vụ Số
                        <span className="block mt-1">Xã Ea Súp</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-white/90 line-clamp-2 drop-shadow">
                        Đồng hành cùng 20 thôn, buôn xây dựng chính quyền phục vụ, kinh tế số và xã hội số văn minh, giàu đẹp.
                      </p>

                      {/* Mockup thanh tìm kiếm */}
                      <div className="pt-2">
                        <div className="h-10 w-full max-w-md bg-white/90 rounded-full flex items-center px-4 gap-2 text-xs text-gray-500 shadow-md">
                          <span>🔍 Tìm kiếm dịch vụ công, giá nông sản, văn bản chỉ đạo...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KHU VỰC TẢI ẢNH LÊN TỪ MÁY TÍNH VÀ NHẬP URL */}
              <div className="mt-8 pt-6 border-t border-[#E8E2D5] space-y-6">
                {/* 1. KHUNG TẢI ẢNH LÊN TỪ MÁY TÍNH */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#14211B] uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#C85A32]" />
                      <span>Tải ảnh lên từ máy tính (File trực tiếp):</span>
                    </label>
                    <span className="text-[11px] text-[#6B7C73]">
                      Tự động tải lên máy chủ &amp; xem trước tức thì
                    </span>
                  </div>

                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={handleHeroFileUpload}
                  />

                  <div
                    onClick={() => heroFileInputRef.current?.click()}
                    className="group border-2 border-dashed border-[#1B4332]/30 hover:border-[#1B4332] bg-[#FAF7F2] hover:bg-white rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2 shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1B4332]/10 group-hover:bg-[#1B4332] text-[#1B4332] group-hover:text-white flex items-center justify-center transition">
                      {isUploadingImage ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-[#C85A32]" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#14211B]">
                        {isUploadingImage
                          ? 'Đang tải và xử lý ảnh lên máy chủ...'
                          : 'Bấm vào đây để Chọn ảnh từ máy tính của bạn'}
                      </p>
                      <p className="text-xs text-[#6B7C73] mt-0.5">
                        Chấp nhận định dạng: JPG, PNG, WebP (Khuyến nghị tỉ lệ toàn cảnh 21:9 hoặc tối thiểu 1920x800 px, tối đa 15MB)
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isUploadingImage}
                      className="mt-1 px-5 py-2 rounded-xl bg-[#1B4332] group-hover:bg-[#143326] text-white text-xs font-bold shadow transition flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Đang tải lên...' : 'Chọn file từ thiết bị'}</span>
                    </button>
                  </div>
                </div>

                {/* Đường phân cách */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#E8E2D5]" />
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-[#6B7C73] uppercase tracking-wider">
                    hoặc dán đường dẫn ảnh tùy chỉnh (URL trực tiếp / CDN)
                  </span>
                  <div className="flex-grow border-t border-[#E8E2D5]" />
                </div>

                {/* 2. Ô NHẬP ĐƯỜNG DẪN ẢNH VÀ NÚT LƯU */}
                <div>
                  <label className="block text-xs font-bold text-[#14211B] uppercase tracking-wider mb-2">
                    Đường dẫn ảnh hiện tại / URL ngoài:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={heroImageUrl}
                      onChange={(e) => {
                        setHeroImageUrl(e.target.value);
                        setPreviewHeroUrl(e.target.value);
                      }}
                      placeholder="https://.../anh-bia-easup.jpg hoặc /uploads/..."
                      className="flex-1 px-4 py-3 rounded-xl border border-[#E8E2D5] text-sm text-[#14211B] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] font-mono"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewHeroUrl(heroImageUrl)}
                        className="px-4 py-3 rounded-xl border border-[#1B4332] text-[#1B4332] hover:bg-[#FAF7F2] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
                        title="Tải lại xem thử"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Xem thử</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSavingHero || isUploadingImage}
                        onClick={() => handleSaveHeroImage()}
                        className="px-6 py-3 rounded-xl bg-[#C85A32] hover:bg-[#b04a25] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                      >
                        {isSavingHero ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck className="w-4 h-4" />
                            <span>Lưu thay đổi & Áp dụng</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6B7C73] mt-2">
                    Sau khi chọn ảnh từ máy tính hoặc nhập link, bạn hãy bấm <strong className="text-[#C85A32]">&quot;Lưu thay đổi &amp; Áp dụng&quot;</strong> để công bố ảnh mới lên Trang chủ.
                  </p>
                </div>

                {/* DANH MỤC ẢNH PHONG CẢNH EA SÚP CÀI ĐẶT SẴN (PRESETS) */}
                <div className="pt-6 border-t border-[#E8E2D5] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-wider flex items-center gap-2">
                      <span>📸 Hoặc chọn nhanh từ Kho tư liệu Thắng cảnh &amp; Di sản Xã Ea Súp</span>
                    </h3>
                    <p className="text-xs text-[#6B7C73] mt-0.5">
                      Bấm vào từng mẫu bên dưới để xem trước và nhấn &ldquo;Áp dụng ngay&rdquo; để lưu trực tiếp lên website.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {heroPresets.map((preset, idx) => {
                      const isSelected =
                        heroImageUrl === preset.url ||
                        (!heroImageUrl && idx === 0);

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 flex gap-3 transition cursor-pointer ${
                            isSelected
                              ? 'border-[#C85A32] bg-[#FAF7F2] shadow-sm ring-1 ring-[#C85A32]'
                              : 'border-[#E8E2D5] bg-white hover:border-[#1B4332]'
                          }`}
                          onClick={() => {
                            setHeroImageUrl(preset.url);
                            setPreviewHeroUrl(preset.url);
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-24 h-20 rounded-lg object-cover shrink-0 border border-[#E8E2D5]"
                          />

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-[#14211B] line-clamp-1">
                                {preset.name}
                              </h4>
                              <p className="text-[11px] text-[#4A5B52] line-clamp-2 mt-1">
                                {preset.desc}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1">
                              <span className="text-[10px] font-semibold text-[#6B7C73]">
                                {isSelected ? '● Đang chọn xem trước' : '○ Bấm để chọn'}
                              </span>

                              <button
                                type="button"
                                disabled={isSavingHero}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveHeroImage(preset.url);
                                }}
                                className="px-3 py-1 rounded-md text-[11px] font-bold bg-[#1B4332] hover:bg-[#143326] text-white shadow-xs transition"
                              >
                                Áp dụng ngay
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hộp ghi chú quy chuẩn an toàn */}
                <div className="mt-6 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-start gap-3 text-xs text-[#4A5B52]">
                  <ShieldAlert className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#14211B] block">Nguyên tắc Bảo mật Zero-Trust &amp; Vết kiểm toán:</strong>
                    Tất cả hành động sửa đổi ảnh bìa website đều được tự động lưu vết tại bảng <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E2D5]">AuditLog</code> với định danh tài khoản, thời gian chuẩn và địa chỉ IP của cán bộ quản trị.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 6: QUẢN LÝ TÀI KHOẢN CÁN BỘ & PHÂN QUYỀN (RBAC + ABAC)
           ==================================================================== */}
        {activeTab === 'users' && isExecutiveOrSuper && (
          <div className="space-y-8">
            {/* Header & Thống kê nhanh */}
            <div className="bg-white rounded-2xl border border-[#E8E2D5] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center shrink-0 border border-[#1B4332]/20">
                    <Users className="w-6 h-6 text-[#1B4332]" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1B4332] uppercase tracking-tight">
                      Quản lý Tài khoản Cán bộ &amp; Quản trị viên
                    </h2>
                    <p className="text-xs sm:text-sm text-[#4A5B52] mt-1">
                      Thiết lập phân quyền theo vai trò (RBAC) và thuộc tính cơ sở (ABAC 20 thôn buôn), cấp hoặc đổi mật khẩu an toàn.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-5 py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Thêm tài khoản cán bộ</span>
                </button>
              </div>

              {/* Thông báo kết quả thao tác */}
              {userFeedbackMsg && (
                <div
                  className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold border ${
                    userFeedbackMsg.type === 'success'
                      ? 'bg-green-50 text-green-900 border-green-200'
                      : 'bg-red-50 text-red-900 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {userFeedbackMsg.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <span>{userFeedbackMsg.text}</span>
                  </div>
                  <button
                    onClick={() => setUserFeedbackMsg(null)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 4 Thẻ Thống kê nhanh */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D5]">
                  <p className="text-xs font-bold text-[#6B7C73] uppercase">Tổng tài khoản</p>
                  <p className="text-2xl font-black text-[#1B4332] mt-1">{usersList.length}</p>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D5]">
                  <p className="text-xs font-bold text-[#6B7C73] uppercase">Quản trị viên &amp; Lãnh đạo</p>
                  <p className="text-2xl font-black text-[#C85A32] mt-1">
                    {usersList.filter((u) => u.role === Role.SUPER_ADMIN || u.role === Role.EXECUTIVE).length}
                  </p>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D5]">
                  <p className="text-xs font-bold text-[#6B7C73] uppercase">Đoàn thể &amp; 20 Thôn buôn</p>
                  <p className="text-2xl font-black text-[#1B4332] mt-1">
                    {usersList.filter((u) => u.role === Role.SPECIALIST || u.role === Role.VILLAGE_LEADER).length}
                  </p>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D5]">
                  <p className="text-xs font-bold text-[#6B7C73] uppercase">Đang hoạt động</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {usersList.filter((u) => u.isActive).length}
                  </p>
                </div>
              </div>

              {/* BẢNG DANH SÁCH TÀI KHOẢN CÁN BỘ */}
              <div className="overflow-x-auto rounded-xl border border-[#E8E2D5]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#FAF7F2] text-[#1B4332] font-bold uppercase tracking-wider border-b border-[#E8E2D5] text-[11px]">
                    <tr>
                      <th className="p-3.5">Cán bộ / Email</th>
                      <th className="p-3.5">Vai trò hệ thống</th>
                      <th className="p-3.5">Đoàn thể / Thôn buôn</th>
                      <th className="p-3.5">Chức danh</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5] bg-white">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 text-[#1B4332] font-bold flex items-center justify-center shrink-0 border border-[#1B4332]/20">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#14211B]">{u.name}</span>
                                {u.isRootAdmin && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#C85A32] text-white shadow-xs">
                                    ★ Admin Tối cao
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B7C73] font-mono mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === Role.SUPER_ADMIN
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : u.role === Role.EXECUTIVE
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : u.role === Role.VILLAGE_LEADER
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : u.role === Role.SPECIALIST
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {u.role === Role.SUPER_ADMIN
                              ? 'Super Admin'
                              : u.role === Role.EXECUTIVE
                              ? 'Lãnh đạo UBMTTQ'
                              : u.role === Role.VILLAGE_LEADER
                              ? 'Trưởng thôn/buôn'
                              : u.role === Role.SPECIALIST
                              ? 'Cán bộ đoàn thể'
                              : 'Nhân dân'}
                          </span>
                        </td>

                        <td className="p-3.5 text-xs text-[#4A5B52]">
                          {u.villageName ? (
                            <span className="font-semibold text-[#1B4332] bg-[#FAF7F2] px-2 py-1 rounded border border-[#E8E2D5]">
                              {u.villageName}
                            </span>
                          ) : u.orgCode ? (
                            <span className="font-semibold text-[#C85A32]">Khối {u.orgCode}</span>
                          ) : (
                            <span className="text-[#6B7C73]">—</span>
                          )}
                        </td>

                        <td className="p-3.5 text-xs text-[#4A5B52] max-w-[200px] truncate" title={u.positionTitle || ''}>
                          {u.positionTitle || 'Chuyên viên'}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Đang khóa
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Sửa */}
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="p-2 rounded-lg border border-[#E8E2D5] hover:bg-[#FAF7F2] text-[#1B4332] text-xs font-semibold transition"
                              title="Chỉnh sửa thông tin & quyền"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Đổi mật khẩu */}
                            <button
                              onClick={() => {
                                setPasswordResetUser(u);
                                setResetNewPassword('');
                              }}
                              className="p-2 rounded-lg border border-[#E8E2D5] hover:bg-[#FAF7F2] text-[#C85A32] text-xs font-semibold transition"
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Khóa / Mở khóa */}
                            {!u.isRootAdmin && u.id !== user.id && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`p-2 rounded-lg border text-xs font-semibold transition ${
                                  u.isActive
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                              >
                                {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {/* Nút Xóa (Chỉ Super Admin và không xóa root admin / chính mình) */}
                            {user.role === Role.SUPER_ADMIN && !u.isRootAdmin && u.id !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-2 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white text-red-600 text-xs font-semibold transition"
                                title="Xóa tài khoản vĩnh viễn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL 1: THÊM TÀI KHOẢN CÁN BỘ MỚI */}
            {showCreateUserModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-[#D5CBBA] shadow-2xl p-6 sm:p-8 space-y-6 my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#1B4332]" />
                      <h3 className="text-lg font-bold text-[#1B4332]">Thêm tài khoản cán bộ mới</h3>
                    </div>
                    <button
                      onClick={() => setShowCreateUserModal(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#14211B] mb-1">
                          Họ và tên cán bộ: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="vd: Nguyễn Văn A"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#14211B] mb-1">
                          Địa chỉ Gmail / Email công vụ: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="canbo@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#14211B] mb-1">
                          Vai trò phân quyền (RBAC):
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as Role)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white font-medium"
                        >
                          <option value={Role.SPECIALIST}>Cán bộ / Chuyên viên các Đoàn thể</option>
                          <option value={Role.VILLAGE_LEADER}>Trưởng thôn / Trưởng buôn (20 thôn buôn)</option>
                          <option value={Role.EXECUTIVE}>Lãnh đạo Ban Thường trực UBMTTQ xã</option>
                          <option value={Role.SUPER_ADMIN}>Quản trị viên Cấp cao (Super Admin)</option>
                        </select>
                      </div>

                      {newUserRole === Role.VILLAGE_LEADER ? (
                        <div>
                          <label className="block text-xs font-bold text-[#14211B] mb-1">
                            Địa bàn Thôn / Buôn phụ trách:
                          </label>
                          <select
                            value={newUserVillageId}
                            onChange={(e) => setNewUserVillageId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white font-medium"
                          >
                            <option value="">-- Chọn 1 trong 20 thôn buôn --</option>
                            {villages.map((v) => (
                              <option key={v.code} value={v.id || v.code}>
                                {v.name} ({v.type === 'BUON' ? 'Buôn' : 'Thôn'})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-[#14211B] mb-1">
                            Khối đoàn thể cơ quan:
                          </label>
                          <select
                            value={newUserOrgCode}
                            onChange={(e) => setNewUserOrgCode(e.target.value as OrgCode)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white font-medium"
                          >
                            <option value={OrgCode.MTTQ}>Cơ quan Mặt trận Tổ quốc xã</option>
                            <option value={OrgCode.PHU_NU}>Hội Liên hiệp Phụ nữ xã</option>
                            <option value={OrgCode.NONG_DAN}>Hội Nông dân xã</option>
                            <option value={OrgCode.DOAN_TN}>Đoàn Thanh niên xã</option>
                            <option value={OrgCode.CCB}>Hội Cựu chiến binh xã</option>
                            <option value={OrgCode.UBND}>Khối Chính quyền / UBND xã</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14211B] mb-1">
                        Chức vụ / Vị trí hiển thị:
                      </label>
                      <input
                        type="text"
                        value={newUserPosition}
                        onChange={(e) => setNewUserPosition(e.target.value)}
                        placeholder="vd: Phó Chủ tịch Hội Nông dân, Trưởng thôn 5..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14211B] mb-1">
                        Mật khẩu khởi tạo ban đầu (Tùy chọn):
                      </label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự (nếu để trống, cán bộ chỉ đăng nhập bằng Google Gmail)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E2D5]">
                      <button
                        type="button"
                        onClick={() => setShowCreateUserModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-[#4A5B52] text-xs sm:text-sm font-bold hover:bg-[#FAF7F2]"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={userActionLoading}
                        className="px-6 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold shadow transition disabled:opacity-50"
                      >
                        {userActionLoading ? 'Đang tạo...' : 'Lưu tài khoản'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 2: CHỈNH SỬA THÔNG TIN CÁN BỘ */}
            {editingUser && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-[#D5CBBA] shadow-2xl p-6 sm:p-8 space-y-6 my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-[#1B4332]" />
                      <h3 className="text-lg font-bold text-[#1B4332]">Chỉnh sửa tài khoản: {editingUser.email}</h3>
                    </div>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#14211B] mb-1">
                        Họ và tên cán bộ:
                      </label>
                      <input
                        type="text"
                        required
                        value={editingUser.name || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#14211B] mb-1">
                          Vai trò phân quyền:
                        </label>
                        <select
                          disabled={editingUser.isRootAdmin}
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white font-medium disabled:opacity-50"
                        >
                          <option value={Role.SUPER_ADMIN}>Super Admin</option>
                          <option value={Role.EXECUTIVE}>Lãnh đạo UBMTTQ</option>
                          <option value={Role.SPECIALIST}>Cán bộ đoàn thể</option>
                          <option value={Role.VILLAGE_LEADER}>Trưởng thôn / buôn</option>
                          <option value={Role.PUBLIC}>Nhân dân</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#14211B] mb-1">
                          Khối đoàn thể cơ quan:
                        </label>
                        <select
                          value={editingUser.orgCode || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, orgCode: e.target.value || null })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white font-medium"
                        >
                          <option value="">-- Không chọn --</option>
                          <option value={OrgCode.MTTQ}>Mặt trận Tổ quốc</option>
                          <option value={OrgCode.PHU_NU}>Phụ nữ</option>
                          <option value={OrgCode.NONG_DAN}>Nông dân</option>
                          <option value={OrgCode.DOAN_TN}>Đoàn thanh niên</option>
                          <option value={OrgCode.CCB}>Cựu chiến binh</option>
                          <option value={OrgCode.UBND}>Khối UBND xã</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14211B] mb-1">
                        Chức danh hiển thị:
                      </label>
                      <input
                        type="text"
                        value={editingUser.positionTitle || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, positionTitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={editingUser.isRootAdmin || editingUser.id === user.id}
                          checked={editingUser.isActive}
                          onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-[#1B4332] focus:ring-[#1B4332]"
                        />
                        <span className="text-xs font-bold text-[#14211B]">Kích hoạt tài khoản hoạt động bình thường</span>
                      </label>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E2D5]">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-[#4A5B52] text-xs sm:text-sm font-bold hover:bg-[#FAF7F2]"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={userActionLoading}
                        className="px-6 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs sm:text-sm font-bold shadow transition disabled:opacity-50"
                      >
                        {userActionLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 3: ĐẶT LẠI MẬT KHẨU CÁN BỘ */}
            {passwordResetUser && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full border-2 border-[#D5CBBA] shadow-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-[#C85A32]" />
                      <h3 className="text-lg font-bold text-[#1B4332]">Đổi mật khẩu tài khoản</h3>
                    </div>
                    <button
                      onClick={() => setPasswordResetUser(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#4A5B52]">
                    Đồng chí đang thiết lập mật khẩu mới cho cán bộ: <strong className="text-[#14211B]">{passwordResetUser.name}</strong> ({passwordResetUser.email}).
                  </p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#14211B] mb-1">
                        Mật khẩu mới: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E2D5]">
                      <button
                        type="button"
                        onClick={() => setPasswordResetUser(null)}
                        className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-[#4A5B52] text-xs sm:text-sm font-bold hover:bg-[#FAF7F2]"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={userActionLoading}
                        className="px-6 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#b04a25] text-white text-xs sm:text-sm font-bold shadow transition disabled:opacity-50"
                      >
                        {userActionLoading ? 'Đang đổi...' : 'Xác nhận đổi mật khẩu'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL SOẠN THẢO / CHỈNH SỬA BẢN TIN (TỐI ĐA 7 ẢNH, DƯỚI 5MB) */}
      <NewsEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        articleToEdit={articleBeingEdited}
        categories={categories}
        onSuccess={(saved) => {
          if (articleBeingEdited) {
            setArticlesList((prev) =>
              prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item))
            );
            alert('Đã cập nhật bản tin thành công!');
          } else {
            setArticlesList((prev) => [saved, ...prev]);
            alert('Đã tạo bản tin mới thành công!');
          }
        }}
      />
    </div>
  );
}

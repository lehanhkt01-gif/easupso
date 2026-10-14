import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { prisma } from '@/lib/prisma';
import { ArticleStatus } from '@prisma/client';
import { getServerAuthSession } from '@/auth';
import { ArticleActionToolbar } from '@/components/news/ArticleActionToolbar';
import { extractGalleryImages } from '@/lib/news-gallery';
import {
  Calendar,
  Eye,
  MapPin,
  Share2,
  ArrowLeft,
  Clock,
  User,
  ShieldCheck,
  Check,
  ChevronRight,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    select: { title: true, summary: true, thumbnailUrl: true },
  });

  if (!article) return { title: 'Bản tin không tồn tại' };

  return {
    title: `${article.title} — Cổng thông tin Ea Súp`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.thumbnailUrl ? [article.thumbnailUrl] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;

  // Lấy dữ liệu bài viết
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    include: {
      category: true,
      village: true,
      author: {
        select: { name: true, positionTitle: true },
      },
    },
  });

  if (!article || article.status !== ArticleStatus.PUBLISHED) {
    notFound();
  }

  // Tăng lượt xem (Fire and forget)
  prisma.newsArticle
    .update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((err) => console.error('Lỗi tăng viewCount:', err));

  // Lấy 3 bài viết liên quan
  const relatedArticles = await prisma.newsArticle.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      id: { not: article.id },
      OR: [
        { categoryId: article.categoryId },
        ...(article.villageId ? [{ villageId: article.villageId }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      thumbnailUrl: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  const fullUrl = `https://easupso.com/news/${article.slug}`;
  const zaloShareUrl = `https://sp.zalo.me/share?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(article.title)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;

  const session = await getServerAuthSession();
  const isStaff = Boolean(session?.user && session.user.role && session.user.role !== 'PUBLIC');
  const articleWithImages = {
    ...article,
    images: extractGalleryImages(article.contentHtml, article.thumbnailUrl),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb điều hướng */}
        <nav className="flex items-center gap-2 text-xs text-[#6B7C73] mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#1B4332] font-semibold">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#D5CBBA]" />
          <Link href="/#tin-tuc" className="hover:text-[#1B4332] font-semibold">
            Bản tin Mặt trận &amp; Đoàn thể
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#D5CBBA]" />
          <span className="text-[#1B4332] font-bold truncate max-w-xs">{article.category.name}</span>
        </nav>

        {/* Thanh công cụ cán bộ: Sửa / Xóa bài trực tiếp */}
        {isStaff && session?.user && (
          <ArticleActionToolbar article={articleWithImages} user={session.user} />
        )}

        {/* Khối bài viết chính */}
        <article className="bg-white rounded-2xl border border-[#E8E2D5] shadow-sm p-6 sm:p-10 mb-10">
          
          {/* Huy hiệu chuyên mục & Thôn buôn */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#1B4332] text-white">
              {article.category.name}
            </span>
            {article.village && (
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#FAF0EC] text-[#C85A32] border border-[#EBBAA7] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {article.village.name}
              </span>
            )}
            {article.beneficiaryName && (
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#FCF8EC] text-[#AA8C2C] border border-[#F3E4B3]">
                Ủy quyền đưa tin: {article.beneficiaryName}
              </span>
            )}
          </div>

          {/* Tiêu đề bài viết (TUYỆT ĐỐI KHÔNG IN NGHIÊNG) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1B4332] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Metadata thông tin tác giả & thời gian */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#E8E2D5] text-xs text-[#6B7C73] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F5EE] text-[#1B4332] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#14211B]">{article.author.name}</p>
                <p className="text-[11px] text-[#4A5B52]">{article.author.positionTitle || 'Cán bộ Mặt trận xã'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.viewCount + 1} lượt xem
              </span>
            </div>
          </div>

          {/* Đoạn tóm tắt (Sapo) */}
          <div className="p-4 sm:p-5 bg-[#FAF7F2] rounded-xl border-l-4 border-[#C85A32] mb-8">
            <p className="text-base sm:text-lg font-bold text-[#14211B] leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Ảnh minh họa nếu có */}
          {article.thumbnailUrl && (
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-8 border border-[#E8E2D5]">
              <img
                src={article.thumbnailUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Nội dung bài viết đã làm sạch chống Stored XSS */}
          <div
            className="prose prose-lg max-w-none text-[#14211B] leading-relaxed space-y-4 font-normal"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />

          {/* Thanh chia sẻ tin nhanh qua Zalo & Mạng xã hội */}
          <div className="mt-10 pt-6 border-t border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332] uppercase">
              <Share2 className="w-4 h-4 text-[#C85A32]" />
              Chia sẻ bản tin đến bà con 20 thôn buôn:
            </div>

            <div className="flex items-center gap-2">
              {/* Nút chia sẻ Zalo chính thức */}
              <a
                href={zaloShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0068FF] text-white text-xs font-bold hover:bg-[#0052cc] transition shadow-sm"
              >
                <span>Chia sẻ qua Zalo</span>
              </a>

              {/* Nút chia sẻ Facebook */}
              <a
                href={fbShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1877F2] text-white text-xs font-bold hover:bg-[#0d65d9] transition shadow-sm"
              >
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </article>

        {/* Bài viết liên quan */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <h3 className="text-xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#C85A32] rounded-full inline-block" />
              Bản tin cùng chuyên mục &amp; địa bàn
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${rel.slug}`}
                  className="surface-card p-4 rounded-xl group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A32]">
                      {rel.category.name}
                    </span>
                    <h4 className="text-sm font-bold text-[#14211B] group-hover:text-[#1B4332] line-clamp-2 mt-1 mb-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-[#6B7C73] line-clamp-2">{rel.summary}</p>
                  </div>
                  <span className="text-[11px] text-[#1B4332] font-semibold mt-3 pt-2 border-t border-[#E8E2D5]">
                    Đọc tiếp &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="text-center pb-8">
          <Link href="/#tin-tuc" className="btn-hallmark-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ bản tin
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

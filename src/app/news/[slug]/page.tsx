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
import { extractGalleryImages, extractGalleryMedia, stripGalleryFromHtml } from '@/lib/news-gallery';
import { ArticleGallery } from '@/components/news/ArticleGallery';
import { EditorialArticleView } from '@/components/news/EditorialArticleView';
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  let article: { title: string; summary: string; thumbnailUrl: string | null } | null = null;
  try {
    article = await prisma.newsArticle.findFirst({
      where: {
        OR: [{ slug }, { slug: rawSlug }],
      },
      select: { title: true, summary: true, thumbnailUrl: true },
    });
  } catch {}

  if (!article) {
    const { getLocalArticleBySlug } = await import('@/lib/local-news');
    article = (await getLocalArticleBySlug(slug)) || (await getLocalArticleBySlug(rawSlug));
  }

  if (!article) return { title: 'Bản tin không tồn tại — Cổng thông tin Ea Súp' };

  return {
    title: `${article.title} — Cổng thông tin Ea Súp`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.thumbnailUrl ? [article.thumbnailUrl] : ['/images/og-share.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: article.thumbnailUrl ? [article.thumbnailUrl] : ['/images/og-share.png'],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  // Lấy dữ liệu bài viết từ DB hoặc kho cục bộ
  let article: any = null;
  try {
    article = await prisma.newsArticle.findFirst({
      where: {
        OR: [{ slug }, { slug: rawSlug }],
      },
      include: {
        category: true,
        village: true,
        author: {
          select: { name: true, positionTitle: true },
        },
      },
    });
  } catch (err) {
    console.warn('[NEWS_DETAIL_DB_WARN] CSDL chưa sẵn sàng, lấy từ file cục bộ:', err);
  }

  if (!article) {
    const { getLocalArticleBySlug } = await import('@/lib/local-news');
    article = (await getLocalArticleBySlug(slug)) || (await getLocalArticleBySlug(rawSlug));
  }

  if (!article || article.status !== ArticleStatus.PUBLISHED) {
    notFound();
  }

  // Tăng lượt xem (Fire and forget)
  if (article.id) {
    try {
      prisma.newsArticle
        .update({
          where: { id: article.id },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {});
    } catch {}
  }

  // Lấy 3 bài viết liên quan
  let relatedArticles: any[] = [];
  try {
    relatedArticles = await prisma.newsArticle.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        id: { not: article.id },
        ...(article.categoryId || article.villageId
          ? {
              OR: [
                ...(article.categoryId ? [{ categoryId: article.categoryId }] : []),
                ...(article.villageId ? [{ villageId: article.villageId }] : []),
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
  } catch {}

  if (relatedArticles.length === 0) {
    try {
      const { getLocalArticles } = await import('@/lib/local-news');
      const all = await getLocalArticles();
      relatedArticles = all
        .filter((a) => a.status === ArticleStatus.PUBLISHED && a.id !== article.id)
        .slice(0, 3)
        .map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          thumbnailUrl: a.thumbnailUrl,
          category: a.category ? { name: a.category.name } : { name: 'Bản tin' },
        }));
    } catch {}
  }

  const fullUrl = `https://easupso.com/news/${article.slug}`;
  const zaloShareUrl = `https://sp.zalo.me/share?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(article.title || '')}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;

  const session = await getServerAuthSession();
  const isStaff = Boolean(session?.user && session.user.role && session.user.role !== 'PUBLIC');
  const galleryMedia = extractGalleryMedia(article.contentHtml || '', article.thumbnailUrl);
  const galleryImages = extractGalleryImages(article.contentHtml || '', article.thumbnailUrl);
  const resolvedMedia = article.mediaItems && article.mediaItems.length > 0 ? article.mediaItems : galleryMedia;
  const articleWithImages = {
    ...article,
    category: article.category || { name: 'Ủy ban MTTQ xã' },
    author: article.author || { name: 'Ủy ban MTTQ Việt Nam xã Ea Súp', positionTitle: 'Cán bộ biên tập' },
    images: galleryImages,
    mediaItems: resolvedMedia,
  };
  const cleanContentHtml = stripGalleryFromHtml(article.contentHtml || '');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb điều hướng: Thu nhỏ và để sát nhau hơn, tránh bị che trên điện thoại */}
        <nav className="flex items-center flex-wrap gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs text-[#6B7C73] mb-4 sm:mb-6 leading-tight">
          <Link href="/" className="hover:text-[#1B4332] font-semibold transition-colors shrink-0">
            Trang chủ
          </Link>
          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D5CBBA] shrink-0" />
          <Link href="/#tin-tuc" className="hover:text-[#1B4332] font-semibold transition-colors shrink-0">
            Bản tin Mặt trận &amp; Đoàn thể
          </Link>
          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D5CBBA] shrink-0" />
          <span className="text-[#1B4332] font-bold shrink-0">
            {article.category?.name || 'Ủy ban MTTQ xã'}
          </span>
        </nav>

        {/* Thanh công cụ cán bộ: Sửa / Xóa bài trực tiếp */}
        {isStaff && session?.user && (
          <ArticleActionToolbar article={articleWithImages} user={session.user} />
        )}

        {/* Tòa soạn Báo điện tử chuyên nghiệp chuẩn @hallmark */}
        <div className="mb-10">
          <EditorialArticleView
            newsId={article.id}
            title={article.title}
            summary={article.summary}
            contentHtml={cleanContentHtml}
            mediaItems={resolvedMedia}
            categoryName={article.category?.name || 'Ủy ban MTTQ xã'}
            villageName={article.village?.name || null}
            authorName={article.author?.name || 'Ủy ban MTTQ Việt Nam xã Ea Súp'}
            authorPosition={article.author?.positionTitle || null}
            publishedAt={article.publishedAt || article.createdAt}
            viewCount={article.viewCount || 0}
            slug={article.slug}
            beneficiaryName={article.beneficiaryName || null}
          />
        </div>

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
                      {rel.category?.name || 'Bản tin'}
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

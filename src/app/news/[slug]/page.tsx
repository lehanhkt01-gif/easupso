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
  ArrowRight,
  Clock,
  User,
  ShieldCheck,
  Check,
  ChevronRight,
  Images,
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
        contentHtml: true,
        category: {
          select: {
            name: true,
          },
        },
        village: {
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
          contentHtml: a.contentHtml,
          category: a.category ? { name: a.category.name } : { name: 'Ủy ban MTTQ xã' },
          village: a.village ? { name: a.village.name } : null,
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

  // Tìm bản tin liền kề tiếp theo để tự động đọc liên tục khi hết bài
  let nextArticle: { id: string; title: string; slug: string; summary?: string | null } | null = null;
  try {
    const nextDb = await prisma.newsArticle.findFirst({
      where: {
        status: ArticleStatus.PUBLISHED,
        id: { not: article.id },
        ...(article.publishedAt ? { publishedAt: { lt: article.publishedAt } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, slug: true, summary: true },
    });
    if (nextDb) {
      nextArticle = nextDb;
    }
  } catch {}

  if (!nextArticle) {
    try {
      const { getLocalArticles } = await import('@/lib/local-news');
      const allArticles = await getLocalArticles();
      const currentIdx = allArticles.findIndex((a) => a.id === article.id || a.slug === article.slug);
      if (currentIdx !== -1 && currentIdx + 1 < allArticles.length) {
        nextArticle = {
          id: allArticles[currentIdx + 1].id,
          title: allArticles[currentIdx + 1].title,
          slug: allArticles[currentIdx + 1].slug,
          summary: allArticles[currentIdx + 1].summary,
        };
      } else if (allArticles.length > 1) {
        const other = allArticles.find((a) => a.id !== article.id && a.slug !== article.slug);
        if (other) {
          nextArticle = {
            id: other.id,
            title: other.title,
            slug: other.slug,
            summary: other.summary,
          };
        }
      }
    } catch {}
  }

  if (!nextArticle && relatedArticles.length > 0) {
    nextArticle = {
      id: relatedArticles[0].id,
      title: relatedArticles[0].title,
      slug: relatedArticles[0].slug,
      summary: relatedArticles[0].summary,
    };
  }

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
            authorPosition={null}
            publishedAt={article.publishedAt || article.createdAt}
            viewCount={article.viewCount || 0}
            slug={article.slug}
            beneficiaryName={article.beneficiaryName || null}
            nextArticle={nextArticle}
          />
        </div>

        {/* Bài viết liên quan */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <h3 className="text-xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#C85A32] rounded-full inline-block" />
              Bản tin cùng chuyên mục &amp; địa bàn
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => {
                const images = extractGalleryImages(rel.contentHtml || '', rel.thumbnailUrl);
                const imageCount = images.length || (rel.thumbnailUrl ? 1 : 0);
                const coverImage =
                  rel.thumbnailUrl ||
                  images[0] ||
                  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80';

                return (
                  <div
                    key={rel.id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#D5CBBA] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between relative"
                  >
                    <Link href={`/news/${rel.slug}`} className="flex flex-col h-full justify-between">
                      <div className="relative aspect-[16/10] w-full bg-stone-100 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={rel.title}
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
                              {rel.category?.name || 'Ủy ban MTTQ xã'}
                            </span>
                            {rel.village?.name && <span className="text-[#6B7C73]">{rel.village.name}</span>}
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-[#14211B] group-hover:text-[#1B4332] leading-snug line-clamp-2">
                            {rel.title}
                          </h4>
                          <p className="text-xs text-[#6B7C73] mt-2 line-clamp-2 leading-relaxed">
                            {rel.summary}
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

import { Header } from '@/components/layout/Header';
import { HeroBanner } from '@/components/home/HeroBanner';
import { EcosystemBentoGrid } from '@/components/home/EcosystemBentoGrid';
import { NewsroomSection } from '@/components/home/NewsroomSection';
import { Footer } from '@/components/layout/Footer';
import { prisma } from '@/lib/prisma';
import { ArticleStatus } from '@prisma/client';

export const revalidate = 30;

export default async function HomePage() {
  // Lấy dữ liệu song song từ PostgreSQL
  let announcements: Array<{
    id: string;
    title: string;
    content: string;
    linkUrl: string | null;
    isUrgent: boolean;
  }> = [];

  let initialArticles: any[] = [];
  let heroBannerUrl: string | null = null;

  try {
    const [fetchedAnnouncements, fetchedArticles, heroSetting] = await Promise.all([
      prisma.quickAnnouncement.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          linkUrl: true,
          isUrgent: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      prisma.newsArticle.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          thumbnailUrl: true,
          orgCode: true,
          isFeatured: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              badgeColor: true,
            },
          },
          village: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 9,
      }),

      prisma.siteSetting.findUnique({
        where: { key: 'HERO_BANNER_IMAGE_URL' },
      }),
    ]);

    announcements = fetchedAnnouncements;
    initialArticles = fetchedArticles;
    if (heroSetting?.value) {
      heroBannerUrl = heroSetting.value;
    }
  } catch (error) {
    console.warn('[HOMEPAGE_FETCH_WARN] Kết nối DB chưa hoàn tất hoặc dữ liệu trống:', error);
  }

  // Nếu DB chưa có, lấy từ file cấu hình cục bộ bền vững
  if (!heroBannerUrl) {
    const { getLocalSiteSetting } = await import('@/lib/site-settings');
    const localSetting = await getLocalSiteSetting('HERO_BANNER_IMAGE_URL');
    if (localSetting) {
      heroBannerUrl = localSetting;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] relative overflow-x-clip">
      {/* Hình nền toàn cảnh Ea Súp trải dài xuống suốt trang web với lớp phủ mềm mại */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-top bg-no-repeat opacity-[0.15] transition-all duration-700"
        style={{
          backgroundImage: `url('${heroBannerUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85'}')`,
        }}
      />
      {/* Lớp phủ mềm để bảo đảm chữ và nội dung luôn sắc nét, dễ đọc */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#FAF7F2]/80 backdrop-blur-[1px]" />

      {/* Nội dung trang */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 1. Header định danh chính thức */}
        <Header />

        {/* 2. Hero Banner & Dải Ticker Thông báo */}
        <HeroBanner initialAnnouncements={announcements} heroImageUrl={heroBannerUrl} />

        {/* 3. Trung tâm điều hành & 06 Ứng dụng số cốt lõi */}
        <EcosystemBentoGrid />

        {/* 4. Bản tin hoạt động Mặt trận & Các đoàn thể - 20 thôn buôn */}
        <NewsroomSection initialArticles={initialArticles} />

        {/* 5. Chân trang Footer chính thức */}
        <Footer />
      </div>
    </div>
  );
}

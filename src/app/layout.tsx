import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: 'Hệ sinh thái số xã Ea Súp — Cổng thông tin easupso.com',
  description:
    'Cổng thông tin & Trang chủ Hệ sinh thái Chuyển đổi số xã Ea Súp, tỉnh Đắk Lắk. Cơ quan chủ quản: Ủy ban MTTQ Việt Nam xã Ea Súp chủ trì phối hợp cùng Đảng ủy, HĐND, UBND và các đoàn thể.',
  keywords: [
    'Ea Súp',
    'easupso.com',
    'Mặt trận Ea Súp',
    'Chuyển đổi số Ea Súp',
    'Đắk Lắk',
    '20 thôn buôn Ea Súp',
    'Lịch công tác Ea Súp',
    'Ý kiến cử tri Ea Súp',
    'Nông nghiệp Ea Súp',
    'Du lịch Ea Súp',
    'Hội Cựu chiến binh Ea Súp',
  ],
  authors: [{ name: 'Ủy ban MTTQ Việt Nam xã Ea Súp' }],
  metadataBase: new URL('https://easupso.com'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo-easup.png', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png' },
      { url: '/images/logo-easup.png' },
    ],
  },
  openGraph: {
    title: 'Hệ sinh thái số xã Ea Súp — Cổng thông tin easupso.com',
    description: 'Chính quyền số phục vụ – Mặt trận số gần dân – Kinh tế số bền vững trên địa bàn 20 thôn, buôn xã Ea Súp.',
    url: 'https://easupso.com',
    siteName: 'easupso.com',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/images/og-share.png',
        width: 1200,
        height: 630,
        alt: 'Cổng thông tin & Hệ sinh thái Chuyển đổi số xã Ea Súp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hệ sinh thái số xã Ea Súp — Cổng thông tin easupso.com',
    description: 'Chính quyền số phục vụ – Mặt trận số gần dân – Kinh tế số bền vững trên địa bàn 20 thôn, buôn xã Ea Súp.',
    images: ['/images/og-share.png'],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1B4332',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#FAF7F2] text-[#14211B] min-h-screen flex flex-col selection:bg-[#C85A32] selection:text-white">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

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
  openGraph: {
    title: 'Hệ sinh thái số xã Ea Súp — easupso.com',
    description: 'Chính quyền số phục vụ – Mặt trận số gần dân – Kinh tế số bền vững trên địa bàn 20 thôn, buôn.',
    url: 'https://easupso.com',
    siteName: 'easupso.com',
    locale: 'vi_VN',
    type: 'website',
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
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-[#FAF7F2] text-[#14211B] min-h-screen flex flex-col selection:bg-[#C85A32] selection:text-white">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

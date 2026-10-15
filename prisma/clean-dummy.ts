import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

const DUMMY_SLUGS = [
  'ubmttq-xa-ea-sup-phat-dong-xoa-nha-tam-nam-2026',
  'hoi-nong-dan-ea-sup-canh-tac-lua-nuoc-ben-vung',
  'hoi-nong-dan-trien-khai-mo-hinh-canh-tac-lua-nuoc-thich-ung-bien-doi-khi-hau',
  'hoi-lhpn-trao-von-sinh-ke-buon-a-va-thon-8',
  'doan-thanh-nien-ra-quan-dich-vu-cong-so-thon-thang-loi',
  'hoi-ccb-trao-bo-giong-thon-doan-ket',
  'to-cong-nghe-so-cong-dong-buon-b-phat-huy-hieu-qua',
  'to-cnsdc-buon-b-phat-huy-hieu-qua-cau-noi-thong-tin-so',
];

const DUMMY_IDS = ['art-001', 'art-002', 'art-003', 'art-004', 'art-005', 'art-006'];

async function main() {
  console.log('🧹 BẮT ĐẦU DỌN DẸP BẢN TIN MẪU KHỞI TẠO...');

  // 1. Xóa trong PostgreSQL
  try {
    const res = await prisma.newsArticle.deleteMany({
      where: {
        OR: [
          { slug: { in: DUMMY_SLUGS } },
          { id: { in: DUMMY_IDS } },
        ],
      },
    });
    console.log(`✅ Đã xóa ${res.count} bản tin mẫu khỏi CSDL PostgreSQL.`);
  } catch (err: any) {
    console.warn('⚠️ Lỗi khi xóa từ CSDL:', err?.message);
  }

  // 2. Xóa trong public/local-articles.json
  const filePaths = [
    path.join(process.cwd(), 'public', 'local-articles.json'),
    path.join('/tmp', 'local-articles.json'),
  ];

  for (const fp of filePaths) {
    try {
      const raw = await fs.readFile(fp, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const cleanList = list.filter(
          (a) => !DUMMY_SLUGS.includes(a.slug) && !DUMMY_IDS.includes(a.id)
        );
        await fs.writeFile(fp, JSON.stringify(cleanList, null, 2), 'utf-8');
        console.log(`✅ Đã làm sạch ${fp} (còn lại ${cleanList.length} bài viết).`);
      }
    } catch {}
  }

  console.log('🎉 HOÀN TẤT DỌN DẸP TOÀN BỘ BẢN TIN ẢO BAN ĐẦU!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

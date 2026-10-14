import { PrismaClient, Role, OrgCode, ArticleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- KHỞI TẠO NẠP DỮ LIỆU BAN ĐẦU CỔNG THÔNG TIN EASUPSO.COM ---');

  // 1. NẠP 20 THÔN, BUÔN KHÓA CỨNG
  console.log('1. Nạp danh mục 20 thôn, buôn xã Ea Súp...');
  const villagesData = [
    // 13 Thôn số
    { code: 'THON_01', name: 'Thôn 1', type: 'THON_SO', leaderName: 'Nguyễn Văn Hải', phone: '0943 170 770' },
    { code: 'THON_02', name: 'Thôn 2', type: 'THON_SO', leaderName: 'Trần Đình Trọng', phone: '0943 170 770' },
    { code: 'THON_03', name: 'Thôn 3', type: 'THON_SO', leaderName: 'Lê Văn Nam', phone: '0943 170 770' },
    { code: 'THON_04', name: 'Thôn 4', type: 'THON_SO', leaderName: 'Phạm Văn Dũng', phone: '0943 170 770' },
    { code: 'THON_05', name: 'Thôn 5', type: 'THON_SO', leaderName: 'Vũ Đức Thịnh', phone: '0943 170 770' },
    { code: 'THON_06', name: 'Thôn 6', type: 'THON_SO', leaderName: 'Hoàng Văn Thắng', phone: '0943 170 770' },
    { code: 'THON_07', name: 'Thôn 7', type: 'THON_SO', leaderName: 'Đỗ Văn Thành', phone: '0943 170 770' },
    { code: 'THON_08', name: 'Thôn 8', type: 'THON_SO', leaderName: 'Ngô Quốc Bảo', phone: '0943 170 770' },
    { code: 'THON_09', name: 'Thôn 9', type: 'THON_SO', leaderName: 'Bùi Thế Hiển', phone: '0943 170 770' },
    { code: 'THON_10', name: 'Thôn 10', type: 'THON_SO', leaderName: 'Đinh Công Toàn', phone: '0943 170 770' },
    { code: 'THON_11', name: 'Thôn 11', type: 'THON_SO', leaderName: 'Nguyễn Tiến Dũng', phone: '0943 170 770' },
    { code: 'THON_12', name: 'Thôn 12', type: 'THON_SO', leaderName: 'Lê Hữu Đạt', phone: '0943 170 770' },
    { code: 'THON_13', name: 'Thôn 13', type: 'THON_SO', leaderName: 'Trương Minh Đức', phone: '0943 170 770' },

    // 04 Thôn tên
    { code: 'THON_THANG_LOI', name: 'Thôn Thắng Lợi', type: 'THON_TEN', leaderName: 'Nguyễn Văn Thắng', phone: '0943 170 770' },
    { code: 'THON_DOAN_KET', name: 'Thôn Đoàn Kết', type: 'THON_TEN', leaderName: 'Lê Đoàn Kết', phone: '0943 170 770' },
    { code: 'THON_HOA_BINH', name: 'Thôn Hòa Bình', type: 'THON_TEN', leaderName: 'Phan Thanh Bình', phone: '0943 170 770' },
    { code: 'THON_BINH_LOI', name: 'Thôn Bình Lợi', type: 'THON_TEN', leaderName: 'Trần Văn Lợi', phone: '0943 170 770' },

    // 03 Buôn
    { code: 'BUON_A', name: 'Buôn A', type: 'BUON', leaderName: 'Y Klơng Niê', phone: '0943 170 770' },
    { code: 'BUON_B', name: 'Buôn B', type: 'BUON', leaderName: 'Y Dju Mđoh', phone: '0943 170 770' },
    { code: 'BUON_C', name: 'Buôn C', type: 'BUON', leaderName: 'Ama H’Nhi', phone: '0943 170 770' },
  ];

  const villageMap = new Map<string, string>();
  for (const v of villagesData) {
    const created = await prisma.village.upsert({
      where: { code: v.code },
      update: { leaderName: v.leaderName, phone: v.phone },
      create: v,
    });
    villageMap.set(v.code, created.id);
  }
  console.log(`-> Đã nạp thành công 20 thôn buôn.`);

  // 2. NẠP DANH SÁCH CÁN BỘ CƠ QUAN
  console.log('2. Nạp tài khoản cán bộ nhận diện quyền Google OAuth...');
  const usersData = [
    {
      name: 'Lê Hạnh (Quản trị viên Cấp cao)',
      email: 'lehanhkt01@gmail.com',
      positionTitle: 'Quản trị viên Hệ thống Cấp cao (Super Admin)',
      role: Role.SUPER_ADMIN,
      orgCode: OrgCode.MTTQ,
      passwordHash: '8b365851d087b7a77d4cbe34e0ff9df5:7b85f2619bbbe8b2e357fe1a556852bb07efd9c198ce216c59b66236b286da028df41a6b0c2aeb3df16ff25bb9cf88ef4a44f509e5bbf6bc295c5c9aa48d614d',
    },
    {
      name: 'Lê Hồng Hạnh',
      email: 'lehonghanh@easupso.com',
      positionTitle: 'Ủy viên BTV Đảng ủy, Bí thư Chi bộ, Chủ tịch UBMTTQ Việt Nam xã Ea Súp',
      role: Role.EXECUTIVE,
      orgCode: OrgCode.MTTQ,
      passwordHash: '8b365851d087b7a77d4cbe34e0ff9df5:7b85f2619bbbe8b2e357fe1a556852bb07efd9c198ce216c59b66236b286da028df41a6b0c2aeb3df16ff25bb9cf88ef4a44f509e5bbf6bc295c5c9aa48d614d',
    },
    {
      name: 'Nguyễn Thị Miên',
      email: 'Nguyenthimien3@gmail.com',
      positionTitle: 'UVBCH Đảng bộ xã, PCT Thường trực UBMTTQ, Chủ tịch Hội Nông dân xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.NONG_DAN,
    },
    {
      name: "H' Bun Mi Siu",
      email: 'bunmisiu@gmail.com',
      positionTitle: 'UVBCH Đảng bộ xã, PCT UBMTTQ, Chủ tịch Hội LHPN xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.PHU_NU,
    },
    {
      name: 'Đặng Văn Tình',
      email: 'Dangvantinht@gmail.com',
      positionTitle: 'UVBCH Đảng bộ xã, Bí thư Đoàn TNCS Hồ Chí Minh xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.DOAN_TN,
    },
    {
      name: 'Đặng Trung Hiếu',
      email: 'trunghieuktkt@gmail.com',
      positionTitle: 'UVBCH Đảng bộ xã, Chủ tịch Hội Cựu chiến binh xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.CCB,
    },
    // Chuyên viên cơ quan
    {
      name: 'Lê Xuân Cường',
      email: 'Cuong0989249086@gmail.com',
      positionTitle: 'Chuyên viên Khối Mặt trận - Đoàn thể xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.MTTQ,
    },
    {
      name: 'Hà Văn Chiến',
      email: 'huuchien22383@gmail.com',
      positionTitle: 'Chuyên viên Ban Thường trực UBMTTQ xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.MTTQ,
    },
    {
      name: 'Quách Minh Tuấn',
      email: 'quachtuandctdv@gmail.com',
      positionTitle: 'Chuyên viên Văn phòng Đảng ủy - Khối Dân vận xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.MTTQ,
    },
    {
      name: 'Ngô Thị Hồng Xuân',
      email: 'Ngohongxuan81@gmail.com',
      positionTitle: 'Chuyên viên Ban Thường trực UBMTTQ xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.MTTQ,
    },
    {
      name: 'Hiền',
      email: 'violetvatoi@gmail.com',
      positionTitle: 'Chuyên viên Kế toán Quỹ Vì người nghèo xã',
      role: Role.SPECIALIST,
      orgCode: OrgCode.MTTQ,
    },
  ];

  const userMap = new Map<string, string>();
  for (const u of usersData) {
    const createdUser = await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        positionTitle: u.positionTitle,
        role: u.role,
        orgCode: u.orgCode,
        isActive: true,
        ...(u.passwordHash ? { passwordHash: u.passwordHash } : {}),
      },
      create: {
        name: u.name,
        email: u.email.toLowerCase(),
        positionTitle: u.positionTitle,
        role: u.role,
        orgCode: u.orgCode,
        isActive: true,
        passwordHash: u.passwordHash || null,
      },
    });
    userMap.set(u.email, createdUser.id);
  }
  console.log(`-> Đã nạp thành công ${usersData.length} tài khoản cán bộ lãnh đạo & chuyên viên.`);

  // 3. NẠP 5 PHÂN HỆ CỐT LÕI + PHÂN HỆ MỞ RỘNG
  console.log('3. Nạp danh mục 5 WebApps cốt lõi + 1 phân hệ mở rộng...');
  const appsData = [
    {
      slug: 'lichcongtac',
      name: 'Lịch Công Tác Số',
      subdomainUrl: 'https://lichcongtac.easupso.com',
      shortDescription: 'Lịch họp, lịch tiếp dân và hoạt động điều hành của Thường trực Đảng ủy, HĐND, UBND, UBMTTQVN xã Ea Súp.',
      badgeText: 'Điều Hành Số',
      iconName: 'CalendarDays',
      bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
      ctaPrimaryText: 'Xem Lịch Tuần Này',
      ctaSecondaryText: 'Đăng ký phòng họp',
      ctaSecondaryUrl: 'https://lichcongtac.easupso.com/booking',
      displayOrder: 1,
      isOnline: true,
      liveMetricsJson: { totalMeetingsWeek: 18, publicReceptions: 2, activeDelegations: 4 },
    },
    {
      slug: 'ykien',
      name: 'Tiếng Nói Cử Tri & Phản Ánh Hiện Trường',
      subdomainUrl: 'https://ykien.easupso.com',
      shortDescription: 'Cổng tiếp nhận tâm tư, phản ánh hiện trường có gắn định vị GIS của nhân dân 20 thôn, buôn gửi đến Mặt trận và Chính quyền xã.',
      badgeText: 'Dân Biết - Dân Bàn',
      iconName: 'MessageSquareText',
      bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-8',
      ctaPrimaryText: 'Gửi Ý Kiến Ngay',
      ctaSecondaryText: 'Tra cứu xử lý phản ánh',
      ctaSecondaryUrl: 'https://ykien.easupso.com/tra-cuu',
      displayOrder: 2,
      isOnline: true,
      liveMetricsJson: { receivedPetitions: 142, resolvedRate: '94.2%', avgProcessingDays: 2.1 },
    },
    {
      slug: 'nongnghiep',
      name: 'Nông Nghiệp Số & Sàn Nông Sản Ea Súp',
      subdomainUrl: 'https://nongnghiep.easupso.com',
      shortDescription: 'Cập nhật giá lúa nước, xoài Cát Chu, điều cao sản, mắc ca và bản tin thời tiết nông vụ, cảnh báo sâu bệnh cho bà con nông dân.',
      badgeText: 'Kinh Tế Nông Nghiệp',
      iconName: 'Sprout',
      bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
      ctaPrimaryText: 'Bảng Giá Nông Sản',
      ctaSecondaryText: 'Đăng ký nông sản OCOP',
      ctaSecondaryUrl: 'https://nongnghiep.easupso.com/dang-ky-ocop',
      displayOrder: 3,
      isOnline: true,
      liveMetricsJson: { trackedCrops: 12, dailyPriceUpdates: '100%', certifiedFarmers: 380 },
    },
    {
      slug: 'dulich',
      name: 'Du Lịch, Di Tích & Văn Hóa Ea Súp',
      subdomainUrl: 'https://dulich.easupso.com',
      shortDescription: 'Khám phá tháp Chăm cổ Yang Prông thế kỷ XIII, thắng cảnh hồ Ea Súp Thượng, văn hóa cồng chiêng và ẩm thực truyền thống địa phương.',
      badgeText: 'Di Sản & Khám Phá',
      iconName: 'Compass',
      bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
      ctaPrimaryText: 'Khám Phá Di Tích',
      ctaSecondaryText: 'Bản đồ du lịch buôn làng',
      ctaSecondaryUrl: 'https://dulich.easupso.com/ban-do',
      displayOrder: 4,
      isOnline: true,
      liveMetricsJson: { heritageSites: 6, culturalEvents: 8, annualVisitors: '25.000+' },
    },
    {
      slug: 'ccb',
      name: 'Hội Cựu Chiến Binh Xã Ea Súp',
      subdomainUrl: 'https://ccb.easupso.com',
      shortDescription: 'Trang thông tin điều hành nghiệp vụ, gương sáng cựu chiến binh làm kinh tế giỏi, nghĩa tình đồng đội và đường dây nóng hỗ trợ hội viên.',
      badgeText: 'Nghĩa Tình Đồng Đội',
      iconName: 'ShieldCheck',
      bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4',
      ctaPrimaryText: 'Bản Tin CCB',
      ctaSecondaryText: 'Hotline 0943 170 770',
      ctaSecondaryUrl: 'tel:0943170770',
      displayOrder: 5,
      isOnline: true,
      liveMetricsJson: { branchesCount: 20, activeMembers: 654, solidarityFunds: '1.2 Tỷ VNĐ' },
    },
    {
      slug: 'vinguoingheo',
      name: 'Quỹ Vì Người Nghèo & An Sinh Xã Hội',
      subdomainUrl: 'https://vinguoingheo.easupso.com',
      shortDescription: 'Minh bạch nguồn lực xã hội hóa, sao kê thời gian thực Quỹ Vì người nghèo và chương trình xóa nhà tạm, nhà dột nát do Mặt trận xã điều phối.',
      badgeText: 'Đại Đoàn Kết',
      iconName: 'HeartHandshake',
      bentoSpan: 'col-span-12 md:col-span-12 lg:col-span-12',
      ctaPrimaryText: 'Xem Sao Kê Minh Bạch',
      ctaSecondaryText: 'Ủng hộ Quỹ Vì Người Nghèo',
      ctaSecondaryUrl: 'https://vinguoingheo.easupso.com/ung-ho',
      displayOrder: 6,
      isOnline: true,
      liveMetricsJson: { totalFundsMobilized: '850 Triệu VNĐ', newSolidarityHouses: 14, beneficiaryFamilies: 128 },
    },
  ];

  for (const app of appsData) {
    await prisma.ecosystemApp.upsert({
      where: { slug: app.slug },
      update: app,
      create: app,
    });
  }
  console.log(`-> Đã nạp thành công 6 phân hệ WebApps.`);

  // 4. NẠP 7 CHUYÊN MỤC BẢN TIN
  console.log('4. Nạp danh mục 7 chuyên mục bản tin...');
  const categoriesData = [
    { slug: 'mat-tran-to-quoc', name: 'Ủy ban MTTQ xã', orgCode: OrgCode.MTTQ, badgeColor: 'forest', displayOrder: 1 },
    { slug: 'hoi-phu-nu', name: 'Hội Liên hiệp Phụ nữ', orgCode: OrgCode.PHU_NU, badgeColor: 'basalt', displayOrder: 2 },
    { slug: 'hoi-nong-dan', name: 'Hội Nông dân', orgCode: OrgCode.NONG_DAN, badgeColor: 'forest', displayOrder: 3 },
    { slug: 'doan-thanh-nien', name: 'Đoàn TNCS Hồ Chí Minh', orgCode: OrgCode.DOAN_TN, badgeColor: 'basalt', displayOrder: 4 },
    { slug: 'hoi-cuu-chien-binh', name: 'Hội Cựu chiến binh', orgCode: OrgCode.CCB, badgeColor: 'forest', displayOrder: 5 },
    { slug: 'hoat-dong-thon-buon', name: 'Hoạt động 20 Thôn Buôn', orgCode: OrgCode.THON_BUON, badgeColor: 'basalt', displayOrder: 6 },
    { slug: 'chuyen-doi-so', name: 'Chuyển đổi số & Bình dân học vụ số', orgCode: OrgCode.MTTQ, badgeColor: 'gold', displayOrder: 7 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const createdCat = await prisma.newsCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, createdCat.id);
  }
  console.log(`-> Đã nạp thành công 7 chuyên mục tin.`);

  // 5. NẠP 6 BẢN TIN HOẠT ĐỘNG THỰC TẾ
  console.log('5. Nạp 6 bản tin hoạt động mẫu sát thực tế...');
  const authorId = userMap.get('lehonghanh@easupso.com') || Array.from(userMap.values())[0];
  const approverId = authorId;

  const articlesData = [
    {
      title: 'UBMTTQ Việt Nam xã Ea Súp phát động phong trào "Chung tay xóa nhà tạm, nhà dột nát" năm 2026',
      slug: 'ubmttq-xa-ea-sup-phat-dong-xoa-nha-tam-nam-2026',
      summary: 'Ban Thường trực Ủy ban MTTQ Việt Nam xã Ea Súp kêu gọi các cơ quan, đơn vị, doanh nghiệp và các tầng lớp nhân dân đồng lòng ủng hộ, phấn đấu hoàn thành xây mới 15 căn nhà Đại đoàn kết trong năm 2026.',
      contentHtml: `<p>Sáng nay, tại Hội trường UBND xã Ea Súp, Ban Thường trực Ủy ban MTTQ Việt Nam xã Ea Súp đã chủ trì tổ chức Lễ phát động phong trào thi đua “Chung tay xóa nhà tạm, nhà dột nát” trên địa bàn 20 thôn, buôn.</p><p>Phát biểu chỉ đạo, đồng chí Lê Hồng Hạnh - Ủy viên Ban Thường vụ Đảng ủy, Chủ tịch Ủy ban MTTQ Việt Nam xã nhấn mạnh: "Mỗi ngôi nhà Đại đoàn kết được xây dựng không chỉ là mái ấm che mưa nắng, mà còn là kết tinh của tình làng nghĩa xóm, niềm tin của đồng bào vào sự lãnh đạo của Đảng và chính quyền xã."</p><p>Tại buổi lễ, các cơ quan, doanh nghiệp và các nhà hảo tâm đã trực tiếp ủng hộ và đăng ký ủng hộ vào Quỹ Vì người nghèo xã số tiền hơn 280 triệu đồng.</p>`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      categoryId: categoryMap.get('mat-tran-to-quoc')!,
      villageId: villageMap.get('THON_THANG_LOI'),
      orgCode: OrgCode.MTTQ,
      isFeatured: true,
      viewCount: 428,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Hội Nông dân xã Ea Súp triển khai mô hình canh tác lúa nước bền vững thích ứng biến đổi khí hậu',
      slug: 'hoi-nong-dan-ea-sup-canh-tac-lua-nuoc-ben-vung',
      summary: 'Mô hình liên kết sản xuất lúa chất lượng cao kết hợp phân bón hữu cơ vi sinh được triển khai thí điểm tại cánh đồng Thôn 1 và Thôn 2 với diện tích hơn 40 ha.',
      contentHtml: `<p>Nhằm nâng cao giá trị hạt gạo Ea Súp và giảm thiểu chi phí vật tư nông nghiệp, Hội Nông dân xã Ea Súp vừa phối hợp cùng Trạm Khuyến nông tổ chức hội thảo đầu bờ mô hình canh tác lúa nước bền vững.</p><p>Chủ tịch Hội Nông dân xã Nguyễn Thị Miên cho biết: "Thông qua chuyển đổi số nông nghiệp trên nền tảng easupso.com, bà con được theo dõi sát sao tình hình sâu bệnh, thời tiết và giá thu mua hàng ngày của các hợp tác xã liên kết."</p>`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
      categoryId: categoryMap.get('hoi-nong-dan')!,
      villageId: villageMap.get('THON_01'),
      orgCode: OrgCode.NONG_DAN,
      isFeatured: true,
      viewCount: 312,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000),
    },
    {
      title: 'Hội LHPN xã Ea Súp trao vốn sinh kế phụ nữ nghèo khởi nghiệp tại Buôn A và Thôn 8',
      slug: 'hoi-lhpn-trao-von-sinh-ke-buon-a-va-thon-8',
      summary: '5 hội viên phụ nữ có hoàn cảnh khó khăn tại Buôn A và Thôn 8 đã được Hội LHPN xã trao nguồn vốn vay ưu đãi không lãi suất để mua dê giống và cây ăn trái phát triển kinh tế.',
      contentHtml: `<p>Chiều qua, Hội LHPN xã Ea Súp đã tiến hành trao vốn sinh kế hỗ trợ phụ nữ nghèo khởi sự kinh doanh. Tham dự có đồng chí H' Bun Mi Siu - Phó Chủ tịch UBMTTQ, Chủ tịch Hội LHPN xã.</p><p>Mỗi hộ gia đình được hỗ trợ vay 15 triệu đồng từ nguồn quỹ xoay vòng sinh kế của Hội, đồng thời được cán bộ nông nghiệp xã hướng dẫn kỹ thuật chuồng trại.</p>`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
      categoryId: categoryMap.get('hoi-phu-nu')!,
      villageId: villageMap.get('BUON_A'),
      orgCode: OrgCode.PHU_NU,
      isFeatured: false,
      viewCount: 195,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000),
    },
    {
      title: 'Đoàn Thanh niên xã ra quân "Ngày thứ Bảy tình nguyện" hướng dẫn dịch vụ công số tại Thôn Thắng Lợi',
      slug: 'doan-thanh-nien-ra-quan-dich-vu-cong-so-thon-thang-loi',
      summary: 'Đoàn viên thanh niên xã Ea Súp đã trực tiếp đến nhà văn hóa Thôn Thắng Lợi để hỗ trợ trên 70 lượt người dân kích hoạt VNeID và tra cứu thông tin trên Cổng easupso.com.',
      contentHtml: `<p>Thực hiện chương trình xung kích tình nguyện vì cuộc sống cộng đồng, Đoàn TNCS Hồ Chí Minh xã Ea Súp do Bí thư Đoàn Đặng Văn Tình chủ trì đã tổ chức ngày hội Bình dân học vụ số tại Thôn Thắng Lợi.</p><p>Đội hình thanh niên số đã hướng dẫn bà con đăng ký tài khoản dịch vụ công, nộp hồ sơ trực tuyến và gửi phản ánh hiện trường qua Cổng thông tin xã.</p>`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      categoryId: categoryMap.get('doan-thanh-nien')!,
      villageId: villageMap.get('THON_THANG_LOI'),
      orgCode: OrgCode.DOAN_TN,
      isFeatured: false,
      viewCount: 240,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 259200000),
    },
    {
      title: 'Hội Cựu chiến binh xã Ea Súp trao tặng cặp bò giống cho hội viên có hoàn cảnh khó khăn tại Thôn Đoàn Kết',
      slug: 'hoi-ccb-trao-bo-giong-thon-doan-ket',
      summary: 'Chương trình “Nghĩa tình đồng đội” của Hội CCB xã tiếp tục nhân rộng mô hình chăn nuôi sinh sản, giúp gia đình hội viên vươn lên thoát nghèo bền vững.',
      contentHtml: `<p>Sáng ngày 12/10, Thường trực Hội Cựu chiến binh xã Ea Súp do đồng chí Đặng Trung Hiếu - Chủ tịch Hội dẫn đầu đã đến trao tặng cặp bò giống trị giá 22 triệu đồng cho gia đình cựu chiến binh thương binh tại Thôn Đoàn Kết.</p><p>Nguồn kinh phí do hội viên 20 chi hội CCB toàn xã tự nguyện đóng góp xây dựng quỹ giúp nhau xóa đói giảm nghèo.</p>`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80',
      categoryId: categoryMap.get('hoi-cuu-chien-binh')!,
      villageId: villageMap.get('THON_DOAN_KET'),
      orgCode: OrgCode.CCB,
      isFeatured: false,
      viewCount: 184,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 345600000),
    },
    {
      title: 'Tổ Công nghệ số cộng đồng Buôn B phát huy hiệu quả cầu nối thông tin số đến từng bếp lửa',
      slug: 'to-cong-nghe-so-cong-dong-buon-b-phat-huy-hieu-qua',
      summary: 'Các thành viên Tổ CNSCĐ Buôn B tích cực phối hợp cùng Ban Tự quản buôn đưa tin tức, cảnh báo thời tiết và các chủ trương chính sách đến từng hộ đồng bào dân tộc thiểu số.',
      contentHtml: `<p>Tại Buôn B, Tổ công nghệ số cộng đồng đã phối hợp chặt chẽ cùng Già làng và Trưởng buôn ứng dụng điện thoại thông minh để phổ biến bản tin Mặt trận và dịch vụ công xã Ea Súp.</p><p>Đến nay, hơn 85% hộ gia đình trong buôn đã có thể tra cứu thông tin giá nông sản và phản ánh kiến nghị trực tiếp lên chính quyền xã thông qua cổng điện tử.</p>`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      categoryId: categoryMap.get('chuyen-doi-so')!,
      villageId: villageMap.get('BUON_B'),
      orgCode: OrgCode.MTTQ,
      isFeatured: true,
      viewCount: 278,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 432000000),
    },
  ];

  for (const art of articlesData) {
    await prisma.newsArticle.upsert({
      where: { slug: art.slug },
      update: {
        ...art,
        authorId,
        approvedById: approverId,
      },
      create: {
        ...art,
        authorId,
        approvedById: approverId,
      },
    });
  }
  console.log(`-> Đã nạp thành công 6 bản tin hoạt động mẫu.`);

  // 6. NẠP 2 THÔNG BÁO KHẨN / TICKER BAR
  console.log('6. Nạp thông báo Ticker bar trang chủ...');
  const announcementsData = [
    {
      title: 'Lịch tiếp công dân định kỳ của Thường trực Đảng ủy - HĐND - UBND - UBMTTQVN xã Ea Súp',
      content: 'Thường trực Đảng ủy, HĐND, UBND và Ban Thường trực UBMTTQ Việt Nam xã Ea Súp tiếp công dân định kỳ vào Thứ Tư hàng tuần tại Phòng Tiếp công dân Trụ sở cơ quan xã Ea Súp.',
      linkUrl: 'https://lichcongtac.easupso.com',
      isUrgent: false,
      isActive: true,
    },
    {
      title: 'Kêu gọi toàn dân ủng hộ Quỹ "Vì người nghèo" và Chương trình xóa nhà tạm năm 2026',
      content: 'UBMTTQ Việt Nam xã Ea Súp trân trọng kêu gọi nhân dân, các nhà hảo tâm cùng chung tay đóng góp Quỹ Vì người nghèo xã Ea Súp. Mọi khoản đóng góp đều được công khai minh bạch thời gian thực.',
      linkUrl: 'https://vinguoingheo.easupso.com',
      isUrgent: true,
      isActive: true,
    },
  ];

  for (const item of announcementsData) {
    const existing = await prisma.quickAnnouncement.findFirst({
      where: { title: item.title },
    });
    if (!existing) {
      await prisma.quickAnnouncement.create({ data: item });
    }
  }
  console.log(`-> Đã nạp thành công 2 thông báo Ticker bar.`);

  console.log('=== HOÀN TẤT NẠP DỮ LIỆU BAN ĐẦU (SEEDING COMPLETED) ===');
}

main()
  .catch((e) => {
    console.error('Lỗi khi nạp dữ liệu seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

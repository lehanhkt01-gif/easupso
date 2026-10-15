# AGENTS.md — MỎ NEO NGỮ CẢNH HỆ THỐNG CỔNG THÔNG TIN EASUPSO.COM

> **Dự án**: Cổng thông tin & Trang chủ Hệ sinh thái Chuyển đổi số xã Ea Súp, tỉnh Đắk Lắk  
> **Tên miền chính thức**: [https://easupso.com](https://easupso.com)  
> **Cơ quan chủ quản**: Ủy ban Mặt trận Tổ quốc Việt Nam xã Ea Súp chủ trì, phối hợp cùng Đảng ủy, HĐND, UBND và các tổ chức chính trị - xã hội xã Ea Súp, tỉnh Đắk Lắk.  
> **Đường dây nóng**: 0943 170 770 | **Email**: noreply@easupso.com

---

## 1. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (ARCHITECTURE OVERVIEW)

Cổng thông tin trung tâm `easupso.com` giữ vai trò làm đầu mối định danh tập trung (SSO/NextAuth), điều phối cổng giao tiếp, cung cấp trang chủ hợp nhất và điều hướng người dân, cán bộ đến 5 phân hệ chuyên sâu cùng phân hệ mở rộng:

```
                                 [NGƯỜI DÂN / CÁN BỘ / DU KHÁCH]
                                                │
                                    (HTTPS: easupso.com)
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │   NGINX REVERSE PROXY & SECURITY GATEWAY    │
                         │ (SSL / Gzip / Rate Limit / Security Headers) │
                         └──────────────────────┬───────────────────────┘
                                                │
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │     EASUPSO PORTAL WEB (Next.js 15 Standalone)│
                         │   - App Router, React 19, Tailwind CSS       │
                         │   - Unified Auth Hub (Google OAuth / RBAC)   │
                         │   - Cổng tin tức, dịch vụ công, tra cứu      │
                         └──────────────────────┬───────────────────────┘
                                                │
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │  POSTGRESQL 16 (Private easupso_internal_net)│
                         │   - Prisma ORM Data Layer (Port 5432 nội bộ) │
                         └──────────────────────────────────────────────┘
                                                │
            ┌───────────────────────────────────┼───────────────────────────────────┐
            │                                   │                                   │
            ▼                                   ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐           ┌───────────────────────┐
│ 1. LỊCH CÔNG TÁC      │           │ 2. Ý KIẾN CỬ TRI      │           │ 3. NÔNG NGHIỆP SỐ     │
│ lichcongtac.easupso.com│           │ ykien.easupso.com     │           │ nongnghiep.easupso.com│
└───────────────────────┘           └───────────────────────┘           └───────────────────────┘
            │                                   │                                   │
            ▼                                   ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐           ┌───────────────────────┐
│ 4. DU LỊCH & VĂN HÓA  │           │ 5. HỘI CỰU CHIẾN BINH │           │ 6. VÌ NGƯỜI NGHÈO     │
│ dulich.easupso.com    │           │ ccb.easupso.com       │           │ vinguoingheo.easupso.com│
└───────────────────────┘           └───────────────────────┘           └───────────────────────┘
```

### Danh mục phân hệ kết nối:
1. **Lịch công tác**: `https://lichcongtac.easupso.com` — Lịch họp, sự kiện điều hành của Đảng ủy, HĐND, UBND, UBMTTQVN xã.
2. **Ý kiến cử tri & Phản ánh**: `https://ykien.easupso.com` — Tiếp nhận tâm tư, kiến nghị của nhân dân 20 thôn buôn.
3. **Nông nghiệp số**: `https://nongnghiep.easupso.com` — Giá nông sản Ea Súp (lúa nước, xoài cát, điều, mắc ca), khuyến nông, thời tiết nông vụ.
4. **Du lịch & Văn hóa**: `https://dulich.easupso.com` — Tháp Yang Prông, hồ Ea Súp Thượng, bản sắc cồng chiêng và lễ hội buôn làng.
5. **Hội Cựu chiến binh**: `https://ccb.easupso.com` — Hoạt động truyền thống, nghĩa tình đồng đội, gương sáng cựu chiến binh Ea Súp.
6. **Vì người nghèo (Mở rộng)**: `https://vinguoingheo.easupso.com` — Quỹ vì người nghèo, nhà đại đoàn kết, an sinh xã hội do UBMTTQVN xã điều phối.

---

## 2. QUY ƯỚC LẬP TRÌNH & NGUYÊN TẮC BẮT BUỘC (CONVENTIONS)

### 2.1. Địa giới hành chính & Bối cảnh địa phương:
- **Mô hình chính quyền 3 cấp**: Cấp xã trực thuộc tỉnh Đắk Lắk. **TUYỆT ĐỐI KHÔNG CÒN CẤP HUYỆN**. Không bao giờ sử dụng các cụm từ như *"Huyện Ea Súp"*, *"Huyện hội"*, *"UBND huyện"*.
- **Danh mục khóa cứng 20 thôn, buôn trực thuộc xã Ea Súp**:
  - **13 thôn số**: `Thôn 1`, `Thôn 2`, `Thôn 3`, `Thôn 4`, `Thôn 5`, `Thôn 6`, `Thôn 7`, `Thôn 8`, `Thôn 9`, `Thôn 10`, `Thôn 11`, `Thôn 12`, `Thôn 13`.
  - **04 thôn tên**: `Thôn Thắng Lợi`, `Thôn Đoàn Kết`, `Thôn Hòa Bình`, `Thôn Bình Lợi`.
  - **03 buôn**: `Buôn A`, `Buôn B`, `Buôn C`.

### 2.2. Triết lý thiết kế UI/UX (@hallmark):
- **Bảng màu di sản Tây Nguyên**:
  - Nền kem di sản (Heritage Cream): `#FAF7F2` (tạo cảm giác trang nghiêm, ấm áp, văn bản hành chính truyền thống).
  - Xanh rừng Ea Súp (Forest Green): `#1B4332` (đại diện cho thiên nhiên, rừng khộp và nông nghiệp trù phú).
  - Đỏ đất bazan (Basalt Red): `#C85A32` (sắc màu đất đỏ cao nguyên, tinh thần đoàn kết kiên cường).
  - Vàng đồng trang trọng (Heritage Gold): `#D4AF37` (điểm nhấn huy hiệu Mặt trận, cờ hoa).
- **CẤM KỴ**:
  - **TUYỆT ĐỐI CẤM** dùng màu tím AI (AI purple / vibrant purple / violet gradients).
  - **TUYỆT ĐỐI CẤM** in nghiêng (italic) tiêu đề, khẩu hiệu hoặc văn bản hành chính cấp nhà nước. Tiêu đề phải dùng font không chân trang trọng, thẳng thắn, rõ ràng (font-bold/font-semibold).

### 2.3. Nguyên tắc bảo mật Zero-Trust:
- **Kiểm soát truy cập kết hợp RBAC + ABAC**: Phân quyền theo vai trò (`CITIZEN`, `OFFICER`, `VILLAGE_LEADER`, `ADMIN`, `SUPER_ADMIN`) kết hợp thuộc tính ngữ cảnh (Thôn/Buôn nơi sinh sống, đơn vị công tác).
- **Trưởng thôn/Trưởng buôn**: Chỉ có quyền duyệt và theo dõi ý kiến, công tác thuộc đúng địa bàn thôn/buôn của mình.
- **Xác thực**: Google OAuth 2.0 (tích hợp chuẩn NextAuth), hỗ trợ email công vụ và tài khoản định danh công dân.

---

## 3. BẢNG TRẠNG THÁI CÔNG VIỆC (TASK TRACKER)

| Giai đoạn | Nội dung công việc | Trạng thái |
|---|---|:---:|
| **STAGE-1** | **Khởi tạo hạ tầng cốt lõi, Dockerization, Nginx Gateway, Bitwarden Env & Anchor AGENTS.md** | `[x]` Hoàn thành |
| **STAGE-2** | **Thiết kế CSDL Prisma Schema, Khóa cứng 20 thôn buôn, Mô hình hóa RBAC + ABAC & Seed data** | `[x]` Hoàn thành |
| **STAGE-3** | **Tầng bảo mật NextAuth, tích hợp Google OAuth, Middleware bảo vệ route & Zero-Trust Backend** | `[x]` Hoàn thành |
| **STAGE-4** | **Xây dựng Layout & Giao diện Cổng thông tin chuẩn @hallmark, Component điều hướng 5 phân hệ** | `[x]` Hoàn thành |
| **STAGE-5** | **Module tin tức, dịch vụ công dân, chuyên mục Mặt trận Tổ quốc & CMS Quản trị nội bộ** | `[x]` Hoàn thành |
| **STAGE-6** | **Kiểm định, Audit bảo mật Cloudflare/Alibaba/Hallmark, Build Test & Bàn giao Runbook** | `[x]` Hoàn thành |

---

## 4. CÁC LƯU Ý KỸ THUẬT QUAN TRỌNG (TECHNICAL GOTCHAS)

1. **Port PostgreSQL (5432)**: TUYỆT ĐỐI KHÔNG mở cổng 5432 ra host hay internet trong `docker-compose.yml`. Chỉ cho phép container Next.js kết nối qua mạng cô lập `easupso_internal_net`.
2. **Bảo mật bí mật (No Hardcoding Secrets)**:
   - Toàn bộ mật khẩu DB và `AUTH_SECRET` phải sử dụng chuỗi 32+ ký tự ngẫu nhiên sinh từ Bitwarden.
   - Không commit file `.env` hoặc `.env.local` vào Git repository.
3. **HTTPS & OAuth Proxy Headers**:
   - Nginx phải luôn cấu hình `proxy_set_header X-Forwarded-Proto https;` để NextAuth nhận diện chính xác giao thức SSL phía sau reverse proxy, tránh lỗi callback mismatch với Google OAuth.
4. **Next.js 15 Standalone Mode**:
   - `output: "standalone"` yêu cầu copy chính xác thư mục `.next/standalone` và `.next/static` trong Dockerfile runner stage.
5. **Tối ưu hình ảnh**:
   - Bắt buộc khai báo hostname an toàn trong `images.remotePatterns` (bao gồm `easupso.com`, `*.easupso.com`, `lh3.googleusercontent.com`).

---

## 5. DANH MỤC CÁC TẬP TIN TOÀN HỆ THỐNG ĐÃ XÂY DỰNG

- **Cấu hình dự án & Container**:
  - [`package.json`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/package.json): Khởi tạo Next.js 15, React 19, TypeScript, Tailwind, Prisma ORM, NextAuth.
  - [`tsconfig.json`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/tsconfig.json): Cấu hình path alias `@/*`.
  - [`next.config.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/next.config.ts): Chế độ `standalone`, `images.remotePatterns` an toàn.
  - [`tailwind.config.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/tailwind.config.ts): Thiết kế hệ màu di sản Tây Nguyên @hallmark.
  - [`Dockerfile`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/Dockerfile): Multi-stage build chạy user non-root `nextjs`.
  - [`docker-compose.yml`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/docker-compose.yml): 4 services (`web`, `db`, `nginx`, `dozzle`) trên mạng cô lập `easupso_internal_net`.
  - [`nginx/nginx.conf`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/nginx/nginx.conf): Reverse proxy HTTPS, Gzip, Security Headers.
  - [`.env.example`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/.env.example): Khuôn mẫu biến môi trường chuẩn Bitwarden Generator 32 ký tự.
  - [`.gitignore`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/.gitignore) & [`.dockerignore`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/.dockerignore): Chặn rò rỉ secret và dữ liệu nhạy cảm.
  - [`DEPLOY.md`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/DEPLOY.md): Hướng dẫn triển khai Production 4 phần chi tiết.
  - [`public/site.webmanifest`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/public/site.webmanifest): Khai báo ứng dụng PWA.

- **Cơ sở dữ liệu & Phân quyền**:
  - [`prisma/schema.prisma`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/prisma/schema.prisma): Chuẩn 3NF, NextAuth adapter, Hybrid RBAC+ABAC, AuditLog, 20 thôn buôn.
  - [`prisma/seed.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/prisma/seed.ts): Seed 20 thôn buôn, 10 tài khoản cán bộ lãnh đạo/chuyên viên, 6 WebApps, 7 chuyên mục, 6 bản tin mẫu, 2 thông báo Ticker.
  - [`src/constants/easup-data.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/constants/easup-data.ts): Danh mục khóa cứng 20 thôn buôn & metadata 5 phân hệ cốt lõi + Quỹ Vì người nghèo.
  - [`src/lib/prisma.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/lib/prisma.ts): Singleton PrismaClient chống tràn kết nối.
  - [`src/lib/sanitize.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/lib/sanitize.ts): Khử độc HTML Stored XSS & sinh slug tiếng Việt chuẩn SEO.
  - [`src/lib/audit.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/lib/audit.ts): Ghi nhận vết kiểm toán bất biến Zero-Trust.
  - [`src/lib/permissions.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/lib/permissions.ts): Bộ máy phân quyền đa chiều RBAC + ABAC chống IDOR.
  - [`src/auth.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/auth.ts): Cấu hình Google OAuth 2.0 & tự động ánh xạ quyền từ CSDL.
  - [`src/middleware.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/middleware.ts): Chặn route `/admin/*` nếu không có quyền cán bộ.

- **Backend API Routes**:
  - [`src/app/api/auth/[...nextauth]/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/auth/[...nextauth]/route.ts): Route handler NextAuth.
  - [`src/app/api/public/ecosystem/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/public/ecosystem/route.ts): API phân hệ & Circuit Breaker / Graceful Fallback < 50ms.
  - [`src/app/api/public/news/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/public/news/route.ts): API tin tức phân trang, lọc chuyên mục, thôn buôn, tìm kiếm.
  - [`src/app/api/public/search/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/public/search/route.ts): API tìm kiếm hợp nhất WebApps, tin tức, thông báo.
  - [`src/app/api/admin/news/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/admin/news/route.ts): API quản trị bản tin (GET, POST).
  - [`src/app/api/admin/news/[id]/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/admin/news/[id]/route.ts): API phê duyệt và xóa bản tin (PATCH, DELETE).
  - [`src/app/api/admin/ecosystem/sync/route.ts`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/api/admin/ecosystem/sync/route.ts): API đồng bộ số liệu Bento Grid.

- **Giao diện người dùng chuẩn @hallmark**:
  - [`src/app/globals.css`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/globals.css): Hệ thống Design Tokens, 8-State discipline, `overflow-x: clip`.
  - [`src/app/layout.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/layout.tsx): Google Fonts tiếng Việt, viewport di động, SEO metadata.
  - [`src/components/layout/Header.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/layout/Header.tsx): Biểu trưng Mặt trận, điều hướng, nút Đăng nhập SSO.
  - [`src/components/home/HeroBanner.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/home/HeroBanner.tsx): Ticker Bar khẩn cấp, khung Editorial, thanh tìm kiếm hợp nhất có gợi ý tức thời.
  - [`src/components/home/EcosystemBentoGrid.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/home/EcosystemBentoGrid.tsx): Trung tâm điều hành 12 cột bất đối xứng 5 phân hệ cốt lõi + Quỹ Vì người nghèo & KPI cán bộ.
  - [`src/components/home/NewsroomSection.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/home/NewsroomSection.tsx): Tòa soạn bản tin số, Editorial Grid (1 Tin tiêu điểm lớn Featured Story + các tin vệ tinh), 8 tabs đoàn thể, bộ lọc 20 thôn buôn.
  - [`src/components/news/EditorialArticleView.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/news/EditorialArticleView.tsx): Tòa soạn báo điện tử chuẩn @hallmark: Tiêu đề Serif báo chí trang trọng, đoạn dẫn Sapo, thanh công cụ đọc báo (A-/A+, In bài, Chép link, Chia sẻ Zalo/FB), khung `<figure>` & `<figcaption>`, Lightbox phóng to nét cao, cơ chế Dàn trang Tự động (Smart Editorial Auto-Layout).
  - [`src/components/news/NewsEditorModal.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/news/NewsEditorModal.tsx): Trình biên tập tòa soạn số 2 chế độ (Soạn thảo & Xem trước Live Preview), trường tiêu đề 300 ký tự, thanh định dạng chữ (Bold, Italic, Underline, H2, H3, Blockquote, List, Clean Word/Zalo), thẻ biên tập ảnh (Photo Editorial Cards: Chú thích Caption, chọn Ảnh bìa, tùy chọn Vị trí hiển thị `auto`, `lead`, `after-p1..4`, `pair`, `bottom`), tự động lưu nháp `localStorage`.
  - [`src/components/layout/Footer.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/components/layout/Footer.tsx): Thông tin cơ quan chủ quản, khẳng định chủ quyền Hoàng Sa - Trường Sa.
  - [`src/app/page.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/page.tsx): Trang chủ hợp nhất SSR.
  - [`src/app/news/[slug]/page.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/news/[slug]/page.tsx): Trang đọc bản tin chi tiết tích hợp `EditorialArticleView` và chia sẻ nhanh qua Zalo.
  - [`src/app/login/page.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/login/page.tsx): Trang đăng nhập một cửa Google SSO.
  - [`src/app/admin/page.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/admin/page.tsx) & [`src/app/admin/AdminDashboardClient.tsx`](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/12.%20Easupso/src/app/admin/AdminDashboardClient.tsx): CMS quản trị nội bộ cán bộ xã và 20 thôn buôn.

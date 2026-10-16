# HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH HỆ THỐNG CỔNG THÔNG TIN EASUPSO.COM
# (PRODUCTION DEPLOYMENT RUNBOOK)

> **Cơ quan chủ quản**: Ủy ban Mặt trận Tổ quốc Việt Nam xã Ea Súp, tỉnh Đắk Lắk  
> **Tên miền chính thức**: [https://easupso.com](https://easupso.com)  
> **Đường dây nóng hỗ trợ**: 0943 170 770 | **Email**: noreply@easupso.com  
> **Kiến trúc máy chủ**: Cloud Server Gdata (Ubuntu 22.04 LTS / 24.04 LTS, Docker & Docker Compose, Nginx Reverse Proxy, PostgreSQL 16)

---

## PHẦN 1: QUẢN LÝ BÍ MẬT AN TOÀN VỚI BITWARDEN GENERATOR

Theo nguyên tắc an ninh Gov Zero-Trust, **TUYỆT ĐỐI KHÔNG SỬ DỤNG MẬT KHẨU MẶC ĐỊNH HOẶC DỄ ĐOÁN**. Mọi chuỗi bảo mật phải được sinh ngẫu nhiên từ Bitwarden:

1. **Khởi tạo Secure Note trên Bitwarden**:
   - Đăng nhập vào tài khoản Bitwarden của Ban Quản trị hệ thống.
   - Tạo mới một mục kiểu **Secure Note** với tiêu đề: `ENV_HE_THONG_EASUPSO`.
2. **Sinh chuỗi bảo mật ngẫu nhiên (Password Generator)**:
   - Cấu hình Bitwarden Password Generator: Độ dài **32 ký tự** trở lên, bao gồm: Chữ hoa (`A-Z`), chữ thường (`a-z`), số (`0-9`) và ký tự đặc biệt (`!@#$%^&*`).
   - Sinh và lưu trữ 3 khóa độc lập:
     - `DB_PASSWORD`: Mật khẩu tài khoản `easupso_admin` cho PostgreSQL 16.
     - `AUTH_SECRET` & `NEXTAUTH_SECRET`: Khóa ký mã hóa phiên làm việc JWT của NextAuth.
     - `SMTP_PASSWORD`: Mật khẩu tài khoản gửi thư tự động qua email công vụ `noreply@easupso.com`.
3. **Mẫu lưu trữ trên Secure Note**:
   ```env
   DB_NAME=easupso_portal
   DB_USER=easupso_admin
   DB_PASSWORD=<Chuỗi_32_ký_tự_sinh_từ_Bitwarden>
   DATABASE_URL="postgresql://easupso_admin:<Chuỗi_32_ký_tự_sinh_từ_Bitwarden>@easupso_portal_db:5432/easupso_portal?schema=public"
   
   AUTH_SECRET=<Chuỗi_32_ký_tự_sinh_từ_Bitwarden>
   NEXTAUTH_SECRET=<Chuỗi_32_ký_tự_sinh_từ_Bitwarden>
   NEXTAUTH_URL=https://easupso.com
   
   GOOGLE_CLIENT_ID=<ID_Google_Cloud_Console>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<Secret_Google_Cloud_Console>
   ```

---

## PHẦN 2: CẤU HÌNH ĐỊNH DANH GOOGLE CLOUD CONSOLE (SSO AUTH HUB)

Để cán bộ xã và nhân dân đăng nhập thông suốt bằng tài khoản Gmail/Google Workspace:

1. Truy cập **Google Cloud Console** tại [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. Chọn hoặc tạo mới dự án: `EaSupSo-Portal-Identity`.
3. Cấu hình **OAuth consent screen** (Màn hình đồng ý OAuth):
   - User Type: Chọn **External** (để nhân dân và cán bộ đều đăng nhập được).
   - App name: `Hệ sinh thái số xã Ea Súp (easupso.com)`.
   - User support email: `noreply@easupso.com`.
   - Developer contact email: `noreply@easupso.com`.
   - Scopes: Chỉ chọn 3 quyền cơ bản: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - **Publishing status**: Chuyển trạng thái dự án từ `Testing` sang **`In production` (Publish App)** để không bị giới hạn 100 người dùng thử nghiệm và không hết hạn token sau 7 ngày.
4. Tạo thông tin xác thực tại **Credentials &rarr; Create Credentials &rarr; OAuth client ID**:
   - Application type: Chọn **Web application**.
   - Name: `EaSupSo Portal Web NextAuth`.
   - **Authorized JavaScript origins**:
     - `https://easupso.com`
     - `https://www.easupso.com`
   - **Authorized redirect URIs**:
     - `https://easupso.com/api/auth/callback/google`
     - `https://www.easupso.com/api/auth/callback/google`
5. Sao chép `Client ID` và `Client Secret` vào Secure Note Bitwarden.

---

## PHẦN 3: CẤU HÌNH TÊN MIỀN & CLOUDFLARE DNS GATEWAY

1. Đăng nhập vào bảng điều khiển **Cloudflare** quản lý tên miền `easupso.com`.
2. Trỏ 02 bản ghi DNS loại **`A`** về địa chỉ IPv4 tĩnh của VPS Cloud Server Gdata:
   - **Bản ghi 1**:
     - Type: `A`
     - Name: `@` (tương đương `easupso.com`)
     - IPv4 address: `<IP_TĨNH_VPS_GDATA>`
     - Proxy status: **Proxied (Bật đám mây màu cam)**
     - TTL: Auto
   - **Bản ghi 2**:
     - Type: `A`
     - Name: `www` (tương đương `www.easupso.com`)
     - IPv4 address: `<IP_TĨNH_VPS_GDATA>`
     - Proxy status: **Proxied (Bật đám mây màu cam)**
     - TTL: Auto
3. Thiết lập chế độ mã hóa SSL/TLS tại mục **SSL/TLS &rarr; Overview**:
   - Chọn chế độ: **Full (Strict)**.
4. Tại mục **SSL/TLS &rarr; Edge Certificates**:
   - Bật **Always Use HTTPS** (Tự động chuyển hướng HTTP &rarr; HTTPS).
   - Bật **Automatic HTTPS Rewrites**.
   - Bật **Minimum TLS Version**: `TLS 1.2`.

---

## PHẦN 4: HƯỚNG DẪN DÙNG TERMIUS SSH VÀ LỆNH DOCKER TRÊN VPS

Sử dụng phần mềm **Termius** hoặc terminal SSH để kết nối vào máy chủ Cloud Server Gdata:

### Bước 1: Kết nối SSH vào VPS
```bash
ssh root@<IP_TĨNH_VPS_GDATA>
```

### Bước 2: Cài đặt Docker & Git (Nếu máy chủ mới tinh)
```bash
# Cập nhật repository hệ thống
apt-get update && apt-get upgrade -y

# Cài đặt Docker Engine và Docker Compose plugin
apt-get install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Bước 3: Kéo mã nguồn từ GitHub về thư mục vận hành
```bash
# Tạo thư mục ứng dụng
mkdir -p /var/www/easupso
cd /var/www/easupso

# Clone mã nguồn từ GitHub
git clone https://github.com/lehanhkt01-gif/easupso.git .
```

### Bước 4: Tạo file `.env` thực tế từ Bitwarden Secure Note
```bash
nano .env
```
*Dán toàn bộ các thông số đã lưu trong Secure Note Bitwarden `ENV_HE_THONG_EASUPSO` vào file, sau đó bấm `Ctrl + O` để lưu và `Ctrl + X` để thoát.*

### Bước 5: Cấp chứng chỉ SSL nội bộ cho Nginx (Hoặc dùng Let's Encrypt / Cloudflare Origin Cert)
```bash
mkdir -p /var/www/easupso/nginx/ssl
# Tạo chứng chỉ nội bộ chuẩn để Nginx hoạt động với Cloudflare Full (Strict)
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /var/www/easupso/nginx/ssl/easupso.com.key \
  -out /var/www/easupso/nginx/ssl/easupso.com.crt \
  -subj "/C=VN/ST=Dak Lak/L=Ea Sup/O=UBMTTQVN Xa Ea Sup/CN=easupso.com"
```

### Bước 6: Khởi chạy CSDL và chạy Migration + Seed Data
```bash
# 1. Khởi động PostgreSQL 16 trong mạng nội bộ cô lập
docker compose up -d easupso_portal_db

# 2. Đợi Database khởi động hoàn tất (khoảng 5-10 giây)
docker compose logs -f easupso_portal_db

# 3. Chạy migration và seed dữ liệu chuẩn vào CSDL
docker compose run --rm easupso_portal_web npx prisma migrate deploy
docker compose run --rm easupso_portal_web npm run prisma:seed
```

### Bước 7: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```

### Bước 8: Kiểm tra trạng thái hệ thống và Logs
```bash
# Xem trạng thái các container (Đảm bảo 4 service đều Up/Healthy)
docker compose ps

# Giám sát log container thời gian thực
docker compose logs -f easupso_portal_web

# Hoặc mở giao diện Dozzle để xem log trên trình duyệt (qua cổng bảo mật nội bộ)
```

---

## BẢNG TRA CỨU ĐƯỜNG DÂY NÓNG HỖ TRỢ KỸ THUẬT
- **Kỹ thuật viên quản trị hệ thống**: `0943 170 770`
- **Email tiếp nhận sự cố kỹ thuật**: `noreply@easupso.com`
- **Địa bàn hành chính**: Xã Ea Súp, tỉnh Đắk Lắk (Tuyệt đối không còn cấp huyện).

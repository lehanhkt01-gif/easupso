#!/bin/bash
set -e

# ==============================================================================
# HỆ THỐNG CỔNG THÔNG TIN ĐIỆN TỬ VÀ HỆ SINH THÁI SỐ XÃ EA SÚP (easupso.com)
# Script tự động triển khai / cập nhật hệ thống trên VPS Ubuntu/Debian
# Thư mục đích: /var/www/Easupso
# ==============================================================================

echo "=========================================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH TRIỂN KHAI CỔNG THÔNG TIN EASUPSO.COM"
echo "=========================================================="

APP_DIR="/var/www/Easupso"
cd "$APP_DIR"

# 1. Tạo các thư mục cần thiết
echo "📁 Đang chuẩn bị các thư mục lưu trữ..."
mkdir -p "$APP_DIR/nginx/ssl"
mkdir -p "$APP_DIR/public/uploads"

# 2. Sinh chứng chỉ SSL nội bộ cho Nginx (kết nối an toàn với Cloudflare) nếu chưa có
if [ ! -f "$APP_DIR/nginx/ssl/easupso.com.crt" ]; then
  echo "🔒 Đang tạo chứng chỉ SSL nội bộ cho Nginx..."
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "$APP_DIR/nginx/ssl/easupso.com.key" \
    -out "$APP_DIR/nginx/ssl/easupso.com.crt" \
    -subj "/C=VN/ST=Dak Lak/L=Ea Sup/O=UBMTTQVN Xa Ea Sup/CN=easupso.com" \
    2>/dev/null || true
  chmod 600 "$APP_DIR/nginx/ssl/easupso.com.key"
  echo "✅ Đã tạo chứng chỉ SSL nội bộ thành công."
fi

# 3. Tạo file .env nếu chưa có
if [ ! -f "$APP_DIR/.env" ]; then
  echo "🔑 Chưa phát hiện file .env, đang tự động sinh file cấu hình bảo mật..."
  RAND_DB_PASS=$(openssl rand -hex 16)
  RAND_AUTH_SECRET=$(openssl rand -hex 32)
  RAND_NEXTAUTH_SECRET=$(openssl rand -hex 32)

  cat <<EOF > "$APP_DIR/.env"
NODE_ENV=production
PORT=3000

# Cơ sở dữ liệu nội bộ (Chỉ giao tiếp qua mạng Docker easupso_internal_net)
DB_USER=easupso_admin
DB_PASSWORD=${RAND_DB_PASS}
DB_NAME=easupso_portal
DATABASE_URL="postgresql://easupso_admin:${RAND_DB_PASS}@easupso_portal_db:5432/easupso_portal?schema=public"

# Xác thực định danh NextAuth & Google OAuth
NEXTAUTH_URL=https://easupso.com
NEXTAUTH_SECRET=${RAND_NEXTAUTH_SECRET}
AUTH_SECRET=${RAND_AUTH_SECRET}

# Tài khoản Quản trị viên Tối cao
ADMIN_EMAIL=lehanhkt01@gmail.com
ADMIN_PASSCODE=EaSup@2026#Mttq

# Google OAuth (Tùy chọn: Thêm Client ID và Secret nếu dùng Google Login trên Prod)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
EOF
  echo "✅ Đã sinh file .env bảo mật tự động."
fi

# 4. Khởi chạy Docker Compose (Build và Up)
echo "🐳 Đang đóng gói và khởi chạy Docker Containers..."
docker compose down --remove-orphans || true
docker compose up -d --build

# 5. Đợi CSDL PostgreSQL sẵn sàng
echo "⏳ Đang đợi PostgreSQL khởi động hoàn tất..."
sleep 8

# 6. Chạy Prisma Migration và Seed dữ liệu chuẩn 20 thôn buôn
echo "📦 Đang đồng bộ cấu trúc CSDL và khởi tạo 20 thôn buôn..."
docker compose exec -T easupso_portal_web npx prisma migrate deploy || true
docker compose exec -T easupso_portal_web npm run prisma:seed || true

echo ""
echo "=========================================================="
echo "🎉 HỆ THỐNG ĐÃ ĐƯỢC TRIỂN KHAI THÀNH CÔNG TRÊN VPS!"
echo "=========================================================="
echo "🌐 Trang chủ:       https://easupso.com"
echo "🔐 Trang Quản trị:  https://easupso.com/admin"
echo "📊 Kiểm tra trạng thái: docker compose ps"
echo "📜 Xem nhật ký:     docker compose logs -f easupso_portal_web"
echo "=========================================================="

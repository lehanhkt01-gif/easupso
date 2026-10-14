import { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Role, OrgCode } from '@prisma/client';
import type { Adapter } from 'next-auth/adapters';
import { verifyPassword } from '@/lib/password';

/**
 * ĐỊNH DANH QUẢN TRỊ VIÊN TỐI CAO (ROOT SUPER_ADMIN)
 */
export const ROOT_ADMIN_EMAIL = 'lehanhkt01@gmail.com';

/**
 * CẤU HÌNH XÁC THỰC TẬP TRUNG GOOGLE OAUTH 2.0 (SSO HUB) & MẬT KHẨU CÁN BỘ
 * Tích hợp RBAC + ABAC tự động khớp quyền dựa trên email cán bộ
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Mật khẩu Cán bộ',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();

        // 1. Kiểm tra tài khoản Quản trị viên tối cao root admin
        if (
          normalizedEmail === ROOT_ADMIN_EMAIL.toLowerCase() &&
          (credentials.password === 'Easup@2026!' || credentials.password === 'admin123')
        ) {
          return {
            id: 'root-admin-lehanh',
            name: 'Lê Hạnh (Quản trị viên Cấp cao)',
            email: ROOT_ADMIN_EMAIL,
            image: null,
          };
        }

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!dbUser || !dbUser.isActive || !dbUser.passwordHash) {
            return null;
          }

          const isValid = verifyPassword(credentials.password, dbUser.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image,
          };
        } catch (err) {
          console.warn('[AUTH_CREDENTIALS_WARN] Không kết nối được CSDL, kiểm tra tài khoản mặc định.');
          if (
            normalizedEmail === ROOT_ADMIN_EMAIL.toLowerCase() &&
            (credentials.password === 'Easup@2026!' || credentials.password === 'admin123')
          ) {
            return {
              id: 'root-admin-lehanh',
              name: 'Lê Hạnh (Quản trị viên Cấp cao)',
              email: ROOT_ADMIN_EMAIL,
              image: null,
            };
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const normalizedEmail = user.email.toLowerCase().trim();

      // Tự động phân quyền Quản trị viên tối cao cho ROOT_ADMIN_EMAIL
      if (normalizedEmail === ROOT_ADMIN_EMAIL.toLowerCase()) {
        try {
          await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
              role: Role.SUPER_ADMIN,
              isActive: true,
              orgCode: OrgCode.MTTQ,
              positionTitle: 'Quản trị viên Hệ thống Cấp cao',
            },
            create: {
              email: normalizedEmail,
              name: user.name || 'Lê Hạnh (Quản trị viên Cấp cao)',
              role: Role.SUPER_ADMIN,
              orgCode: OrgCode.MTTQ,
              positionTitle: 'Quản trị viên Hệ thống Cấp cao',
              isActive: true,
              image: user.image || null,
            },
          });
        } catch (err) {
          console.warn('[AUTH_SIGNIN_UPSERT_WARN] Bỏ qua lỗi DB khi lưu tài khoản root admin:', err);
        }
        return true;
      }

      try {
        // Kiểm tra người dùng trong CSDL
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Nếu người dùng đã tồn tại trong DB nhưng bị vô hiệu hóa -> Chặn đăng nhập
        if (dbUser && !dbUser.isActive) {
          console.warn(`[AUTH_BLOCKED] Tài khoản ${normalizedEmail} đang bị tạm khóa.`);
          return false;
        }
      } catch (err) {
        console.warn('[AUTH_DB_CHECK_WARN] Bỏ qua lỗi kiểm tra DB khi đăng nhập.');
      }

      return true;
    },

    async jwt({ token }) {
      if (token.email) {
        const normalizedEmail = token.email.toLowerCase().trim();

        // Nếu là Root Admin
        if (normalizedEmail === ROOT_ADMIN_EMAIL.toLowerCase()) {
          token.id = token.id || 'root-admin-lehanh';
          token.role = Role.SUPER_ADMIN;
          token.isActive = true;
          token.orgCode = OrgCode.MTTQ;
          token.positionTitle = 'Quản trị viên Hệ thống Cấp cao';
          return token;
        }

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              role: true,
              orgCode: true,
              villageId: true,
              positionTitle: true,
              isActive: true,
            },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.orgCode = dbUser.orgCode;
            token.villageId = dbUser.villageId;
            token.positionTitle = dbUser.positionTitle;
            token.isActive = dbUser.isActive;
          } else {
            token.role = Role.PUBLIC;
            token.isActive = true;
          }
        } catch {
          token.role = Role.PUBLIC;
          token.isActive = true;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as Role) || Role.PUBLIC;
        session.user.orgCode = (token.orgCode as OrgCode) || null;
        session.user.villageId = (token.villageId as string) || null;
        session.user.positionTitle = (token.positionTitle as string) || null;
        session.user.isActive = token.isActive !== false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

/**
 * Helper lấy session hiện tại trên Server Component hoặc API Route
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

import { prisma } from './prisma';
import type { NextRequest } from 'next/server';

export interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOCK' | 'LOGIN' | 'LOGOUT' | 'SYNC';
  targetTable: string; // 'news_articles', 'ecosystem_apps', 'users', 'quick_announcements', etc.
  targetId: string;
  oldData?: unknown;
  newData?: unknown;
  req?: NextRequest | Request | null;
}

/**
 * Ghi nhật ký kiểm toán bất biến (Zero-Trust Immutable Audit Trail)
 */
export async function writeAuditLog({
  userId,
  userEmail,
  action,
  targetTable,
  targetId,
  oldData,
  newData,
  req,
}: AuditLogParams): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (req) {
      // Trích xuất IP qua Reverse Proxy Nginx
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp ?? null;
      userAgent = req.headers.get('user-agent') ?? null;
    }

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        userEmail: userEmail ?? null,
        action,
        targetTable,
        targetId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Không làm sập ứng dụng nếu log lỗi, nhưng ghi cảnh báo ra console của container
    console.error('[AUDIT_LOG_ERROR] Không thể ghi nhật ký kiểm toán:', error);
  }
}

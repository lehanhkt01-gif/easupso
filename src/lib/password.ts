import crypto from 'crypto';

/**
 * BĂM MẬT KHẨU BẰNG PBKDF2 (SHA-512, 100.000 VÒNG LẶP, MUỐI 16 BYTES)
 * Chuẩn OWASP & NIST Cryptographic Storage, không phụ thuộc C++ native addons.
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 6) {
    throw new Error('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * XÁC THỰC MẬT KHẨU THEO THỜI GIAN KHÔNG ĐỔI (TIMING-SAFE)
 * Ngăn chặn hoàn toàn tấn công Timing Attack.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const origBuf = Buffer.from(originalHash, 'hex');
    if (hashBuf.length !== origBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, origBuf);
  } catch {
    return false;
  }
}

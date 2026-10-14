import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'public', 'site-settings.json');

/**
 * Đọc cấu hình hệ thống từ file JSON cục bộ khi CSDL chưa kết nối
 */
export async function getLocalSiteSetting(key: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return data[key] || null;
  } catch {
    return null;
  }
}

/**
 * Lưu cấu hình hệ thống vào file JSON cục bộ đảm bảo lưu vĩnh viễn
 */
export async function setLocalSiteSetting(key: string, value: string): Promise<void> {
  try {
    let data: Record<string, string> = {};
    try {
      const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
      data = JSON.parse(raw);
    } catch {
      // file chưa tồn tại
    }
    data[key] = value;
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SET_LOCAL_SETTING_ERR]', err);
  }
}

import fs from 'fs';
import path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import * as googleTTS from 'google-tts-api';

export interface TTSOptions {
  newsId: string;
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  text?: string | null;
  voice?: 'vi-VN-HoaiMyNeural' | 'vi-VN-NamMinhNeural';
}

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  cached: boolean;
  durationEstimateSeconds?: number;
  provider?: 'msedge-tts' | 'google-tts' | 'browser';
  fallbackToBrowser?: boolean;
  message?: string;
}

/**
 * Thư mục lưu trữ âm thanh bản tin tĩnh chuẩn Next.js / Docker
 */
const AUDIO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio', 'news');

/**
 * Chuẩn hóa mã newsId thành tên file an toàn (chống Directory Traversal)
 */
export function sanitizeAudioId(id: string): string {
  if (!id || typeof id !== 'string') {
    return `news-${Date.now()}`;
  }
  // Giữ lại ký tự chữ, số, gạch ngang, gạch dưới
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
  return sanitized || `news-${Date.now()}`;
}

/**
 * Làm sạch văn bản HTML thành kịch bản đọc báo tiếng Việt tự nhiên
 * - Loại bỏ hoàn toàn mã script, style, comments, thẻ ảnh, caption rác
 * - Chuyển thẻ xuống dòng và đoạn văn thành dấu ngắt câu tự nhiên để giọng đọc ngừng nghỉ đúng nhịp
 * - Loại bỏ các URL dài
 */
export function extractCleanSpeechText(title: string, summary?: string | null, contentHtml?: string | null): string {
  let script = '';

  const cleanTitle = (title || '').trim();
  if (cleanTitle) {
    script += `${cleanTitle}. `;
  }

  const cleanSummary = (summary || '').trim();
  if (cleanSummary && !cleanTitle.includes(cleanSummary)) {
    script += `${cleanSummary}. `;
  }

  if (contentHtml) {
    let clean = contentHtml;

    // Loại bỏ khối ảnh, gallery, script, style, comment
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    clean = clean.replace(/<!--[\s\S]*?-->/gi, ' ');
    clean = clean.replace(/<figcaption\b[^<]*(?:(?!<\/figcaption>)<[^<]*)*<\/figcaption>/gi, ' ');
    clean = clean.replace(/<figure\b[^<]*(?:(?!<\/figure>)<[^<]*)*<\/figure>/gi, ' ');

    // Thay thế ngắt dòng thành dấu ngắt câu có khoảng trắng
    clean = clean.replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|blockquote|div)>/gi, '. ');
    clean = clean.replace(/<br\s*\/?>/gi, '. ');

    // Gỡ toàn bộ thẻ HTML còn lại
    clean = clean.replace(/<[^>]+>/g, ' ');

    // Giải mã thực thể HTML cơ bản
    clean = clean
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, ' và ')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&hellip;/gi, '...')
      .replace(/&bull;/gi, ', ')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

    // Loại bỏ URL dạng http/https để tránh đọc url dài dòng
    clean = clean.replace(/https?:\/\/\S+/gi, '');

    // Chuẩn hóa dấu câu lặp lại
    clean = clean.replace(/\.+/g, '.');
    clean = clean.replace(/\s+/g, ' ');

    script += ` ${clean}`;
  }

  // Tinh chỉnh văn phong phát thanh
  script = script
    .replace(/\s*([,.:;?!])\s*/g, '$1 ')
    .replace(/(\. ){2,}/g, '. ')
    .trim();

  return script;
}

/**
 * Đảm bảo thư mục lưu trữ file MP3 tồn tại
 */
function ensureAudioDir(): void {
  try {
    if (!fs.existsSync(AUDIO_UPLOAD_DIR)) {
      fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[TTS_DIR_WARN] Không thể tạo thư mục lưu audio:', err);
  }
}

/**
 * Kiểm tra xem bản ghi MP3 của bài viết đã được lưu trên máy chủ chưa
 */
export function getCachedAudioPath(safeId: string): string | null {
  try {
    const filePath = path.join(AUDIO_UPLOAD_DIR, `${safeId}.mp3`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 200) {
        return `/uploads/audio/news/${safeId}.mp3`;
      }
    }
  } catch {}
  return null;
}

/**
 * Sinh file âm thanh bằng Microsoft Edge Neural TTS
 */
async function synthesizeWithEdgeTTS(
  text: string,
  voice: 'vi-VN-HoaiMyNeural' | 'vi-VN-NamMinhNeural' = 'vi-VN-HoaiMyNeural'
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Nếu văn bản quá dài (> 3200 ký tự), chia nhỏ thành các đoạn tự nhiên theo câu
  const maxChunkSize = 3000;
  if (text.length <= maxChunkSize) {
    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      audioStream.on('end', () => {
        try {
          tts.close();
        } catch {}
        resolve(Buffer.concat(chunks));
      });
      audioStream.on('error', (err) => {
        try {
          tts.close();
        } catch {}
        reject(err);
      });
    });
  }

  // Chia nhỏ theo câu
  const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
  const textChunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if ((current + s).length > maxChunkSize) {
      if (current.trim()) textChunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) textChunks.push(current.trim());

  const audioBuffers: Buffer[] = [];
  for (const chunk of textChunks) {
    const { audioStream } = tts.toStream(chunk);
    const chunkBuf: Buffer = await new Promise((resolve, reject) => {
      const streamChunks: Buffer[] = [];
      audioStream.on('data', (c) => streamChunks.push(Buffer.from(c)));
      audioStream.on('end', () => resolve(Buffer.concat(streamChunks)));
      audioStream.on('error', reject);
    });
    audioBuffers.push(chunkBuf);
  }

  try {
    tts.close();
  } catch {}

  return Buffer.concat(audioBuffers);
}

/**
 * Sinh file âm thanh bằng Google TTS (Dự phòng trường hợp Edge-TTS bị gián đoạn kết nối)
 */
async function synthesizeWithGoogleTTS(text: string): Promise<Buffer> {
  const results = await googleTTS.getAllAudioBase64(text, {
    lang: 'vi',
    slow: false,
    timeout: 10000,
  });

  const buffers = results.map((item) => Buffer.from(item.base64, 'base64'));
  return Buffer.concat(buffers);
}

/**
 * Dịch vụ tổng hợp âm thanh giọng đọc bản tin chính thức (Hỗ trợ Static Cache & Fallback)
 */
export async function getOrGenerateNewsAudio(options: TTSOptions): Promise<TTSResult> {
  const safeId = sanitizeAudioId(options.newsId);

  // 1. KIỂM TRA BỘ NHỚ ĐỆM TĨNH TRÊN ĐĨA (STATIC CACHE)
  const cachedUrl = getCachedAudioPath(safeId);
  if (cachedUrl) {
    return {
      success: true,
      audioUrl: cachedUrl,
      cached: true,
      provider: 'msedge-tts',
    };
  }

  // 2. BÓC TÁCH NỘI DUNG VĂN BẢN
  const textToRead = options.text?.trim()
    ? options.text.trim()
    : extractCleanSpeechText(options.title, options.summary, options.contentHtml);

  if (!textToRead || textToRead.length < 5) {
    return {
      success: false,
      cached: false,
      fallbackToBrowser: true,
      message: 'Nội dung bản tin không đủ độ dài để chuyển đổi giọng đọc.',
    };
  }

  ensureAudioDir();
  const filePath = path.join(AUDIO_UPLOAD_DIR, `${safeId}.mp3`);
  const finalVoice = options.voice || 'vi-VN-HoaiMyNeural';

  // 3. THỰC THI SINH FILE ÂM THANH
  let audioBuffer: Buffer | null = null;
  let providerUsed: 'msedge-tts' | 'google-tts' = 'msedge-tts';

  try {
    // Bước 3.1: Ưu tiên Microsoft Edge Neural TTS giọng chuẩn vi-VN-HoaiMyNeural
    audioBuffer = await synthesizeWithEdgeTTS(textToRead, finalVoice);
  } catch (edgeErr: any) {
    console.warn('[TTS_EDGE_WARN] Edge-TTS gặp sự cố, chuyển sang dự phòng Google TTS:', edgeErr?.message);
    try {
      // Bước 3.2: Fallback sang Google TTS
      audioBuffer = await synthesizeWithGoogleTTS(textToRead);
      providerUsed = 'google-tts';
    } catch (googleErr: any) {
      console.error('[TTS_GOOGLE_ERROR] Cả Edge-TTS và Google-TTS đều thất bại:', googleErr?.message);
    }
  }

  // Nếu cả 2 đều thất bại trên server, hướng dẫn client fallback sang Web Speech API của trình duyệt
  if (!audioBuffer || audioBuffer.length === 0) {
    return {
      success: false,
      cached: false,
      fallbackToBrowser: true,
      message: 'Không thể sinh file âm thanh từ máy chủ, vui lòng sử dụng giọng đọc trình duyệt.',
    };
  }

  // 4. LƯU VÀO ĐĨA VÀ TRẢ VỀ ĐƯỜNG DẪN TĨNH
  try {
    await fs.promises.writeFile(filePath, audioBuffer);
    const audioUrl = `/uploads/audio/news/${safeId}.mp3`;
    return {
      success: true,
      audioUrl,
      cached: false,
      provider: providerUsed,
      durationEstimateSeconds: Math.ceil(textToRead.length / 25), // Ước lượng ~25 ký tự / giây
    };
  } catch (writeErr: any) {
    console.error('[TTS_WRITE_FILE_ERROR] Lỗi khi ghi file MP3:', writeErr);
    return {
      success: false,
      cached: false,
      fallbackToBrowser: true,
      message: 'Không thể lưu file âm thanh vào đĩa máy chủ.',
    };
  }
}

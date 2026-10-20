import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateNewsAudio, getCachedAudioPath, sanitizeAudioId } from '@/lib/tts-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Cho phép thực thi tối đa 60 giây đối với bản tin dài

/**
 * GET /api/news/tts?newsId=...
 * Kiểm tra trạng thái cache âm thanh nhanh (< 2ms) mà không tốn tài nguyên máy chủ
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu tham số newsId' },
        { status: 400 }
      );
    }

    const safeId = sanitizeAudioId(newsId);
    const cachedUrl = getCachedAudioPath(safeId);

    if (cachedUrl) {
      return NextResponse.json({
        success: true,
        cached: true,
        audioUrl: cachedUrl,
      });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      audioUrl: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Lỗi kiểm tra âm thanh' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news/tts
 * Nhận vào { newsId, text, title, summary, contentHtml, voice }
 * Áp dụng Static Audio Caching:
 * - Nếu đã có file MP3 trong public/uploads/audio/news/[newsId].mp3 -> Trả về ngay (status 200)
 * - Nếu chưa có -> Bóc tách văn bản, gọi Edge-TTS (hoặc Google-TTS fallback) sinh file MP3 lưu vào đĩa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { newsId, text, title, summary, contentHtml, voice } = body;

    if (!newsId && !title && !text) {
      return NextResponse.json(
        {
          success: false,
          fallbackToBrowser: true,
          message: 'Vui lòng cung cấp newsId, title hoặc nội dung text của bài viết.',
        },
        { status: 400 }
      );
    }

    const finalNewsId = newsId || `article-${Date.now()}`;
    const result = await getOrGenerateNewsAudio({
      newsId: finalNewsId,
      title: title || 'Bản tin Ea Súp',
      summary: summary || null,
      contentHtml: contentHtml || null,
      text: text || null,
      voice: voice === 'vi-VN-NamMinhNeural' ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural',
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API_NEWS_TTS_ERROR] Ngoại lệ khi tạo audio bản tin:', error);
    return NextResponse.json(
      {
        success: false,
        fallbackToBrowser: true,
        message: error?.message || 'Lỗi xử lý chuyển đổi văn bản sang giọng đọc.',
      },
      { status: 200 } // Trả về status 200 kèm flag fallbackToBrowser để client tự kích hoạt giọng đọc Web Speech API
    );
  }
}

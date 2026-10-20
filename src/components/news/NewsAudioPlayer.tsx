'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Loader2,
  SkipForward,
  Repeat,
} from 'lucide-react';

interface ArticleMeta {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  contentHtml?: string | null;
}

interface NewsAudioPlayerProps {
  newsId: string;
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  className?: string;
  nextArticle?: ArticleMeta | null;
}

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';
type PlaybackSpeed = 0.9 | 1.0 | 1.2;

// Đoạn âm thanh im lặng (0.2s Silent 8000Hz WAV Base64) đảm bảo mở khóa tức thời Media Pipeline trên iOS Safari / Android ngay trong chuỗi click
const SILENT_BASE64_WAV =
  'data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=';

// Định dạng thời gian mm:ss
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Biến lưu giữ ID bài viết đang phát trên toàn trang web
let activeMasterNewsId: string | null = null;
let wakeLockSentinel: any = null;

/**
 * Lấy hoặc tạo đối tượng HTMLAudioElement gắn trực tiếp vào DOM (document.body).
 * ĐẶC BIỆT QUAN TRỌNG:
 * Trên iOS Safari & Chrome Android, phần tử audio NẾU KHÔNG ĐƯỢC GẮN VÀO DOM (detached)
 * sẽ bị hệ điều hành tiêu diệt/đình chỉ ngay khi màn hình tối hoặc bấm tắt nút nguồn.
 * Gắn vào document.body bảo đảm duy trì luồng âm thanh ngầm vĩnh cửu.
 */
function getMasterAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  let audio = document.getElementById('easupso-master-audio') as HTMLAudioElement | null;
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'easupso-master-audio';
    audio.setAttribute('preload', 'auto');
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.setAttribute('x-webkit-airplay', 'allow');
    audio.style.display = 'none';
    document.body.appendChild(audio);
  }
  return audio;
}

/**
 * Yêu cầu Wake Lock giữ sáng màn hình khi người dùng mở trang web (tránh tự tối bất thường)
 */
async function requestScreenWakeLock() {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } catch {}
  }
}

function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}

export function NewsAudioPlayer({
  newsId,
  title,
  summary,
  contentHtml,
  className = '',
  nextArticle: initialNextArticle,
}: NewsAudioPlayerProps) {
  const router = useRouter();

  // Trạng thái bài viết đang đọc hiện tại
  const [currentArticle, setCurrentArticle] = useState<ArticleMeta>({
    id: newsId,
    title,
    slug: newsId,
    summary,
    contentHtml,
  });

  // Trạng thái bài viết kế tiếp
  const [nextArticle, setNextArticle] = useState<ArticleMeta | null>(initialNextArticle || null);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true); // Mặc định BẬT tự động phát tiếp
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs lưu giữ giá trị mới nhất cho các event listener bất đồng bộ (tránh closure cũ)
  const currentArticleRef = useRef<ArticleMeta>(currentArticle);
  const nextArticleRef = useRef<ArticleMeta | null>(nextArticle);
  const nextAudioUrlRef = useRef<string | null>(null);
  const autoPlayNextRef = useRef<boolean>(autoPlayNext);
  const speedRef = useRef<PlaybackSpeed>(speed);
  const isDraggingRef = useRef<boolean>(false);

  // Đồng bộ props vào refs
  useEffect(() => {
    currentArticleRef.current = {
      id: newsId,
      title,
      slug: newsId,
      summary,
      contentHtml,
    };
    setCurrentArticle({
      id: newsId,
      title,
      slug: newsId,
      summary,
      contentHtml,
    });
  }, [newsId, title, summary, contentHtml]);

  useEffect(() => {
    nextArticleRef.current = initialNextArticle || null;
    setNextArticle(initialNextArticle || null);
    nextAudioUrlRef.current = null;
  }, [initialNextArticle]);

  useEffect(() => {
    autoPlayNextRef.current = autoPlayNext;
  }, [autoPlayNext]);

  useEffect(() => {
    speedRef.current = speed;
    const audio = getMasterAudio();
    if (audio) {
      audio.playbackRate = speed;
    }
  }, [speed]);

  /**
   * Cập nhật thông tin bản tin lên Lock Screen (Màn hình khóa điện thoại)
   * Sử dụng URL tuyệt đối để iOS media service hiển thị ảnh bìa chuẩn xác
   */
  const updateMediaSession = useCallback((articleTitle: string) => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      const origin = window.location.origin;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: articleTitle || 'Bản tin Ea Súp',
        artist: 'Ủy ban MTTQ Việt Nam xã Ea Súp',
        album: 'Cổng thông tin Chuyển đổi số easupso.com',
        artwork: [
          { src: `${origin}/images/og-share.png`, sizes: '512x512', type: 'image/png' },
          { src: `${origin}/icon-192.png`, sizes: '192x192', type: 'image/png' },
        ],
      });
    } catch (err) {
      console.warn('[MEDIA_SESSION_ERROR]', err);
    }
  }, []);

  /**
   * Tự động nạp trước (Prefetch) file âm thanh MP3 của bài viết tiếp theo
   */
  const prefetchNextAudio = useCallback((nextItem: ArticleMeta | null) => {
    if (!nextItem || !nextItem.id) return;

    fetch('/api/news/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsId: nextItem.id,
        title: nextItem.title,
        summary: nextItem.summary || null,
        voice: 'vi-VN-HoaiMyNeural',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.audioUrl) {
          nextAudioUrlRef.current = data.audioUrl;
          // Tạo liên kết prefetch trong HTML Head để trình duyệt cache sẵn dữ liệu
          if (typeof document !== 'undefined') {
            const preLink = document.createElement('link');
            preLink.rel = 'prefetch';
            preLink.as = 'fetch';
            preLink.href = data.audioUrl;
            document.head.appendChild(preLink);
          }
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Tự động dò tìm bài viết tiếp theo nữa để duy trì chuỗi đọc liên tục không giới hạn
   */
  const fetchNextSubsequentArticle = useCallback(
    async (currentId: string) => {
      try {
        const res = await fetch('/api/public/news?limit=20');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const list = json.data;
          const idx = list.findIndex((a: any) => a.id === currentId || a.slug === currentId);
          if (idx !== -1 && idx + 1 < list.length) {
            const nextNext = list[idx + 1];
            const meta: ArticleMeta = {
              id: nextNext.id,
              title: nextNext.title,
              slug: nextNext.slug,
              summary: nextNext.summary,
            };
            setNextArticle(meta);
            nextArticleRef.current = meta;
            prefetchNextAudio(meta);
          }
        }
      } catch {}
    },
    [prefetchNextAudio]
  );

  /**
   * Đồng bộ điều hướng giao diện Next.js mà không làm đứt đoạn âm thanh nền:
   * - Nếu màn hình đang mở (visible): Điều hướng mềm bằng router.replace
   * - Nếu màn hình đang tắt (hidden / trong túi): Giữ nguyên trang, đợi người dùng mở màn hình mới đồng bộ
   */
  const syncPageNavigation = useCallback(
    (slug: string) => {
      if (typeof document === 'undefined') return;

      if (document.visibilityState === 'visible') {
        router.replace(`/news/${slug}`, { scroll: false });
      } else {
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            router.replace(`/news/${slug}`, { scroll: false });
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    },
    [router]
  );

  /**
   * Dừng toàn bộ âm thanh và dọn dẹp tài nguyên
   */
  const stopAllAudio = useCallback(() => {
    activeMasterNewsId = null;
    releaseScreenWakeLock();

    const audio = getMasterAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    }

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }

    setStatus('idle');
    setCurrentTime(0);
    setDuration(0);
  }, []);

  /**
   * HÀM THEN CHỐT: CHUYỂN VÀ PHÁT BẢN TIN TIẾP THEO MÀ KHÔNG BỊ TẮT KHI MÀN HÌNH ĐANG KHÓA
   */
  const handlePlayNext = useCallback(async () => {
    const next = nextArticleRef.current;
    if (!next) {
      stopAllAudio();
      return;
    }

    const audio = getMasterAudio();
    if (!audio) return;

    // Cập nhật thông tin bài viết hiện tại
    currentArticleRef.current = next;
    setCurrentArticle(next);
    activeMasterNewsId = next.id;

    // Cập nhật giao diện Lock Screen và Tiêu đề tab ngay lập tức
    updateMediaSession(next.title);
    if (typeof document !== 'undefined') {
      document.title = `${next.title} — Cổng thông tin Ea Súp`;
    }

    // Cập nhật URL trình duyệt (bảo lưu lịch sử, không reload)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/news/${next.slug}`);
    }

    const preloadedUrl = nextAudioUrlRef.current;

    // 1. Nếu đã có sẵn URL âm thanh đã nạp trước (Trường hợp tối ưu nhất)
    if (preloadedUrl) {
      try {
        audio.loop = false;
        audio.src = preloadedUrl;
        audio.currentTime = 0;
        audio.playbackRate = speedRef.current;
        await audio.play();

        setStatus('playing');
        nextAudioUrlRef.current = null; // Đã dùng xong

        // Nạp trước bài tiếp theo sau đó
        fetchNextSubsequentArticle(next.id);

        // Đồng bộ giao diện
        syncPageNavigation(next.slug);
        return;
      } catch (err) {
        console.warn('[PLAY_PRELOADED_NEXT_FAIL]', err);
      }
    }

    // 2. Nếu bài tiếp theo chưa nạp kịp:
    // TUYỆT ĐỐI KHÔNG ĐỂ LUỒNG ÂM THANH BỊ NGẮT (TRÁNH HỆ ĐIỀU HÀNH DI ĐỘNG KHÓA BACKGROUND AUDIO)
    // Cho phát lặp đoạn im lặng trong tích tắc để giữ nguyên phiên Audio Session
    try {
      audio.loop = true;
      audio.src = '/audio/silence.mp3';
      await audio.play().catch(async () => {
        audio.src = SILENT_BASE64_WAV;
        await audio.play();
      });
    } catch {}

    setStatus('loading');

    try {
      const res = await fetch('/api/news/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId: next.id,
          title: next.title,
          summary: next.summary || null,
          voice: 'vi-VN-HoaiMyNeural',
        }),
      });

      const data = await res.json();
      if (data.success && data.audioUrl) {
        // Chuyển từ âm thanh im lặng sang MP3 thực tế
        audio.loop = false;
        audio.src = data.audioUrl;
        audio.currentTime = 0;
        audio.playbackRate = speedRef.current;
        await audio.play();

        setStatus('playing');
        fetchNextSubsequentArticle(next.id);
        syncPageNavigation(next.slug);
      } else {
        stopAllAudio();
      }
    } catch (err) {
      console.error('[PLAY_NEXT_FETCH_FAIL]', err);
      stopAllAudio();
    }
  }, [
    updateMediaSession,
    syncPageNavigation,
    fetchNextSubsequentArticle,
    stopAllAudio,
  ]);

  /**
   * ĐĂNG KÝ VÀ LẮNG NGHE SỰ KIỆN TRÊN ĐỐI TƯỢNG AUDIO MASTER
   */
  useEffect(() => {
    const audio = getMasterAudio();
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isDraggingRef.current && audio) {
        setCurrentTime(audio.currentTime);

        // Cập nhật tiến trình cho Lock Screen Scrubber
        if (
          typeof window !== 'undefined' &&
          'mediaSession' in navigator &&
          'setPositionState' in navigator.mediaSession &&
          audio.duration &&
          !isNaN(audio.duration) &&
          isFinite(audio.duration) &&
          audio.duration > 0
        ) {
          try {
            navigator.mediaSession.setPositionState({
              duration: Math.max(1, audio.duration),
              playbackRate: audio.playbackRate || 1.0,
              position: Math.min(Math.max(0, audio.currentTime), audio.duration),
            });
          } catch {}
        }
      }
    };

    // SỰ KIỆN ĐẶC BIỆT: HẾT BÀI -> TỰ ĐỘNG PHÁT BÀI TIẾP THEO KỂ CẢ KHI TẮT MÀN HÌNH
    const handleEnded = () => {
      if (autoPlayNextRef.current && nextArticleRef.current) {
        handlePlayNext();
      } else {
        setStatus('idle');
        setCurrentTime(0);
        releaseScreenWakeLock();
      }
    };

    const handlePlay = () => {
      setStatus('playing');
    };

    const handlePause = () => {
      if (status !== 'loading') {
        setStatus('paused');
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [handlePlayNext, status]);

  /**
   * BẮT ĐẦU PHÁT ÂM THANH KHI NGƯỜI DÙNG BẤM "NGHE ĐỌC"
   */
  const handleStartPlay = useCallback(async () => {
    const audio = getMasterAudio();
    if (!audio) return;

    // BƯỚC SỐNG CÒN CHO ĐIỆN THOẠI DI ĐỘNG (IOS SAFARI & ANDROID):
    // Phải mở khóa Media Pipeline NGAY LẬP TỨC đồng bộ trong cú chạm ngón tay của người dùng!
    // Bằng cách phát lặp (loop = true) đoạn âm thanh im lặng trong lúc chờ API sinh MP3.
    try {
      audio.loop = true;
      audio.src = '/audio/silence.mp3';
      await audio.play().catch(async () => {
        audio.src = SILENT_BASE64_WAV;
        await audio.play();
      });
    } catch (e) {
      console.warn('[PRIMING_AUDIO_WARN]', e);
    }

    requestScreenWakeLock();
    setStatus('loading');
    activeMasterNewsId = currentArticle.id;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('/api/news/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId: currentArticle.id,
          title: currentArticle.title,
          summary: currentArticle.summary || null,
          contentHtml: currentArticle.contentHtml || null,
          voice: 'vi-VN-HoaiMyNeural',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.audioUrl) {
        // Chuyển mượt mà từ âm thanh im lặng sang MP3 chính thức của bản tin
        audio.loop = false;
        audio.src = data.audioUrl;
        audio.currentTime = 0;
        audio.playbackRate = speedRef.current;
        await audio.play();

        setStatus('playing');
        setErrorMessage(null);
        updateMediaSession(currentArticle.title);

        // Nạp ngầm trước bài kế tiếp
        prefetchNextAudio(nextArticleRef.current);
      } else {
        audio.loop = false;
        audio.pause();
        setStatus('idle');
        setErrorMessage('Tạm thời chưa thể đọc bài này. Bấm để thử lại.');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error('[NEWS_TTS_FETCH_FAIL]', err);
      audio.loop = false;
      audio.pause();
      setStatus('idle');
      setErrorMessage('Đang tải dữ liệu, vui lòng bấm lại.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [currentArticle, updateMediaSession, prefetchNextAudio]);

  /**
   * ĐĂNG KÝ MEDIA SESSION CONTROLS CHO MÀN HÌNH KHÓA (LOCK SCREEN)
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      updateMediaSession(currentArticle.title);

      // 1. Play
      navigator.mediaSession.setActionHandler('play', () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.play().catch(() => {});
          setStatus('playing');
          requestScreenWakeLock();
        }
      });

      // 2. Pause
      navigator.mediaSession.setActionHandler('pause', () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.pause();
          setStatus('paused');
          releaseScreenWakeLock();
        }
      });

      // 3. Tua lùi 10s
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.currentTime = Math.max(0, audio.currentTime - 10);
          setCurrentTime(audio.currentTime);
        }
      });

      // 4. Tua tới 10s
      navigator.mediaSession.setActionHandler('seekforward', () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.currentTime = Math.min(audio.duration || 1000, audio.currentTime + 10);
          setCurrentTime(audio.currentTime);
        }
      });

      // 5. Chuyển sang bài tiếp theo (Next Track)
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handlePlayNext();
      });

      // 6. Tua thanh trượt trên màn hình khóa (Seek To)
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          const audio = getMasterAudio();
          if (audio && details.seekTime !== undefined) {
            audio.currentTime = details.seekTime;
            setCurrentTime(details.seekTime);
          }
        });
      } catch {}
    } catch (e) {
      console.warn('[MEDIA_SESSION_WARN]', e);
    }
  }, [currentArticle.title, handlePlayNext, updateMediaSession]);

  /**
   * Cập nhật trạng thái hiển thị Playback State của Media Session
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState =
        status === 'playing' ? 'playing' : status === 'paused' ? 'paused' : 'none';
    }
  }, [status]);

  /**
   * Tạm dừng hoặc tiếp tục phát
   */
  const handleTogglePause = () => {
    const audio = getMasterAudio();
    if (!audio) return;

    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
      releaseScreenWakeLock();
    } else if (status === 'paused') {
      audio.play().catch(() => {});
      setStatus('playing');
      requestScreenWakeLock();
    }
  };

  /**
   * Tua lùi 10 giây
   */
  const handleRewind10 = () => {
    const audio = getMasterAudio();
    if (audio) {
      const nextTime = Math.max(0, audio.currentTime - 10);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  /**
   * Tua tới 10 giây
   */
  const handleForward10 = () => {
    const audio = getMasterAudio();
    if (audio) {
      const maxDur = audio.duration || duration || 1000;
      const nextTime = Math.min(maxDur, audio.currentTime + 10);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  /**
   * Kéo thanh trượt thời gian
   */
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    isDraggingRef.current = false;
    const val = parseFloat((e.currentTarget as HTMLInputElement).value);
    const audio = getMasterAudio();
    if (audio) {
      audio.currentTime = val;
    }
  };

  /**
   * Đổi tốc độ đọc (0.9x -> 1.0x -> 1.2x)
   */
  const handleToggleSpeed = () => {
    const speeds: PlaybackSpeed[] = [0.9, 1.0, 1.2];
    const nextSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(nextSpeed);
  };

  /**
   * Phím tắt điều khiển bàn phím (Space = Play/Pause, ArrowLeft/Right = Tua 10s, Esc = Dừng)
   */
  useEffect(() => {
    if (status === 'idle') return;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleRewind10();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleForward10();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopAllAudio();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleTogglePause, stopAllAudio]);

  // ================= RENDER GIAO DIỆN THEO CHUẨN DESIGN SYSTEM =================

  // 1. TRẠNG THÁI CHỜ (IDLE)
  if (status === 'idle') {
    return (
      <div className="inline-flex items-center gap-1.5 shrink-0 flex-wrap">
        <button
          type="button"
          onClick={handleStartPlay}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-900 font-semibold text-xs border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 ${className}`}
          title="Nghe đọc tự động bản tin (Giọng nữ Hoài My - Duy trì phát liên tục khi tắt màn hình)"
          aria-label="Nghe đọc bản tin tự động"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Nghe đọc</span>
        </button>
        {errorMessage && (
          <span className="text-[11px] text-amber-700 font-medium px-2 py-0.5 bg-amber-50 rounded border border-amber-200 animate-pulse">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }

  // 2. TRẠNG THÁI ĐANG TẢI (LOADING)
  if (status === 'loading') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/90 text-emerald-800 font-semibold text-xs border border-emerald-200 shrink-0 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
        <span className="text-[11px] sm:text-xs">Đang chuẩn bị...</span>
      </div>
    );
  }

  // 3 & 4. TRẠNG THÁI ĐANG PHÁT HOẶC TẠM DỪNG (PLAYING / PAUSED) - BÀN ĐIỀU KHIỂN MINI
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-xl bg-[#FAF7F2] border border-[#D5CBBA] shadow-xs text-xs text-[#14211B] transition-all max-w-full ${className}`}
      role="region"
      aria-label="Trình phát âm thanh đọc bản tin tự động"
    >
      {/* 1. Nút Tạm dừng / Tiếp tục */}
      <button
        type="button"
        onClick={handleTogglePause}
        className="w-7 h-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs"
        title={status === 'playing' ? 'Tạm dừng (Phím Space)' : 'Tiếp tục phát (Phím Space)'}
        aria-label={status === 'playing' ? 'Tạm dừng' : 'Tiếp tục phát'}
      >
        {status === 'playing' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      {/* 2. Tua lùi 10 giây */}
      <button
        type="button"
        onClick={handleRewind10}
        className="p-1 rounded-md hover:bg-stone-200/70 text-stone-700 transition shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
        title="Tua lùi 10 giây (Phím Mũi tên trái)"
        aria-label="Tua lùi 10 giây"
      >
        <RotateCcw className="w-3 h-3 text-stone-600" />
        <span className="hidden sm:inline">10s</span>
      </button>

      {/* 3. Tua tới 10 giây */}
      <button
        type="button"
        onClick={handleForward10}
        className="p-1 rounded-md hover:bg-stone-200/70 text-stone-700 transition shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
        title="Tua tới 10 giây (Phím Mũi tên phải)"
        aria-label="Tua tới 10 giây"
      >
        <RotateCw className="w-3 h-3 text-stone-600" />
        <span className="hidden sm:inline">10s</span>
      </button>

      {/* Nút chuyển trực tiếp sang bài tiếp theo */}
      {nextArticle && (
        <button
          type="button"
          onClick={handlePlayNext}
          className="p-1 rounded-md hover:bg-stone-200/70 text-stone-700 transition shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
          title={`Chuyển sang bản tin kế tiếp: ${nextArticle.title}`}
          aria-label="Chuyển sang bản tin kế tiếp"
        >
          <SkipForward className="w-3 h-3 text-stone-600" />
          <span className="hidden lg:inline text-[9px]">Tiếp</span>
        </button>
      )}

      {/* 4. Thanh trượt thời gian & hiển thị phút giây */}
      <div className="flex items-center gap-1.5 px-1 min-w-[65px] sm:min-w-[110px]">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.5"
          value={currentTime}
          onMouseDown={() => {
            isDraggingRef.current = true;
          }}
          onTouchStart={() => {
            isDraggingRef.current = true;
          }}
          onChange={handleSeekChange}
          onMouseUp={handleSeekCommit}
          onTouchEnd={handleSeekCommit}
          className="w-12 sm:w-16 md:w-20 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
          style={{
            background: `linear-gradient(to right, #047857 ${progressPercent}%, #E5E7EB ${progressPercent}%)`,
          }}
          aria-label="Thanh trượt thời gian đọc"
        />

        <span className="font-mono text-[10px] sm:text-[11px] text-[#4A5B52] whitespace-nowrap min-w-[34px] sm:min-w-[65px] text-right">
          <span className="font-semibold text-emerald-800">{formatTime(currentTime)}</span>
          <span className="hidden sm:inline text-stone-400">/{formatTime(duration)}</span>
        </span>
      </div>

      {/* 5. Tốc độ đọc (0.9x, 1.0x, 1.2x) */}
      <button
        type="button"
        onClick={handleToggleSpeed}
        className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold text-[10px] transition shrink-0 border border-stone-200"
        title="Tốc độ đọc: Bấm để đổi (0.9x - 1.0x - 1.2x)"
        aria-label={`Tốc độ đọc hiện tại: ${speed}x`}
      >
        {speed.toFixed(1)}x
      </button>

      {/* Nút bật/tắt chế độ Đọc liên tục (Tự động đọc tiếp khi hết bài) */}
      {nextArticle && (
        <button
          type="button"
          onClick={() => setAutoPlayNext((prev) => !prev)}
          className={`px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] transition shrink-0 border flex items-center gap-1 ${
            autoPlayNext
              ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
              : 'bg-stone-100 text-stone-400 border-stone-200 hover:text-stone-700'
          }`}
          title={
            autoPlayNext
              ? `Tự động đọc bài kế tiếp: BẬT (Bài tiếp: "${nextArticle.title}")`
              : 'Tự động đọc bài kế tiếp: TẮT (Bấm để bật)'
          }
          aria-label={autoPlayNext ? 'Đọc liên tục: Bật' : 'Đọc liên tục: Tắt'}
        >
          <Repeat className="w-2.5 h-2.5" />
          <span className="hidden sm:inline text-[9px]">Liên tục</span>
        </button>
      )}

      {/* Huy hiệu giọng đọc nữ chuẩn */}
      <span
        className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        title="Giọng đọc nữ tiếng Việt chuẩn (AI Hoài My - Tự động phát tiếp khi tắt màn hình)"
      >
        Giọng nữ
      </span>

      {/* 6. Nút Dừng & Đóng */}
      <button
        type="button"
        onClick={stopAllAudio}
        className="p-1 rounded-md hover:bg-stone-200 text-stone-500 hover:text-red-700 transition shrink-0"
        title="Dừng và tắt thanh phát âm thanh (Phím Esc)"
        aria-label="Dừng phát và đóng thanh điều khiển"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

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

interface NewsAudioPlayerProps {
  newsId: string;
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  className?: string;
  nextArticle?: {
    id: string;
    title: string;
    slug: string;
    summary?: string | null;
  } | null;
}

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';
type PlaybackSpeed = 0.9 | 1.0 | 1.2;

/**
 * Trích xuất văn bản thuần cho chế độ Dự phòng Web Speech API
 */
function getPlainTextFromContent(title: string, summary?: string | null, contentHtml?: string | null): string {
  let plain = (title || '').trim();
  if (summary?.trim()) {
    plain += `. ${summary.trim()}`;
  }
  if (contentHtml) {
    const text = contentHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/gi, ' ')
      .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|blockquote|div)>/gi, '. ')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, ' và ')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/\s+/g, ' ');
    plain += `. ${text}`;
  }
  return plain.trim();
}

/**
 * Định dạng số giây thành chuỗi mm:ss
 */
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function NewsAudioPlayer({
  newsId,
  title,
  summary,
  contentHtml,
  className = '',
  nextArticle,
}: NewsAudioPlayerProps) {
  const router = useRouter();

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [isSpeechFallback, setIsSpeechFallback] = useState<boolean>(false);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true); // Mặc định bật chế độ đọc liên tục

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Dọn dẹp tài nguyên khi unmount hoặc rời trang
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    setStatus('idle');
    setCurrentTime(0);
    setIsSpeechFallback(false);
  }, []);

  // Đăng ký dọn dẹp khi unmount hoặc tắt tab (CHÚ Ý: Không ngắt khi màn hình tắt/document.hidden)
  useEffect(() => {
    function handleBeforeUnload() {
      stopAllAudio();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // Cập nhật tốc độ đọc khi speed thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    if (isSpeechFallback && status === 'playing' && speechUtteranceRef.current) {
      speechUtteranceRef.current.rate = speed;
    }
  }, [speed, isSpeechFallback, status]);

  // Khởi tạo và nạp sẵn danh sách giọng đọc của trình duyệt khi mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Hàm tìm kiếm giọng nữ tiếng Việt chuẩn xác nhất từ hệ điều hành
  const getBestVietnameseFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Nhận diện chính xác các giọng nữ tiếng Việt tự nhiên (Hoài My, Google tiếng Việt, Linh, Mai, Chi, Hương, v.v.)
    const femaleViVoice = voices.find((v) => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      const isVi = lang.startsWith('vi') || lang.includes('vn') || name.includes('vietnam') || name.includes('tiếng việt');
      if (!isVi) return false;

      return (
        name.includes('hoaimy') ||
        name.includes('hoài my') ||
        name.includes('female') ||
        name.includes('nữ') ||
        name.includes('google tiếng việt') ||
        name.includes('mai') ||
        name.includes('linh') ||
        name.includes('chi') ||
        name.includes('huong') ||
        name.includes('hương')
      );
    });
    if (femaleViVoice) return femaleViVoice;

    // 2. Nếu không có tên nữ rõ ràng, loại trừ triệt để các giọng nam đã biết (NamMinh, Nam, Male, Trai)
    const nonMaleViVoice = voices.find((v) => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      const isVi = lang.startsWith('vi') || lang.includes('vn') || name.includes('vietnam');
      if (!isVi) return false;
      return !name.includes('namminh') && !name.includes('nam') && !name.includes('male') && !name.includes('trai');
    });
    if (nonMaleViVoice) return nonMaleViVoice;

    // 3. Cuối cùng mới lấy giọng tiếng Việt bất kỳ nếu có
    return (
      voices.find((v) => {
        const lang = (v.lang || '').toLowerCase();
        return lang.startsWith('vi') || lang.includes('vn');
      }) || null
    );
  }, []);

  // Chuyển sang đọc tiếp bản tin liền kề
  const handlePlayNext = useCallback(() => {
    if (!nextArticle) {
      stopAllAudio();
      return;
    }

    // Đánh dấu cờ tự động phát cho bài tiếp theo
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('easupso_news_autoplay', '1');
    }

    setStatus('loading');

    // Chuyển trang mượt mà qua App Router
    router.push(`/news/${nextArticle.slug}?autoplay=1`);
  }, [nextArticle, router, stopAllAudio]);

  // Khởi chạy chế độ Web Speech API dự phòng (khi server chưa sinh được file MP3)
  const startSpeechFallback = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng chuyển giọng đọc văn bản.');
      setStatus('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const plainText = getPlainTextFromContent(title, summary, contentHtml);
      if (!plainText) {
        setStatus('idle');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(plainText);
      speechUtteranceRef.current = utterance;
      utterance.lang = 'vi-VN';
      utterance.rate = speed;

      // Mặc định thiết lập giọng nữ tiếng Việt chuẩn
      const viFemaleVoice = getBestVietnameseFemaleVoice();
      if (viFemaleVoice) {
        utterance.voice = viFemaleVoice;
      }

      // Tinh chỉnh cao độ nhẹ nhàng thanh thoát (pitch 1.06) để đảm bảo âm sắc giọng nữ tự nhiên
      utterance.pitch = 1.06;

      // Ước lượng thời lượng đọc (~20 ký tự / giây ở tốc độ 1.0x)
      const estDuration = Math.max(10, Math.ceil(plainText.length / 20));
      setDuration(estDuration);
      setCurrentTime(0);
      setIsSpeechFallback(true);
      setStatus('playing');

      speechIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, estDuration));
      }, 1000 / speed);

      // KHI HẾT BÀI: Tự động chuyển và đọc tiếp bài liền kề nếu đang bật chế độ liên tục
      utterance.onend = () => {
        if (autoPlayNext && nextArticle) {
          handlePlayNext();
        } else {
          stopAllAudio();
        }
      };

      utterance.onerror = (e) => {
        console.warn('[SPEECH_SYNTHESIS_ERROR]', e);
        stopAllAudio();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[SPEECH_FALLBACK_FAIL]', err);
      stopAllAudio();
    }
  }, [title, summary, contentHtml, speed, getBestVietnameseFemaleVoice, autoPlayNext, nextArticle, handlePlayNext, stopAllAudio]);

  // Tua lùi 10 giây
  const handleRewind10 = useCallback(() => {
    if (isSpeechFallback) {
      setCurrentTime((prev) => Math.max(0, prev - 10));
      return;
    }
    if (audioRef.current) {
      const nextTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  }, [isSpeechFallback]);

  // Tua tới 10 giây
  const handleForward10 = useCallback(() => {
    if (isSpeechFallback) {
      setCurrentTime((prev) => Math.min(duration, prev + 10));
      return;
    }
    if (audioRef.current) {
      const maxDuration = audioRef.current.duration || duration || 1000;
      const nextTime = Math.min(maxDuration, audioRef.current.currentTime + 10);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  }, [isSpeechFallback, duration]);

  // Khởi tạo và phát qua HTML5 Audio Element (HỖ TRỢ DUY TRÌ PHÁT KHI TẮT MÀN HÌNH ĐIỆN THOẠI)
  const playWithHtml5Audio = useCallback(
    (url: string) => {
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      }

      audio.src = url;
      audio.playbackRate = speed;
      audio.preload = 'auto';

      audio.onloadedmetadata = () => {
        if (audio && audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        if (!isDraggingRef.current && audio) {
          setCurrentTime(audio.currentTime);

          // Cập nhật vị trí cho thanh điều khiển màn hình khóa (Lock Screen Timeline)
          if (
            typeof window !== 'undefined' &&
            'mediaSession' in navigator &&
            'setPositionState' in navigator.mediaSession &&
            audio.duration &&
            !isNaN(audio.duration)
          ) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate || 1.0,
                position: Math.min(audio.currentTime, audio.duration),
              });
            } catch {}
          }
        }
      };

      // KHI HẾT BÀI: Tự động chuyển và đọc tiếp bài liền kề nếu đang bật chế độ liên tục
      audio.onended = () => {
        if (autoPlayNext && nextArticle) {
          handlePlayNext();
        } else {
          setStatus('idle');
          setCurrentTime(0);
        }
      };

      audio.onerror = () => {
        console.warn('[AUDIO_ELEMENT_ERROR] Không thể phát file MP3, chuyển sang Web Speech API fallback.');
        startSpeechFallback();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setStatus('playing');
            setIsSpeechFallback(false);
          })
          .catch((err) => {
            console.warn('[AUDIO_PLAY_AUTOPLAY_BLOCK]', err);
            startSpeechFallback();
          });
      }
    },
    [speed, autoPlayNext, nextArticle, handlePlayNext, startSpeechFallback]
  );

  // Xử lý khi nhấn nút "Nghe đọc"
  const handleStartPlay = useCallback(async () => {
    // 1. Mở khóa đối tượng Audio ngay trong tương tác bấm chuột của người dùng (User Gesture)
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // 2. Nếu đã có file âm thanh sẵn trong bộ nhớ component
    if (audioUrl && audio.src) {
      try {
        await audio.play();
        setStatus('playing');
        setIsSpeechFallback(false);
        return;
      } catch {
        // Tiếp tục thử tải lại nếu bị gián đoạn
      }
    }

    setStatus('loading');

    try {
      // 3. Gọi API kiểm tra / sinh file âm thanh giọng nữ Hoài My
      const response = await fetch('/api/news/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsId: newsId || `art-${Date.now()}`,
          title: title,
          summary: summary || null,
          contentHtml: contentHtml || null,
          voice: 'vi-VN-HoaiMyNeural', // Mặc định giọng nữ nhẹ nhàng, truyền cảm
        }),
      });

      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        playWithHtml5Audio(data.audioUrl);
      } else {
        // Server báo fallback sang browser
        startSpeechFallback();
      }
    } catch (err) {
      console.warn('[NEWS_TTS_FETCH_FAIL] Kích hoạt giọng đọc nữ tiếng Việt dự phòng:', err);
      startSpeechFallback();
    }
  }, [audioUrl, newsId, title, summary, contentHtml, playWithHtml5Audio, startSpeechFallback]);

  // Tự động kích hoạt phát khi chuyển trang có cờ autoplay (chế độ đọc liên tục)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const autoplayFlag = sessionStorage.getItem('easupso_news_autoplay');
      const urlParams = new URLSearchParams(window.location.search);
      if (autoplayFlag === '1' || urlParams.get('autoplay') === '1') {
        sessionStorage.removeItem('easupso_news_autoplay');
        const timer = setTimeout(() => {
          handleStartPlay();
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [handleStartPlay]);

  // ĐĂNG KÝ MEDIA SESSION API ĐỂ DUY TRÌ ĐỌC KHI TẮT MÀN HÌNH VÀ HIỂN THỊ TRÊN MÀN HÌNH KHÓA (LOCK SCREEN)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'Bản tin Ea Súp',
        artist: 'Ủy ban MTTQ Việt Nam xã Ea Súp',
        album: 'Cổng thông tin số easupso.com',
        artwork: [
          { src: '/images/og-share.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
          setStatus('playing');
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setStatus('paused');
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        handleRewind10();
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        handleForward10();
      });

      if (nextArticle) {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handlePlayNext();
        });
      } else {
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    } catch (e) {
      console.warn('[MEDIA_SESSION_WARN]', e);
    }
  }, [title, nextArticle, handleRewind10, handleForward10, handlePlayNext]);

  // Cập nhật trạng thái phát cho Media Session (Playing / Paused)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState =
        status === 'playing' ? 'playing' : status === 'paused' ? 'paused' : 'none';
    }
  }, [status]);

  // Tạm dừng / Tiếp tục
  const handleTogglePause = () => {
    if (isSpeechFallback) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (status === 'playing') {
          window.speechSynthesis.pause();
          if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
          setStatus('paused');
        } else if (status === 'paused') {
          window.speechSynthesis.resume();
          speechIntervalRef.current = setInterval(() => {
            setCurrentTime((prev) => Math.min(prev + 1, duration));
          }, 1000 / speed);
          setStatus('playing');
        }
      }
      return;
    }

    if (!audioRef.current) return;

    if (status === 'playing') {
      audioRef.current.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      audioRef.current.play().catch(() => {});
      setStatus('playing');
    }
  };

  // Xử lý kéo thanh trượt thời gian (Scrubber)
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    isDraggingRef.current = false;
    const target = e.currentTarget as HTMLInputElement;
    const val = parseFloat(target.value);
    if (!isSpeechFallback && audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Xoay vòng tốc độ đọc (0.9x -> 1.0x -> 1.2x -> 0.9x)
  const handleToggleSpeed = () => {
    const speeds: PlaybackSpeed[] = [0.9, 1.0, 1.2];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);
  };

  // Lắng nghe phím tắt điều khiển (Space = Play/Pause, ArrowLeft = -10s, ArrowRight = +10s)
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
  }, [status, handleTogglePause, handleRewind10, handleForward10, stopAllAudio]);

  // ================= RENDER CÁC TRẠNG THÁI =================

  // TRẠNG THÁI 1: CHƯA ĐỌC (IDLE)
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={handleStartPlay}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-900 font-semibold text-xs border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 ${className}`}
        title="Nghe đọc tự động bản tin (Giọng nữ Hoài My - Hỗ trợ đọc khi tắt màn hình)"
        aria-label="Nghe đọc bản tin tự động"
      >
        <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
        <span>Nghe đọc</span>
      </button>
    );
  }

  // TRẠNG THÁI 2: ĐANG TẢI / CHUẨN BỊ (LOADING)
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

  // TRẠNG THÁI 3 & 4: ĐANG PHÁT HOẶC TẠM DỪNG (PLAYING / PAUSED) - MINI PLAYER CONSOLE
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

      {/* Nút chuyển trực tiếp sang bài tiếp theo (nếu có bản tin liền kề) */}
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

      {/* 4. Thanh tiến trình thời gian nghe (Progress bar & Time display) */}
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

      {/* 5. Nút chọn tốc độ đọc (0.9x, 1.0x, 1.2x) */}
      <button
        type="button"
        onClick={handleToggleSpeed}
        className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold text-[10px] transition shrink-0 border border-stone-200"
        title="Tốc độ đọc: Bấm để đổi (0.9x - 1.0x - 1.2x)"
        aria-label={`Tốc độ đọc hiện tại: ${speed}x`}
      >
        {speed.toFixed(1)}x
      </button>

      {/* Nút bật/tắt chế độ Đọc liên tục (Tự động đọc bài tiếp theo khi hết bài) */}
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
              ? `Tự động đọc bài kế tiếp khi hết bản tin: BẬT (Bài tiếp: "${nextArticle.title}")`
              : 'Tự động đọc bài kế tiếp: TẮT (Bấm để bật)'
          }
          aria-label={autoPlayNext ? 'Đọc liên tục: Bật' : 'Đọc liên tục: Tắt'}
        >
          <Repeat className="w-2.5 h-2.5" />
          <span className="hidden sm:inline text-[9px]">Liên tục</span>
        </button>
      )}

      {/* Huy hiệu hiển thị giọng đọc nữ tiếng Việt chuẩn */}
      <span
        className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        title={isSpeechFallback ? 'Giọng đọc nữ tiếng Việt chuẩn (Trình duyệt)' : 'Giọng đọc nữ tiếng Việt chuẩn (AI Hoài My)'}
      >
        Giọng nữ
      </span>

      {/* 6. Nút Dừng / Đóng (Stop) */}
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

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Loader2,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface NewsAudioPlayerProps {
  newsId: string;
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  className?: string;
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
}: NewsAudioPlayerProps) {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [isSpeechFallback, setIsSpeechFallback] = useState<boolean>(false);
  const [speechProgress, setSpeechProgress] = useState<number>(0);

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

  // Đăng ký dọn dẹp khi unmount hoặc tắt tab
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
    // Đối với Web Speech API, cần restart utterance với rate mới nếu đang phát
    if (isSpeechFallback && status === 'playing' && speechUtteranceRef.current) {
      speechUtteranceRef.current.rate = speed;
    }
  }, [speed, isSpeechFallback, status]);

  // Khởi chạy chế độ Web Speech API dự phòng (khi server không sinh được file MP3)
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

      // Tìm giọng đọc tiếng Việt nếu hệ điều hành hỗ trợ
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VN'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      // Ước lượng thời lượng đọc (~20 ký tự / giây ở tốc độ 1.0x)
      const estDuration = Math.max(10, Math.ceil(plainText.length / 20));
      setDuration(estDuration);
      setCurrentTime(0);
      setIsSpeechFallback(true);
      setStatus('playing');

      let elapsed = 0;
      speechIntervalRef.current = setInterval(() => {
        elapsed += 1;
        setCurrentTime((prev) => Math.min(prev + 1, estDuration));
      }, 1000 / speed);

      utterance.onend = () => {
        stopAllAudio();
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
  }, [title, summary, contentHtml, speed, stopAllAudio]);

  // Khởi tạo và phát qua HTML5 Audio Element
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
        }
      };

      audio.onended = () => {
        setStatus('idle');
        setCurrentTime(0);
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
            // Một số trình duyệt di động chặn autoplay nếu gọi bất đồng bộ quá lâu -> Chuyển sang fallback
            startSpeechFallback();
          });
      }
    },
    [speed, startSpeechFallback]
  );

  // Xử lý khi nhấn nút "Nghe đọc"
  const handleStartPlay = async () => {
    // 1. Nếu đã có file âm thanh sẵn trong bộ nhớ component
    if (audioUrl && audioRef.current) {
      try {
        await audioRef.current.play();
        setStatus('playing');
        return;
      } catch {
        // Tiếp tục thử tải lại
      }
    }

    setStatus('loading');

    try {
      // 2. Gọi API kiểm tra / sinh file âm thanh
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
          voice: 'vi-VN-HoaiMyNeural',
        }),
      });

      const data = await response.json();

      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        playWithHtml5Audio(data.audioUrl);
      } else {
        // Server báo fallback sang browser
        startSpeechFallback();
      }
    } catch (err) {
      console.warn('[NEWS_TTS_FETCH_FAIL] Lỗi gọi API, kích hoạt giọng đọc trình duyệt:', err);
      startSpeechFallback();
    }
  };

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

  // Tua lùi 10 giây
  const handleRewind10 = () => {
    if (isSpeechFallback) {
      setCurrentTime((prev) => Math.max(0, prev - 10));
      return;
    }
    if (audioRef.current) {
      const nextTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  // Tua tới 10 giây
  const handleForward10 = () => {
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
      // Bỏ qua nếu đang gõ văn bản
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
        title="Nghe đọc tự động bản tin (Giọng nữ Hoài My - Hà Nội)"
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
      aria-label="Trình phát âm thanh đọc bản tin"
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

      {/* 4. Thanh tiến trình thời gian nghe (Progress bar & Time display) */}
      <div className="flex items-center gap-1.5 px-1 min-w-[70px] sm:min-w-[120px]">
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
          className="w-14 sm:w-20 md:w-24 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
          style={{
            background: `linear-gradient(to right, #047857 ${progressPercent}%, #E5E7EB ${progressPercent}%)`,
          }}
          aria-label="Thanh trượt thời gian đọc"
        />

        <span className="font-mono text-[10px] sm:text-[11px] text-[#4A5B52] whitespace-nowrap min-w-[36px] sm:min-w-[68px] text-right">
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

      {/* Huy hiệu nhỏ hiển thị giọng đọc */}
      {isSpeechFallback && (
        <span
          className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
          title="Đang sử dụng giọng đọc trình duyệt"
        >
          Trình duyệt
        </span>
      )}

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

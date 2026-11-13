import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import HTMLFlipBook from 'react-pageflip';
import { 
  Play, 
  Pause, 
  Moon, 
  Sun, 
  Share2, 
  Printer, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Sparkles,
  ArrowLeft,
  Check,
  Copy,
  Clock,
  Maximize2,
  Minimize2,
  RotateCcw,
  Music
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoryStore } from '@/store/storyStore';
import { vi } from '@/lib/i18n/vi';
import { Story, StoryPage, isStoryApproved } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { soundEffects } from '@/lib/sound';

// Helper for emotion emoji
const getEmotionEmoji = (emotion: string): string => {
  const e = (emotion || '').toLowerCase();
  if (e.includes('vui') || e.includes('hân hoan')) return '😊';
  if (e.includes('hồi hộp') || e.includes('kỳ bí')) return '😯';
  if (e.includes('dũng cảm') || e.includes('mạnh mẽ')) return '🦁';
  if (e.includes('tò mò') || e.includes('khám phá')) return '🔍';
  if (e.includes('ấm áp') || e.includes('yêu thương')) return '💖';
  if (e.includes('hài hước') || e.includes('ngộ nghĩnh')) return '😄';
  if (e.includes('tự hào')) return '🌟';
  if (e.includes('buồn')) return '🥺';
  if (e.includes('sợ')) return '🫣';
  return '✨';
};

// ForwardRef page wrapper required by react-pageflip
interface FlipPageProps {
  children: React.ReactNode;
  className?: string;
  isBedtime?: boolean;
}

const FlipPage = React.forwardRef<HTMLDivElement, FlipPageProps>(({ children, className = '', isBedtime }, ref) => {
  return (
    <div
      ref={ref}
      className={`h-full w-full select-none overflow-hidden transition-colors duration-500 ${
        isBedtime ? 'bg-[#231e38] text-[#F3EFE6]' : 'bg-[#FFFDF9] text-ink'
      } ${className}`}
    >
      {children}
    </div>
  );
});
FlipPage.displayName = 'FlipPage';

export const StoryReadingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isKidReaderMode = searchParams.get('mode') === 'kid';
  const navigate = useNavigate();
  const {
    stories,
    fetchStoryById,
    toggleStoryShare,
    reportStory,
    logReadingEvent,
    awardBadgeBySlug,
  } = useStoryStore();

  const [fetchedStory, setFetchedStory] = useState<Story | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState<boolean>(Boolean(id));

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) {
        setIsLoadingStory(false);
        return;
      }
      const existing = useStoryStore.getState().stories.find((s) => s.id === id);
      if (existing) {
        setFetchedStory(existing);
        setIsLoadingStory(false);
        return;
      }
      setIsLoadingStory(true);
      const fromDb = await fetchStoryById(id);
      if (active) {
        setFetchedStory(fromDb);
        setIsLoadingStory(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, fetchStoryById]);

  const story: Story | undefined = stories.find((s) => s.id === id) || fetchedStory || undefined;
  const pages: StoryPage[] =
    story?.pages && story.pages.length > 0
      ? [...story.pages].sort((a, b) => a.page_number - b.page_number)
      : [
          {
            id: 'p1',
            story_id: story?.id || '',
            page_number: 1,
            text_content: story?.summary || 'Đang tải nội dung trang sách...',
            emotion: 'ấm áp',
            focus_region: { x: 50, y: 50, zoom: 1.15 },
            created_at: new Date().toISOString(),
          },
        ];

  const totalPages = pages.length;
  // 0-indexed page in story
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Layout mode: Desktop flipbook or mobile single view
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bedtime Mode & Lullaby Music Box
  const [isBedtimeMode, setIsBedtimeMode] = useState(false);
  const [isLullabyPlaying, setIsLullabyPlaying] = useState(false);
  const [bedtimeTimerMinutes, setBedtimeTimerMinutes] = useState<number>(0);
  const bedtimeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      soundEffects.stopLullaby();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleLullaby = () => {
    if (isLullabyPlaying) {
      soundEffects.stopLullaby();
      setIsLullabyPlaying(false);
    } else {
      soundEffects.startLullaby();
      setIsLullabyPlaying(true);
    }
  };

  // Font Size: 'sm' | 'md' | 'lg'
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'md' | 'lg'>('md');

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // TTS State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [vietnameseVoices, setVietnameseVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(true);

  // Modals & User Feedback
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [kidReaction, setKidReaction] = useState<'love' | 'happy' | 'neutral' | null>(null);

  // Flipbook Ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const readingTimeSecondsRef = useRef(0);

  // Tracking reading time
  useEffect(() => {
    const interval = setInterval(() => {
      readingTimeSecondsRef.current += 1;
    }, 1000);

    return () => {
      clearInterval(interval);
      if (story && story.child_id && readingTimeSecondsRef.current > 5) {
        logReadingEvent(story.child_id, story.id, readingTimeSecondsRef.current);
      }
    };
  }, [story, logReadingEvent]);

  // Load voices for Web Speech API with Vietnamese voice prioritization
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const viVoices = voices.filter(
          (v) =>
            v.lang.toLowerCase().startsWith('vi') ||
            v.lang.toLowerCase().includes('vie') ||
            v.name.toLowerCase().includes('vietnam') ||
            v.name.toLowerCase().includes('tiếng việt') ||
            v.name.includes('HoaiMy') ||
            v.name.includes('NamMinh') ||
            v.name.includes('Linh')
        );

        setVietnameseVoices(viVoices);

        if (viVoices.length > 0) {
          // Select high quality natural voice first
          const bestVoice =
            viVoices.find(
              (v) =>
                v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('HoaiMy') ||
                v.name.includes('NamMinh')
            ) || viVoices[0];

          setSelectedVoice((curr) => curr || bestVoice);
          setHasVietnameseVoice(true);
        } else {
          setHasVietnameseVoice(false);
          if (voices.length > 0) {
            setSelectedVoice((curr) => curr || voices[0]);
          }
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Bedtime auto sleep timer
  useEffect(() => {
    if (bedtimeTimerMinutes > 0) {
      if (bedtimeTimerRef.current) clearTimeout(bedtimeTimerRef.current);
      bedtimeTimerRef.current = window.setTimeout(() => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        soundEffects.stopLullaby();
        setIsLullabyPlaying(false);
        setIsPlayingVoice(false);
        toast.info('Đã hết giờ hẹn ru ngủ. Chúc bé ngủ ngon! 🌙');
      }, bedtimeTimerMinutes * 60 * 1000);
    }
    return () => {
      if (bedtimeTimerRef.current) clearTimeout(bedtimeTimerRef.current);
    };
  }, [bedtimeTimerMinutes]);

  // Trigger celebration & badge check on ending page
  useEffect(() => {
    if (currentPageIndex === totalPages && story) {
      soundEffects.playSuccess();
      soundEffects.playSparkle();
      if (story.child_id) {
        awardBadgeBySlug(story.child_id, 'bedtime_reader');
      }
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D13A5E', '#6C5CE7', '#C9F0DD', '#FFD6BA', '#FFF1B8'],
      });
    }
  }, [currentPageIndex, totalPages, story, awardBadgeBySlug]);

  // Stop TTS helper
  const stopVoice = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    setCurrentSentenceIndex(null);
  }, []);

  // Stop voice on page transition
  useEffect(() => {
    stopVoice();
  }, [currentPageIndex, stopVoice]);

  // Fullscreen toggler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not permitted
    }
  };

  // Turn page safely in FlipBook or Mobile with sound
  const goToPage = (pageIdx: number) => {
    const clamped = Math.max(0, Math.min(totalPages, pageIdx));
    if (clamped !== currentPageIndex) {
      soundEffects.playPageTurn();
    }
    setCurrentPageIndex(clamped);
    if (!isMobile && bookRef.current) {
      try {
        const pageFlip = bookRef.current.pageFlip();
        if (pageFlip) {
          // flip to spread index (each story page is 2 flipbook pages)
          pageFlip.turnToPage(clamped * 2);
        }
      } catch {
        // Ignored
      }
    }
  };

  // Flip callback from react-pageflip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFlip = (e: any) => {
    soundEffects.playPageTurn();
    const flipbookPage = e.data;
    const storyIdx = Math.floor(flipbookPage / 2);
    setCurrentPageIndex(Math.min(totalPages, storyIdx));
  };

  // TTS sentence breakdown for current page
  const currentPage = pages[Math.min(currentPageIndex, pages.length - 1)] || pages[0];
  const sentences = currentPage.text_content
    .split(/(?<=[.?!])\s+/)
    .filter((s) => s.trim().length > 0);

  const handlePlayVoice = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Trình duyệt không hỗ trợ Web Speech API.');
      return;
    }

    if (isPlayingVoice) {
      stopVoice();
      return;
    }

    if (!hasVietnameseVoice) {
      toast.info(vi.reader.noVietnameseVoice);
    }

    setIsPlayingVoice(true);
    let index = 0;

    const speakSentence = (idx: number) => {
      if (idx >= sentences.length) {
        setIsPlayingVoice(false);
        setCurrentSentenceIndex(null);
        // Auto-turn page if not ending page
        if (currentPageIndex < totalPages) {
          setTimeout(() => {
            goToPage(currentPageIndex + 1);
          }, 800);
        }
        return;
      }

      setCurrentSentenceIndex(idx);
      const textToSpeak = sentences[idx];
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'vi-VN';

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = isBedtimeMode ? 0.8 : speechRate;
      utterance.pitch = isBedtimeMode ? 0.9 : 1.05;

      utterance.onend = () => {
        speakSentence(idx + 1);
      };

      utterance.onerror = () => {
        setIsPlayingVoice(false);
        setCurrentSentenceIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakSentence(index);
  };

  const handleCopyShareLink = async () => {
    if (!story) return;
    if (!story.is_shared) {
      const ok = await toggleStoryShare(story.id, true);
      if (!ok) {
        toast.error('Không thể kích hoạt liên kết chia sẻ.');
        return;
      }
    }
    const url = `${window.location.origin}/shared/${story.share_token}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success(vi.share.copiedToast);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendReport = async () => {
    if (!story || !reportReason.trim()) return;
    const ok = await reportStory(story.id, reportReason.trim());
    if (ok) {
      setIsReportModalOpen(false);
      setReportReason('');
      toast.success(vi.report.reportSuccess);
    } else {
      toast.error('Không thể gửi báo cáo lúc này. Vui lòng thử lại.');
    }
  };

  // Clamped Ken Burns parameters to ensure artwork is NEVER cropped
  const focusRegion = currentPage.focus_region || { x: 50, y: 50, zoom: 1.15 };
  const safeZoom = Math.min(1.35, Math.max(1.0, focusRegion.zoom || 1.15));
  const clampedX = Math.max(20, Math.min(80, focusRegion.x ?? 50));
  const clampedY = Math.max(20, Math.min(80, focusRegion.y ?? 50));
  const panX = (50 - clampedX) * 0.25;
  const panY = (50 - clampedY) * 0.25;

  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Font size mapping
  const fontSizeClass = 
    fontSizeLevel === 'sm' ? 'text-[clamp(18px,2vw,24px)]' :
    fontSizeLevel === 'lg' ? 'text-[clamp(26px,2.8vw,36px)]' :
    'text-[clamp(22px,2.4vw,32px)]';

  // Grounded objects list
  const groundedObjects = story?.grounded_objects && story.grounded_objects.length > 0
    ? story.grounded_objects
    : story?.drawing?.ai_analysis?.objects || [];

  if (isLoadingStory && !story) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-bg">
        <div className="space-y-3">
          <Sparkles className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="text-sm font-heading font-bold text-ink-soft">Đang mở cuốn sách cổ tích...</p>
        </div>
      </div>
    );
  }

  if (!story || (isKidReaderMode && !isStoryApproved(story.status))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-bg">
        <div className="space-y-4">
          <p className="text-ink-soft font-heading font-bold">
            {isKidReaderMode && story
              ? 'Câu chuyện này đang chờ phụ huynh hoặc Ban Kiểm duyệt xem xét.'
              : 'Không tìm thấy câu chuyện này.'}
          </p>
          <Button variant="primary" onClick={() => navigate(isKidReaderMode ? '/kid' : '/library')}>
            {isKidReaderMode ? 'Quay lại Góc Bé' : vi.reader.backToLibrary}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-700 selection:bg-brand-100 selection:text-brand-700 ${
        isBedtimeMode
          ? 'bg-[#181424] text-[#F3EFE6]'
          : 'bg-[#FFF9F0] text-ink'
      }`}
    >
      {/* 1. TOP MINIMALIST HEADER */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 lg:px-8 py-3 transition-colors print:hidden ${
          isBedtimeMode
            ? 'bg-[#181424]/90 border-[#322947] text-[#F3EFE6]'
            : 'bg-surface/90 border-ink/10 text-ink'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Back button & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isKidReaderMode ? '/kid' : '/library')}
              className={`rounded-full min-h-[44px] ${isBedtimeMode ? 'text-[#F3EFE6] hover:bg-white/10' : ''}`}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">
                {isKidReaderMode ? 'Góc Bé' : vi.reader.backToLibrary}
              </span>
            </Button>

            <div className="min-w-0">
              <h1 className="font-heading font-extrabold text-sm sm:text-base truncate max-w-[200px] sm:max-w-sm md:max-w-md">
                {story.title}
              </h1>
              <p className={`text-xs font-semibold truncate ${isBedtimeMode ? 'text-[#C8B6FF]' : 'text-ink-soft'}`}>
                {currentPageIndex >= totalPages ? 'Trang kết' : `Trang ${currentPageIndex + 1} / ${totalPages}`} · Bé {story.child?.nickname || 'Bé'}
              </p>
            </div>
          </div>

          {/* Controls: Font Size, Bedtime, Fullscreen, Options */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-ink/5 rounded-full p-1 border border-ink/10">
              {(['sm', 'md', 'lg'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFontSizeLevel(lvl)}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                    fontSizeLevel === lvl
                      ? isBedtimeMode
                        ? 'bg-magic-600 text-white'
                        : 'bg-brand-600 text-white'
                      : isBedtimeMode
                      ? 'text-[#F3EFE6]/70 hover:text-white'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                  title={`Cỡ chữ: ${lvl.toUpperCase()}`}
                >
                  {lvl === 'sm' ? 'A' : lvl === 'md' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>

            {/* Bedtime Mode Toggle */}
            <Button
              variant={isBedtimeMode ? 'magic' : 'secondary'}
              size="sm"
              onClick={() => {
                const next = !isBedtimeMode;
                setIsBedtimeMode(next);
                if (next && story.child_id) {
                  awardBadgeBySlug(story.child_id, 'bedtime_reader');
                }
              }}
              leftIcon={isBedtimeMode ? <Sun className="w-3.5 h-3.5 text-butter" /> : <Moon className="w-3.5 h-3.5" />}
              className="rounded-full text-xs"
            >
              <span className="hidden md:inline">{isBedtimeMode ? 'Đèn ngày' : 'Ru ngủ'}</span>
            </Button>

            {/* Ambient Lullaby Music Toggle */}
            <button
              onClick={handleToggleLullaby}
              className={`p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
                isLullabyPlaying
                  ? 'bg-magic-600 text-white shadow-btn-magic'
                  : isBedtimeMode
                  ? 'text-[#F3EFE6]/80 hover:bg-white/10'
                  : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
              }`}
              title={isLullabyPlaying ? 'Tắt nhạc ru êm dịu' : 'Bật nhạc nền ru ngủ'}
              aria-label="Nhạc nền ru ngủ"
            >
              <Music className={`w-4 h-4 ${isLullabyPlaying ? 'animate-pulse' : ''}`} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
                isBedtimeMode
                  ? 'text-[#F3EFE6]/80 hover:bg-white/10'
                  : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
              }`}
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              aria-label="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Share (hidden in Kid Mode and only enabled for approved stories) */}
            {!isKidReaderMode && isStoryApproved(story.status) && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className={`p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
                  isBedtimeMode
                    ? 'text-[#F3EFE6]/80 hover:bg-white/10'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
                title={vi.share.title}
                aria-label={vi.share.title}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Print (hidden in Kid Mode) */}
            {!isKidReaderMode && (
              <button
                onClick={handlePrint}
                className={`hidden sm:flex p-2.5 rounded-full min-w-[44px] min-h-[44px] items-center justify-center transition-colors ${
                  isBedtimeMode
                    ? 'text-[#F3EFE6]/80 hover:bg-white/10'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
                title={vi.reader.printStory}
                aria-label={vi.reader.printStory}
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {/* Report (hidden in Kid Mode) */}
            {!isKidReaderMode && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className={`p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
                  isBedtimeMode
                    ? 'text-[#F3EFE6]/60 hover:text-danger hover:bg-white/10'
                    : 'text-ink-faint hover:text-danger hover:bg-danger-bg'
                }`}
                title={vi.reader.reportStory}
                aria-label={vi.reader.reportStory}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Parent Moderation Status Notice Banner */}
      {!isKidReaderMode && !isStoryApproved(story.status) && (
        <div
          className={`px-4 py-2 text-xs font-heading font-bold text-center border-b print:hidden ${
            story.status === 'rejected'
              ? 'bg-danger-bg text-danger-text border-danger-text/20'
              : 'bg-warning-bg text-warning-text border-warning-text/20'
          }`}
        >
          {story.status === 'rejected'
            ? `Truyện đã bị từ chối kiểm duyệt${story.rejection_reason ? `: ${story.rejection_reason}` : '.'}`
            : 'Truyện đang nằm trong Hàng chờ kiểm duyệt (ẩn khỏi Góc Bé cho đến khi được duyệt).'}
        </div>
      )}

      {/* Bedtime Active Indicator Banner */}
      {isBedtimeMode && (
        <div className="bg-[#241c3b] border-b border-[#3d2f61] px-4 py-2 text-xs text-[#E3D9FF] flex flex-wrap items-center justify-center gap-4 print:hidden">
          <div className="flex items-center gap-1.5 font-bold">
            <Moon className="w-3.5 h-3.5 text-butter animate-pulse" />
            <span>Chế độ ru ngủ đang bật: ánh sáng dịu, giọng kể chậm rãi</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Hẹn giờ tắt:</span>
            <select
              value={bedtimeTimerMinutes}
              onChange={(e) => setBedtimeTimerMinutes(Number(e.target.value))}
              aria-label="Hẹn giờ tắt âm thanh ru ngủ"
              className="bg-[#181424] border border-[#4c3b7a] rounded-full px-2.5 py-0.5 text-xs text-[#E3D9FF] focus:outline-none"
            >
              <option value={0}>Không hẹn giờ</option>
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
            </select>
          </div>
        </div>
      )}

      {/* 2. MAIN READING STAGE */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col justify-center items-center print:hidden">
        
        {/* DESKTOP / TABLET: 2-PAGE SPREAD WITH REACT-PAGEFLIP */}
        {!isMobile ? (
          <div className="w-full flex justify-center items-center py-2">
            <div className="relative shadow-pop rounded-[28px] overflow-hidden border border-ink/10 bg-surface">
              {/* Spine Gradient Center Shadow */}
              <div className="absolute inset-y-0 left-1/2 -ml-3 w-6 pointer-events-none z-20 bg-gradient-to-r from-black/10 via-black/25 to-black/10 opacity-60" />

              <HTMLFlipBook
                width={500}
                height={620}
                size="stretch"
                minWidth={380}
                maxWidth={560}
                minHeight={520}
                maxHeight={740}
                maxShadowOpacity={0.4}
                showCover={false}
                mobileScrollSupport={false}
                className="book-container"
                ref={bookRef}
                onFlip={onFlip}
                startPage={currentPageIndex * 2}
                drawShadow={true}
                flippingTime={800}
                usePortrait={false}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
                style={{}}
              >
                {/* Generate two facing pages for each story page */}
                {pages.map((pg, pgIdx) => {
                  const pgFocus = pg.focus_region || { x: 50, y: 50, zoom: 1.15 };
                  const pgZoom = Math.min(1.35, Math.max(1.0, pgFocus.zoom || 1.15));
                  const pgPanX = (50 - Math.max(20, Math.min(80, pgFocus.x ?? 50))) * 0.25;
                  const pgPanY = (50 - Math.max(20, Math.min(80, pgFocus.y ?? 50))) * 0.25;
                  const pgSentences = pg.text_content
                    .split(/(?<=[.?!])\s+/)
                    .filter((s) => s.trim().length > 0);
                  const isCurrentSpread = currentPageIndex === pgIdx;

                  return [
                    // LEFT SPREAD PAGE: Polaroid Artwork Frame
                    <FlipPage key={`left-${pg.id}`} isBedtime={isBedtimeMode} className="p-8 sm:p-10 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* Top Header of Left Page */}
                        <div className="flex items-center justify-between">
                          <Badge variant={isBedtimeMode ? 'lavender' : 'peach'} size="sm">
                            {pg.page_number === 1 ? 'Khởi đầu' : `Chương ${pg.page_number}`}
                          </Badge>
                          <span className="text-xs font-bold font-heading px-2.5 py-1 rounded-full bg-ink/5 flex items-center gap-1">
                            <span>{getEmotionEmoji(pg.emotion)}</span>
                            <span className="capitalize">{pg.emotion}</span>
                          </span>
                        </div>

                        {/* Polaroid / Paper Framed Artwork */}
                        <div className="p-3 pb-5 bg-white rounded-2xl shadow-card border border-ink/10 rotate-[-1deg] transition-transform hover:rotate-0">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center">
                            {story.drawing?.image_path ? (
                              <motion.img
                                key={pg.id}
                                src={story.drawing.image_path}
                                alt={story.title}
                                initial={isReducedMotion ? false : { scale: 1, x: 0, y: 0 }}
                                animate={
                                  isReducedMotion || !isCurrentSpread
                                    ? { scale: 1, x: 0, y: 0 }
                                    : {
                                        scale: pgZoom,
                                        x: `${pgPanX}%`,
                                        y: `${pgPanY}%`,
                                      }
                                }
                                transition={{ duration: 4.5, ease: 'easeInOut' }}
                                className="w-full h-full object-contain select-none"
                              />
                            ) : (
                              <div className="text-6xl select-none">🎨</div>
                            )}
                          </div>
                          <p className="text-[11px] font-heading font-bold text-ink-faint text-center mt-2 tracking-wide">
                            Tranh vẽ của Bé {story.child?.nickname || ''}
                          </p>
                        </div>
                      </div>

                      {/* "Bé đã vẽ, AI thấy gì" Grounded Object Chips */}
                      {groundedObjects.length > 0 && (
                        <div className={`pt-3 border-t space-y-1.5 ${isBedtimeMode ? 'border-white/10' : 'border-ink/10'}`}>
                          <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isBedtimeMode ? 'text-[#E3D9FF]' : 'text-ink-soft'}`}>
                            <Sparkles className={`w-3 h-3 ${isBedtimeMode ? 'text-butter' : 'text-magic-600'}`} />
                            <span>Bé đã vẽ, AI thấy gì:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {groundedObjects.slice(0, 4).map((obj: string, oIdx: number) => (
                              <span
                                key={oIdx}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isBedtimeMode
                                    ? 'bg-[#32274d] text-[#F3EFE6] border-[#4a3a70]'
                                    : 'bg-surface-2 text-ink-soft border-ink/10'
                                }`}
                              >
                                ✨ {obj}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </FlipPage>,

                    // RIGHT SPREAD PAGE: Modern Story Text with Karaoke Sentence Highlight
                    <FlipPage key={`right-${pg.id}`} isBedtime={isBedtimeMode} className="p-8 sm:p-12 flex flex-col justify-between">
                      <div className="space-y-6">
                        {/* Top Header of Right Page */}
                        <div className={`flex items-center justify-between text-xs font-bold border-b pb-3 ${
                          isBedtimeMode ? 'text-[#C8B6FF] border-white/10' : 'text-ink-soft border-ink/10'
                        }`}>
                          <span className={`font-heading tracking-wider uppercase text-[11px] truncate max-w-[240px] ${
                            isBedtimeMode ? 'text-butter' : 'text-brand-600'
                          }`}>
                            {story.title}
                          </span>
                          <span>Trang {pg.page_number} / {totalPages}</span>
                        </div>

                        {/* Main Story Text with Karaoke Highlighting */}
                        <div className={`font-story leading-[1.7] ${fontSizeClass} tracking-wide space-y-2 select-text`}>
                          {pgSentences.map((sent, sIdx) => {
                            const isHighlighted = isCurrentSpread && isPlayingVoice && currentSentenceIndex === sIdx;
                            return (
                              <span
                                key={sIdx}
                                className={`transition-all duration-300 rounded-lg px-1.5 py-0.5 inline-block ${
                                  isHighlighted
                                    ? isBedtimeMode
                                      ? 'bg-butter text-[#181424] font-black shadow-sm scale-[1.02]'
                                      : 'bg-brand-100 text-brand-700 font-black shadow-sm scale-[1.02]'
                                    : ''
                                }`}
                              >
                                {sent}{' '}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Page Footer Decor */}
                      <div className={`pt-4 border-t flex items-center justify-between text-xs font-heading ${
                        isBedtimeMode ? 'border-white/10 text-[#C8B6FF]/70' : 'border-ink/10 text-ink-faint'
                      }`}>
                        <span>DrawToStory</span>
                        <span>· {pg.page_number} ·</span>
                      </div>
                    </FlipPage>,
                  ];
                })}

                {/* FINAL SPREAD: CELEBRATION & NEXT DRAWING IDEAS */}
                <FlipPage key="final-left" isBedtime={isBedtimeMode} className="p-8 sm:p-12 flex flex-col justify-between">
                  <div className="space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-butter/30 mx-auto flex items-center justify-center text-4xl shadow-sm">
                      🎉
                    </div>
                    <div className="space-y-2">
                      <h2 className={`text-2xl sm:text-3xl font-heading font-extrabold ${isBedtimeMode ? 'text-[#F3EFE6]' : 'text-ink'}`}>
                        {vi.reader.congratsTitle}
                      </h2>
                      <p className={`text-sm font-semibold leading-relaxed max-w-sm mx-auto ${isBedtimeMode ? 'text-[#C9F0DD]' : 'text-success'}`}>
                        💡 {vi.reader.moralTitle}{' '}
                        <strong className={isBedtimeMode ? 'text-white' : 'text-ink'}>{story.moral}</strong>
                      </p>
                    </div>

                    {/* Kid Emotion Feedback Buttons */}
                    <div className={`p-4 rounded-2xl border space-y-2 max-w-xs mx-auto ${
                      isBedtimeMode ? 'bg-[#2c2445] border-white/10' : 'bg-surface-2 border-ink/10'
                    }`}>
                      <p className={`text-xs font-bold ${isBedtimeMode ? 'text-[#E3D9FF]' : 'text-ink-soft'}`}>
                        Bé thấy câu chuyện hôm nay thế nào?
                      </p>
                      <div className="flex justify-center gap-3">
                        {[
                          { key: 'love', emoji: '😍', label: 'Rất thích' },
                          { key: 'happy', emoji: '🙂', label: 'Vui vẻ' },
                          { key: 'neutral', emoji: '😕', label: 'Bình thường' },
                        ].map((rx) => (
                          <button
                            key={rx.key}
                            onClick={() => {
                              soundEffects.playMagic();
                              setKidReaction(rx.key as 'love' | 'happy' | 'neutral');
                              toast.success('Cảm ơn bé đã chấm điểm câu chuyện! ❤️');
                            }}
                            className={`p-2.5 rounded-2xl text-2xl transition-all transform ${
                              kidReaction === rx.key
                                ? 'bg-brand-600 scale-125 shadow-btn-primary'
                                : isBedtimeMode
                                ? 'bg-[#382e57] hover:scale-110 shadow-sm border border-white/10'
                                : 'bg-surface hover:scale-110 shadow-sm border border-ink/10'
                            }`}
                            title={rx.label}
                          >
                            {rx.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`text-center text-xs ${isBedtimeMode ? 'text-[#C8B6FF]/70' : 'text-ink-faint'}`}>
                    Bé hãy tiếp tục khám phá thêm các bức vẽ mới nhé!
                  </div>
                </FlipPage>

                <FlipPage key="final-right" isBedtime={isBedtimeMode} className="p-8 sm:p-12 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className={`flex items-center gap-2 border-b pb-3 ${isBedtimeMode ? 'border-white/10' : 'border-ink/10'}`}>
                      <Sparkles className={`w-5 h-5 ${isBedtimeMode ? 'text-butter' : 'text-magic-600'}`} />
                      <h3 className={`font-heading font-black text-lg ${isBedtimeMode ? 'text-[#F3EFE6]' : 'text-ink'}`}>
                        {vi.reader.nextDrawingIdeasTitle}
                      </h3>
                    </div>
                    <p className={`text-xs ${isBedtimeMode ? 'text-[#C8B6FF]' : 'text-ink-soft'}`}>
                      {vi.reader.nextDrawingSubtitle}
                    </p>

                    {/* 3 Next Drawing Ideas */}
                    <div className="space-y-2.5">
                      {story.next_drawing_ideas?.map((idea, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border shadow-card flex items-center gap-3 text-xs font-bold group transition-colors ${
                            isBedtimeMode
                              ? 'bg-[#2c2445] border-white/10 text-[#F3EFE6] hover:border-butter'
                              : 'bg-surface border-ink/10 text-ink hover:border-brand-600'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-peach flex items-center justify-center text-ink shrink-0 font-extrabold text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{idea}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Print & Read Again */}
                  <div className={`pt-4 border-t flex items-center justify-between gap-3 ${isBedtimeMode ? 'border-white/10' : 'border-ink/10'}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => goToPage(0)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Đọc lại từ đầu
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handlePrint}
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                    >
                      In tranh & truyện
                    </Button>
                  </div>
                </FlipPage>
              </HTMLFlipBook>
            </div>
          </div>
        ) : (
          /* MOBILE SINGLE PAGE VIEW: Top 55% Artwork, Bottom 45% Text with Swipe */
          <div className="w-full flex flex-col gap-4">
            {currentPageIndex < totalPages ? (
              <>
                {/* Mobile Top 55% Artwork Stage */}
                <div className="relative rounded-[24px] overflow-hidden bg-white p-3 shadow-card border border-ink/10">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center">
                    {story.drawing?.image_path ? (
                      <motion.img
                        key={currentPage.id}
                        src={story.drawing.image_path}
                        alt={story.title}
                        initial={isReducedMotion ? false : { scale: 1, x: 0, y: 0 }}
                        animate={isReducedMotion ? { scale: 1, x: 0, y: 0 } : {
                          scale: safeZoom,
                          x: `${panX}%`,
                          y: `${panY}%`,
                        }}
                        transition={{ duration: 3.5, ease: 'easeInOut' }}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-6xl">🎨</div>
                    )}
                  </div>

                  {/* Badges on mobile artwork */}
                  <div className="absolute top-5 left-5">
                    <Badge variant="neutral" size="sm" className="shadow-sm">
                      {getEmotionEmoji(currentPage.emotion)} {currentPage.emotion}
                    </Badge>
                  </div>

                  <div className="absolute top-5 right-5">
                    <Badge variant="primary" size="sm">
                      Trang {currentPage.page_number} / {totalPages}
                    </Badge>
                  </div>
                </div>

                {/* Mobile Bottom Text with Karaoke Highlighting */}
                <div className={`p-5 rounded-[24px] border border-ink/10 shadow-card transition-colors ${
                  isBedtimeMode ? 'bg-[#231e38] text-[#F3EFE6]' : 'bg-surface text-ink'
                }`}>
                  <div className={`font-story leading-[1.7] ${fontSizeClass} space-y-1.5`}>
                    {sentences.map((sent, sIdx) => {
                      const isHighlighted = isPlayingVoice && currentSentenceIndex === sIdx;
                      return (
                        <span
                          key={sIdx}
                          className={`transition-all duration-300 rounded px-1 ${
                            isHighlighted
                              ? isBedtimeMode
                                ? 'bg-butter text-[#181424] font-black'
                                : 'bg-brand-100 text-brand-700 font-black'
                              : ''
                          }`}
                        >
                          {sent}{' '}
                        </span>
                      );
                    })}
                  </div>

                  {/* Mobile Grounded Objects Tags */}
                  {groundedObjects.length > 0 && (
                    <div className={`mt-4 pt-3 border-t flex flex-wrap gap-1.5 ${isBedtimeMode ? 'border-white/10' : 'border-ink/10'}`}>
                      {groundedObjects.slice(0, 3).map((obj: string, oIdx: number) => (
                        <span
                          key={oIdx}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isBedtimeMode
                              ? 'bg-[#32274d] text-[#F3EFE6] border-[#4a3a70]'
                              : 'bg-surface-2 text-ink-soft border-ink/10'
                          }`}
                        >
                          ✨ {obj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Mobile Ending Page */
              <div className={`p-6 rounded-[28px] border shadow-card text-center space-y-5 ${
                isBedtimeMode ? 'bg-[#231e38] border-white/10 text-[#F3EFE6]' : 'bg-surface border-ink/10 text-ink'
              }`}>
                <div className="text-5xl">🎉</div>
                <h2 className={`text-2xl font-heading font-black ${isBedtimeMode ? 'text-[#F3EFE6]' : 'text-ink'}`}>
                  {vi.reader.congratsTitle}
                </h2>
                <p className={`text-sm font-semibold ${isBedtimeMode ? 'text-[#C9F0DD]' : 'text-success'}`}>
                  💡 {vi.reader.moralTitle}{' '}
                  <strong className={isBedtimeMode ? 'text-white' : 'text-ink'}>{story.moral}</strong>
                </p>

                {/* Rating */}
                <div className="flex justify-center gap-3 pt-2">
                  {[
                    { key: 'love', emoji: '😍' },
                    { key: 'happy', emoji: '🙂' },
                    { key: 'neutral', emoji: '😕' },
                  ].map((rx) => (
                    <button
                      key={rx.key}
                      onClick={() => {
                        soundEffects.playMagic();
                        setKidReaction(rx.key as 'love' | 'happy' | 'neutral');
                        toast.success('Cảm ơn bé đã chấm điểm! ❤️');
                      }}
                      className={`p-3 rounded-2xl text-2xl transition-all ${
                        kidReaction === rx.key
                          ? 'bg-brand-600 scale-110 shadow-btn-primary'
                          : isBedtimeMode
                          ? 'bg-[#32274d]'
                          : 'bg-surface-2'
                      }`}
                    >
                      {rx.emoji}
                    </button>
                  ))}
                </div>

                {/* Next Drawing Ideas */}
                <div className={`text-left space-y-2 pt-3 border-t ${isBedtimeMode ? 'border-white/10' : 'border-ink/10'}`}>
                  <p className={`text-xs font-bold ${isBedtimeMode ? 'text-[#C8B6FF]' : 'text-ink-soft'}`}>
                    {vi.reader.nextDrawingIdeasTitle}:
                  </p>
                  {story.next_drawing_ideas?.map((idea, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs font-bold ${
                        isBedtimeMode ? 'bg-[#2c2445] text-[#F3EFE6]' : 'bg-surface-2 text-ink'
                      }`}
                    >
                      ✏️ {idea}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="md" className="flex-1" onClick={() => goToPage(0)}>
                    Đọc lại
                  </Button>
                  <Button variant="primary" size="md" className="flex-1" onClick={handlePrint}>
                    In tranh
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PRINTABLE FULL STORYBOOK LAYOUT (Visible only during window.print()) */}
      <section className="hidden print:block p-8 bg-white text-black space-y-6">
        <div className="text-center border-b border-black/20 pb-4 space-y-1">
          <h1 className="text-2xl font-heading font-extrabold">{story.title}</h1>
          <p className="text-sm">
            Sáng tác từ nét vẽ của Bé {story.child?.nickname || 'Bé yêu'} · DrawToStory
          </p>
        </div>

        {story.drawing?.image_path && (
          <div className="max-w-md mx-auto border border-black/15 rounded-2xl p-3">
            <img
              src={story.drawing.image_path}
              alt={story.title}
              className="w-full max-h-64 object-contain mx-auto"
            />
          </div>
        )}

        <div className="space-y-4">
          {pages.map((pg) => (
            <div key={pg.id} className="p-4 border border-black/15 rounded-xl break-inside-avoid">
              <div className="text-xs font-bold uppercase mb-1">
                Trang {pg.page_number} / {totalPages} — Cảm xúc: {pg.emotion}
              </div>
              <p className="font-story text-lg leading-relaxed">{pg.text_content}</p>
            </div>
          ))}
        </div>

        {story.moral && (
          <div className="p-4 border-t border-black/20 text-sm font-bold">
            Bài học yêu thương: <span className="font-normal">{story.moral}</span>
          </div>
        )}
      </section>

      {/* 3. STICKY BOTTOM PLAYBACK CONTROLLER */}
      <footer
        className={`sticky bottom-0 z-30 backdrop-blur-md border-t px-4 py-3 transition-colors print:hidden ${
          isBedtimeMode
            ? 'bg-[#181424]/95 border-[#322947]'
            : 'bg-surface/95 border-ink/10'
        }`}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left: Previous Page & Dot Pagination */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPageIndex === 0}
              onClick={() => goToPage(currentPageIndex - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              className="rounded-full min-h-[44px]"
            >
              <span className="hidden sm:inline">{vi.reader.previousPage}</span>
            </Button>

            {/* Dot Pagination Indicator */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 min-h-[44px] min-w-[20px] flex items-center justify-center ${
                    idx === currentPageIndex
                      ? isBedtimeMode
                        ? 'w-6 bg-magic-600'
                        : 'w-6 bg-brand-600'
                      : isBedtimeMode
                      ? 'w-2.5 bg-white/20 hover:bg-white/40'
                      : 'w-2.5 bg-ink/15 hover:bg-ink/30'
                  }`}
                  aria-label={idx === totalPages ? 'Trang kết' : `Trang ${idx + 1}`}
                >
                  <span className="sr-only">{idx === totalPages ? 'Trang kết' : `Trang ${idx + 1}`}</span>
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPageIndex >= totalPages}
              onClick={() => goToPage(currentPageIndex + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              className="rounded-full min-h-[44px]"
            >
              <span className="hidden sm:inline">{vi.reader.nextPage}</span>
            </Button>
          </div>

          {/* Center / Right: Big 56px TTS Play/Pause & Voice Settings */}
          <div className="flex items-center gap-3">
            
            {/* Vietnamese Voice Selector */}
            {vietnameseVoices.length > 1 && (
              <select
                value={selectedVoice?.voiceURI || ''}
                onChange={(e) => {
                  const v = vietnameseVoices.find((vox) => vox.voiceURI === e.target.value);
                  if (v) {
                    setSelectedVoice(v);
                    if (isPlayingVoice) stopVoice();
                    toast.info(`Đã đổi giọng đọc: ${v.name.split(' ')[0]}`);
                  }
                }}
                className={`text-[11px] font-bold px-2 py-1 rounded-full border border-ink/10 cursor-pointer focus:outline-none transition-colors max-w-[125px] sm:max-w-none truncate ${
                  isBedtimeMode
                    ? 'bg-[#231e38] text-[#F3EFE6] border-[#3d3257]'
                    : 'bg-surface-2 text-ink'
                }`}
                aria-label="Chọn giọng đọc tiếng Việt"
              >
                {vietnameseVoices.map((v) => {
                  let label = 'Tiếng Việt';
                  if (v.name.includes('HoaiMy')) label = 'Hoài My (Nữ)';
                  else if (v.name.includes('NamMinh')) label = 'Nam Minh (Nam)';
                  else if (v.name.includes('An')) label = 'An (Thiếu nhi)';
                  else if (v.name.includes('Google')) label = 'Google Tiếng Việt';
                  else if (v.name.includes('Linh')) label = 'Linh (Nữ)';
                  else label = v.name.replace(/Microsoft|Online|\(Natural\)|\(Vietnam\)/gi, '').trim() || v.name;
                  return (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      🎙️ {label}
                    </option>
                  );
                })}
              </select>
            )}

            {/* Speed Selector */}
            <div className="flex items-center gap-1 text-xs font-bold text-ink-soft">
              <Volume2 className="w-3.5 h-3.5 hidden sm:inline" />
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setSpeechRate(rate);
                    if (isPlayingVoice) stopVoice();
                  }}
                  className={`px-2 py-1 rounded-full text-xs font-bold transition-all min-h-[36px] ${
                    speechRate === rate
                      ? isBedtimeMode
                        ? 'bg-magic-600 text-white'
                        : 'bg-brand-600 text-white'
                      : isBedtimeMode
                      ? 'bg-white/10 text-[#F3EFE6]'
                      : 'bg-surface-2 text-ink-soft hover:text-ink'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Giant 56px Play/Pause Button */}
            <Button
              variant={isBedtimeMode ? 'magic' : 'primary'}
              size="lg"
              onClick={handlePlayVoice}
              className="w-14 h-14 rounded-full shadow-btn-primary p-0 flex items-center justify-center shrink-0"
              aria-label={isPlayingVoice ? vi.reader.pauseVoice : vi.reader.playVoice}
            >
              {isPlayingVoice ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={vi.share.title}
        description={vi.share.subtitle}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-surface-2 rounded-2xl border border-ink/10 flex items-center justify-between gap-2">
            <span className="text-xs text-ink font-mono truncate">
              {window.location.origin}/shared/{story.share_token}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyShareLink}
              leftIcon={isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {isCopied ? 'Đã chép' : vi.share.copyButton}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-ink/10">
            <span className="text-xs text-ink-soft">Trạng thái chia sẻ:</span>
            <button
              onClick={async () => {
                await toggleStoryShare(story.id, !story.is_shared);
                toast.success(story.is_shared ? 'Đã hủy chia sẻ công khai' : 'Đã bật chia sẻ công khai');
              }}
              className="text-xs font-heading font-bold text-brand-600 hover:underline"
            >
              {story.is_shared ? vi.share.revokeButton : 'Bật chia sẻ liên kết'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={vi.report.title}
        description={vi.report.subtitle}
      >
        <div className="space-y-4 pt-2">
          <Textarea
            label={vi.report.reasonLabel}
            placeholder={vi.report.reasonPlaceholder}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={4}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsReportModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!reportReason.trim()}
              onClick={handleSendReport}
            >
              {vi.report.submitReport}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

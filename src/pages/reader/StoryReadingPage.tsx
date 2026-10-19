import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoryStore } from '@/store/storyStore';
import { vi } from '@/lib/i18n/vi';
import { Story, StoryPage } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';

export const StoryReadingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stories, toggleStoryShare, reportStory, logReadingEvent } = useStoryStore();

  const story: Story | undefined = stories.find((s) => s.id === id) || stories[0];
  const pages: StoryPage[] = story?.pages && story.pages.length > 0
    ? story.pages
    : [
        {
          id: 'p1',
          story_id: story?.id || '',
          page_number: 1,
          text_content: 'Ngày xửa ngày xưa, trong một khu rừng thần tiên tràn ngập ánh nắng ban mai...',
          emotion: 'hân hoan',
          focus_region: { x: 30, y: 40, zoom: 1.4 },
          created_at: new Date().toISOString(),
        },
      ];

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Bedtime Mode State
  const [isBedtimeMode, setIsBedtimeMode] = useState(false);
  const [bedtimeTimerMinutes, setBedtimeTimerMinutes] = useState<number>(0);
  const bedtimeTimerRef = useRef<number | null>(null);

  // TTS State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [_availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(true);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const readingTimeSecondsRef = useRef(0);

  // Track listening time
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

  // Load voices for Web Speech API
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        const viVoice = voices.find(
          (v) => v.lang.includes('vi') || v.lang.includes('VI') || v.name.toLowerCase().includes('vietnam')
        );

        if (viVoice) {
          setSelectedVoice(viVoice);
          setHasVietnameseVoice(true);
        } else {
          setHasVietnameseVoice(false);
          if (voices.length > 0) setSelectedVoice(voices[0]);
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
        setIsPlayingVoice(false);
        toast.info('Đã hết giờ hẹn ru ngủ. Chúc bé ngủ ngon! 🌙');
      }, bedtimeTimerMinutes * 60 * 1000);
    }
    return () => {
      if (bedtimeTimerRef.current) clearTimeout(bedtimeTimerRef.current);
    };
  }, [bedtimeTimerMinutes]);

  // Trigger Confetti on the last page
  useEffect(() => {
    if (currentPageIndex === pages.length - 1) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8FA3', '#7C6CF0', '#C9F0DD', '#FFD6BA'],
      });
    }
  }, [currentPageIndex, pages.length]);

  // Stop TTS on unmount or page change
  const stopVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    setCurrentSentenceIndex(null);
  };

  useEffect(() => {
    return () => stopVoice();
  }, [currentPageIndex]);

  // Read current page aloud
  const currentPage = pages[currentPageIndex] || pages[0];
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
        // Auto-turn page if not last page
        if (currentPageIndex < pages.length - 1) {
          setTimeout(() => {
            setCurrentPageIndex((prev) => prev + 1);
          }, 800);
        }
        return;
      }

      setCurrentSentenceIndex(idx);
      const textToSpeak = sentences[idx];
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

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

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/shared/${story?.share_token}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success(vi.share.copiedToast);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendReport = async () => {
    if (!story || !reportReason.trim()) return;
    await reportStory(story.id, reportReason.trim());
    setIsReportModalOpen(false);
    toast.success(vi.report.reportSuccess);
  };

  if (!story) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-main-muted">Không tìm thấy câu chuyện này.</p>
        <Link to="/library">
          <Button variant="primary">{vi.reader.backToLibrary}</Button>
        </Link>
      </div>
    );
  }

  const focusRegion = currentPage.focus_region || { x: 50, y: 50, zoom: 1.3 };

  return (
    <div
      className={`min-h-[calc(100vh-140px)] transition-colors duration-700 rounded-3xl p-4 md:p-8 ${
        isBedtimeMode
          ? 'bg-indigo-950 text-indigo-100 shadow-2xl'
          : 'bg-white/60 text-main'
      }`}
    >
      {/* Top Reading Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <button
          onClick={() => navigate('/library')}
          className={`flex items-center gap-1.5 text-xs font-heading font-bold px-3 py-2 rounded-xl transition-colors min-h-[44px] ${
            isBedtimeMode
              ? 'text-indigo-200 hover:bg-indigo-900'
              : 'text-main-muted hover:text-main hover:bg-peach/30'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{vi.reader.backToLibrary}</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Bedtime Mode Toggle */}
          <Button
            variant={isBedtimeMode ? 'bedtime' : 'outline'}
            size="sm"
            onClick={() => setIsBedtimeMode(!isBedtimeMode)}
            leftIcon={isBedtimeMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          >
            {isBedtimeMode ? 'Đèn ngày' : vi.reader.bedtimeMode}
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Share2 className="w-4 h-4" />}
            className={isBedtimeMode ? 'text-indigo-200 hover:bg-indigo-900' : ''}
          >
            {vi.share.title.split(' ')[0]}
          </Button>

          {/* Print Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className={isBedtimeMode ? 'text-indigo-200 hover:bg-indigo-900' : ''}
          >
            {vi.reader.printStory}
          </Button>

          {/* Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className={`p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isBedtimeMode ? 'text-indigo-300 hover:bg-indigo-900' : 'text-main-muted hover:text-rose-500'
            }`}
            title={vi.reader.reportStory}
            aria-label={vi.reader.reportStory}
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bedtime Active Banner */}
      {isBedtimeMode && (
        <div className="mb-6 p-3.5 rounded-2xl bg-indigo-900/80 border border-indigo-700/50 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{vi.reader.bedtimeActive}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{vi.reader.bedtimeTimer}</span>
            <select
              value={bedtimeTimerMinutes}
              onChange={(e) => setBedtimeTimerMinutes(Number(e.target.value))}
              className="bg-indigo-950 border border-indigo-700 rounded-lg px-2 py-1 text-xs text-amber-200 focus:outline-none"
            >
              <option value={0}>{vi.reader.timerOff}</option>
              <option value={15}>{vi.reader.timer15m}</option>
              <option value={30}>{vi.reader.timer30m}</option>
            </select>
          </div>
        </div>
      )}

      {/* Story Book Container */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Story Title & Child Tag */}
        <div className="text-center space-y-1">
          <Badge variant={isBedtimeMode ? 'neutral' : 'mint'} size="sm">
            🎨 {story.child?.nickname || 'Bé'} ({story.child?.age || 5} tuổi)
          </Badge>
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-heading font-black ${
              isBedtimeMode ? 'text-amber-100' : 'text-main'
            }`}
          >
            {story.title}
          </h1>
        </div>

        {/* Two-Column Picture Book Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Column: Ken Burns Zoomed Drawing */}
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-cream-300 relative shadow-soft-lg border-2 border-peach/50">
            {story.drawing?.image_path ? (
              <motion.img
                key={currentPage.id}
                src={story.drawing.image_path}
                alt={story.title}
                initial={{
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  scale: focusRegion.zoom,
                  x: `${(50 - focusRegion.x) * 0.4}%`,
                  y: `${(50 - focusRegion.y) * 0.4}%`,
                }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
                className="w-full h-full object-cover origin-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🎨
              </div>
            )}

            {/* Emotion Tag */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-main shadow-soft">
              Cảm xúc: {currentPage.emotion}
            </div>
          </div>

          {/* Right Column: Book Page Text Content with Airy Typography */}
          <div
            className={`p-6 sm:p-8 md:p-10 rounded-3xl flex flex-col justify-between min-h-[300px] border transition-colors shadow-soft ${
              isBedtimeMode
                ? 'bg-indigo-900/60 border-indigo-700/60 text-indigo-100'
                : 'bg-white border-white text-main'
            }`}
          >
            {/* Page Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-heading font-bold text-main-muted">
                <span className={isBedtimeMode ? 'text-indigo-300' : 'text-primary'}>
                  {vi.reader.pageOf} {currentPage.page_number} / {pages.length}
                </span>
                <span className={isBedtimeMode ? 'text-indigo-300' : 'text-accent'}>
                  ✨ DrawToStory
                </span>
              </div>

              {/* Text with real-time sentence highlighting */}
              <div className="text-lg sm:text-xl md:text-2xl font-sans font-medium leading-relaxed tracking-wide space-y-2">
                {sentences.map((sent, sIdx) => {
                  const isHighlighted = isPlayingVoice && currentSentenceIndex === sIdx;
                  return (
                    <span
                      key={sIdx}
                      className={`transition-colors duration-200 rounded px-1 ${
                        isHighlighted
                          ? isBedtimeMode
                            ? 'bg-amber-400 text-indigo-950 font-bold'
                            : 'bg-primary-light text-primary-dark font-bold'
                          : ''
                      }`}
                    >
                      {sent}{' '}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Reading Audio Control Bar */}
            <div className="mt-8 pt-4 border-t border-peach/30 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant={isBedtimeMode ? 'bedtime' : 'primary'}
                size="md"
                onClick={handlePlayVoice}
                leftIcon={isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {isPlayingVoice ? vi.reader.pauseVoice : vi.reader.playVoice}
              </Button>

              {/* Voice Speed Controls */}
              <div className="flex items-center gap-2 text-xs">
                <Volume2 className="w-4 h-4 text-main-muted" />
                <span className="font-heading font-bold text-main-muted">
                  {vi.reader.voiceSpeed}
                </span>
                {[0.8, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      if (isPlayingVoice) stopVoice();
                    }}
                    className={`px-2 py-1 rounded-lg font-bold min-h-[36px] ${
                      speechRate === rate
                        ? 'bg-primary text-white'
                        : isBedtimeMode
                        ? 'bg-indigo-800 text-indigo-200'
                        : 'bg-cream-200 text-main'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Page Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 no-print">
          <Button
            variant="outline"
            size="md"
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            {vi.reader.previousPage}
          </Button>

          {/* Quick Page Jump Dots */}
          <div className="flex items-center gap-2">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPageIndex(idx)}
                className={`h-3 rounded-full transition-all duration-300 min-h-[44px] min-w-[20px] flex items-center justify-center ${
                  idx === currentPageIndex
                    ? 'w-8 bg-primary'
                    : isBedtimeMode
                    ? 'w-3 bg-indigo-800 hover:bg-indigo-700'
                    : 'w-3 bg-peach hover:bg-primary/50'
                }`}
                aria-label={`Trang ${idx + 1}`}
              >
                <span className="sr-only">Trang {idx + 1}</span>
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            {vi.reader.nextPage}
          </Button>
        </div>

        {/* Last Page Celebration & Next Drawing Ideas */}
        {currentPageIndex === pages.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 md:p-8 rounded-3xl border-2 space-y-6 ${
              isBedtimeMode
                ? 'bg-indigo-900/80 border-indigo-700 text-indigo-100'
                : 'bg-mint-light/80 border-mint text-main shadow-soft'
            }`}
          >
            <div className="text-center space-y-2">
              <span className="text-4xl block">🎉</span>
              <h3 className="text-xl md:text-2xl font-heading font-black">
                {vi.reader.congratsTitle}
              </h3>
              <p className="text-sm font-semibold text-emerald-800">
                💡 {vi.reader.moralTitle} <strong className="text-main">{story.moral}</strong>
              </p>
            </div>

            {/* Next Drawing Ideas */}
            <div className="space-y-3 pt-3 border-t border-mint">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h4 className="font-heading font-black text-base">
                  {vi.reader.nextDrawingIdeasTitle}
                </h4>
              </div>
              <p className="text-xs text-main-muted">
                {vi.reader.nextDrawingSubtitle}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {story.next_drawing_ideas?.map((idea, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                      isBedtimeMode
                        ? 'bg-indigo-950 border-indigo-700 text-indigo-200'
                        : 'bg-white border-peach/50 text-main shadow-soft'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-peach flex items-center justify-center font-bold text-main shrink-0">
                      {idx + 1}
                    </span>
                    <span>{idea}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={vi.share.title}
        description={vi.share.subtitle}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-cream-200 rounded-2xl border border-peach/50 flex items-center justify-between gap-2">
            <span className="text-xs text-main font-mono truncate">
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

          <div className="flex items-center justify-between pt-4 border-t border-peach/30">
            <span className="text-xs text-main-muted">Trạng thái chia sẻ:</span>
            <button
              onClick={async () => {
                await toggleStoryShare(story.id, !story.is_shared);
                toast.success(story.is_shared ? 'Đã hủy chia sẻ công khai' : 'Đã bật chia sẻ công khai');
              }}
              className="text-xs font-heading font-bold text-primary hover:underline"
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

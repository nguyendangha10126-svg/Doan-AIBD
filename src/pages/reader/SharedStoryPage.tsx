import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Play, Pause, BookOpen, Heart } from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { supabase, supabaseUrl, isDemoMode } from '@/lib/supabase';
import { Story, isStoryApproved } from '@/types/database';
import { vi } from '@/lib/i18n/vi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const SharedStoryPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { stories } = useStoryStore();
  const [dbStory, setDbStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadSharedStory() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (!isDemoMode) {
        try {
          const { data } = await supabase
            .from('stories')
            .select('*, pages:story_pages(*), drawing:drawings(*), child:children(*)')
            .eq('share_token', token)
            .eq('is_shared', true)
            .maybeSingle();

          if (mounted && data && isStoryApproved((data as Story).status)) {
            const raw = data as Story;
            const sortedPages = raw.pages
              ? [...raw.pages].sort((a, b) => a.page_number - b.page_number)
              : [];
            setDbStory({ ...raw, pages: sortedPages });
          } else if (mounted && supabaseUrl) {
            const fnRes = await fetch(
              `${supabaseUrl}/functions/v1/get-shared-story?token=${encodeURIComponent(token)}`
            );
            if (fnRes.ok) {
              const fnJson = await fnRes.json();
              if (fnJson?.data && isStoryApproved(fnJson.data.status)) {
                const raw = fnJson.data as Story & { signedImageUrl?: string };
                const resolvedDrawing = raw.drawing
                  ? {
                      ...raw.drawing,
                      image_path: raw.signedImageUrl || raw.drawing.image_path,
                    }
                  : undefined;
                setDbStory({
                  ...raw,
                  drawing: resolvedDrawing,
                });
              }
            }
          }
        } catch (err) {
          console.error('Error fetching shared story:', err);
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    }

    loadSharedStory();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Select natural Vietnamese voice
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const viVoices = voices.filter(
          (v) =>
            v.lang.toLowerCase().startsWith('vi') ||
            v.name.toLowerCase().includes('vietnam') ||
            v.name.includes('HoaiMy') ||
            v.name.includes('NamMinh')
        );
        if (viVoices.length > 0) {
          const best =
            viVoices.find(
              (v) => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('HoaiMy')
            ) || viVoices[0];
          setSelectedVoice(best);
        }
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    stopSpeech();
  }, [pageIndex, stopSpeech]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  // Strict token matching ONLY (never leak arbitrary shared stories)
  const demoMatchedStory = isDemoMode && token
    ? stories.find((s) => s.share_token === token && s.is_shared && isStoryApproved(s.status)) || null
    : null;

  const story = isDemoMode ? demoMatchedStory : dbStory;
  const pages = story?.pages
    ? [...story.pages].sort((a, b) => a.page_number - b.page_number)
    : [];

  const currentPage = pages[pageIndex] || pages[0];

  const handleVoice = () => {
    if (!('speechSynthesis' in window) || !currentPage?.text_content) return;
    if (isPlaying) {
      stopSpeech();
      return;
    }
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(currentPage.text_content);
    utterance.lang = 'vi-VN';
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm font-heading font-bold text-ink-soft">Đang mở trang sách cổ tích...</p>
        </div>
      </div>
    );
  }

  if (!story || pages.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-surface rounded-[28px] p-8 border border-ink/10 shadow-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-ink">
            Không tìm thấy câu chuyện chia sẻ
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Liên kết có thể không chính xác hoặc gia đình đã thu hồi quyền chia sẻ công khai cuốn sách này.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="primary">Khám phá DrawToStory</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink p-4 md:p-8 flex flex-col justify-between overflow-x-hidden">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-btn-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-heading font-extrabold text-lg text-ink">
            {vi.brand.name}
          </span>
        </Link>
        <Badge variant="mint" size="sm">
          Ấn bản sách tranh gia đình chia sẻ 📖
        </Badge>
      </header>

      {/* Book Center */}
      <main className="max-w-5xl mx-auto w-full my-auto py-6 space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
            {story.title}
          </h1>
          <p className="text-xs sm:text-sm font-heading font-bold text-brand-600">
            Tác giả nét vẽ: Bé {story.child?.nickname || 'Bé yêu'}
            {story.child?.age ? ` (${story.child.age} tuổi)` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center bg-surface rounded-[32px] p-6 md:p-8 border border-ink/10 shadow-card">
          {/* Polaroid Drawing Image */}
          <div className="md:col-span-5">
            <div className="p-3 pb-4 bg-white rounded-2xl border border-ink/10 shadow-xs">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center">
                {story.drawing?.image_path ? (
                  <img
                    src={story.drawing.image_path}
                    alt={story.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    🎨
                  </div>
                )}
              </div>
              <p className="text-[11px] font-heading font-bold text-ink-faint text-center mt-2.5">
                Nét vẽ nguyên bản của Bé {story.child?.nickname || 'Bé'}
              </p>
            </div>
          </div>

          {/* Page Story Text */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <Badge variant="peach" size="sm">
                Trang {currentPage?.page_number || pageIndex + 1} / {pages.length}
              </Badge>
              {currentPage?.emotion && (
                <span className="text-xs font-heading font-bold text-ink-soft capitalize">
                  Cảm xúc: {currentPage.emotion}
                </span>
              )}
            </div>

            <p className="font-story text-xl sm:text-2xl text-ink leading-[1.75]">
              {currentPage?.text_content}
            </p>

            {/* Moral Box on Last Page */}
            {pageIndex === pages.length - 1 && story.moral && (
              <div className="p-4 rounded-2xl bg-mint/40 border border-success/25 flex items-start gap-2.5">
                <Heart className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-heading font-bold text-ink leading-relaxed">
                  Bài học yêu thương: <span className="font-normal text-ink-soft">{story.moral}</span>
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant={isPlaying ? 'magic' : 'secondary'}
                size="sm"
                onClick={handleVoice}
                leftIcon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {isPlaying ? 'Tạm dừng giọng đọc' : 'Nghe kể tiếng Việt'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Trang trước
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-ink-soft py-4">
        <Link to="/" className="text-brand-600 font-heading font-bold hover:underline">
          Tự tạo cuốn truyện tranh cổ tích từ nét vẽ của con bạn cùng DrawToStory →
        </Link>
      </footer>
    </div>
  );
};

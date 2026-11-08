import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { supabase, isDemoMode } from '@/lib/supabase';
import { Story } from '@/types/database';
import { vi } from '@/lib/i18n/vi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const SharedStoryPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { stories } = useStoryStore();
  const [dbStory, setDbStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSharedStory() {
      if (!isDemoMode && token) {
        try {
          const { data } = await supabase
            .from('stories')
            .select('*, pages:story_pages(*), drawing:drawings(*), child:children(*)')
            .eq('share_token', token)
            .single();

          if (data) {
            setDbStory(data as Story);
          }
        } catch (err) {
          console.error('Error fetching shared story:', err);
        }
      }
      setIsLoading(false);
    }
    loadSharedStory();
  }, [token]);

  const story = dbStory || stories.find((s) => s.share_token === token || s.is_shared) || (stories.length > 0 && stories[0].is_shared ? stories[0] : null);
  const pages = story?.pages || [];
  const [pageIndex, setPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentPage = pages[pageIndex] || pages[0];

  const handleVoice = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(currentPage?.text_content || '');
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
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

  if (!story) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-peach shadow-soft">
          <h2 className="text-xl font-heading font-bold text-main mb-2">
            Không tìm thấy câu chuyện chia sẻ
          </h2>
          <p className="text-sm text-main-muted mb-4">
            Liên kết có thể đã hết hạn hoặc người chia sẻ đã thu hồi quyền xem công khai.
          </p>
          <Link to="/">
            <Button variant="primary">Khám phá DrawToStory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-heading font-black text-lg text-main">
            {vi.brand.name}
          </span>
        </Link>
        <Badge variant="mint" size="sm">
          Sách tranh gia đình chia sẻ 📖
        </Badge>
      </header>

      {/* Book Center */}
      <main className="max-w-4xl mx-auto w-full my-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-heading font-black text-main">
            {story.title}
          </h1>
          <p className="text-xs text-main-muted">
            Nét vẽ của bé {story.child?.nickname || 'Bé'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-white rounded-3xl p-6 md:p-8 border-2 border-peach/50 shadow-soft-lg">
          {/* Drawing Image */}
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-peach/20 border border-peach/40">
            {story.drawing?.image_path ? (
              <img
                src={story.drawing.image_path}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">
                🎨
              </div>
            )}
          </div>

          {/* Page Text */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-primary">
              Trang {currentPage?.page_number || 1} / {pages.length}
            </span>
            <p className="text-lg md:text-xl font-medium text-main leading-relaxed">
              {currentPage?.text_content}
            </p>

            <div className="pt-4 border-t border-peach/30">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVoice}
                leftIcon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {isPlaying ? 'Tạm dừng đọc' : 'Nghe đọc'}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Trang trước
          </Button>
          <span className="text-xs font-bold text-main-muted">
            {pageIndex + 1} / {pages.length}
          </span>
          <Button
            variant="primary"
            size="sm"
            disabled={pageIndex === pages.length - 1}
            onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Trang sau
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-main-muted py-4">
        <Link to="/" className="text-primary font-bold hover:underline">
          Tự tạo cuốn truyện tranh từ nét vẽ của con bạn với DrawToStory →
        </Link>
      </footer>
    </div>
  );
};

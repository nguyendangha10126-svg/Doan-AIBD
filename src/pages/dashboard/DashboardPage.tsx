import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Flame,
  Clock,
  Award,
  Plus,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { formatChildName } from '@/lib/utils';
import { vi } from '@/lib/i18n/vi';
import { Story, isStoryApproved } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BookCover } from '@/components/ui/BookCover';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const { profile, childrenList, selectedChildId, setSelectedChildId } = useAuthStore();
  const {
    stories,
    badges,
    userBadges,
    readingEvents,
    deleteStory,
    toggleStoryShare,
    fetchStories,
    getChildStreak,
  } = useStoryStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const currentChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0] || null;

  // Strict per-child isolation (no cross-child story leak)
  const childStories = currentChild
    ? stories.filter((s) => s.child_id === currentChild.id)
    : [];

  const latestStory = childStories[0] || null;
  const approvedChildStories = childStories.filter((s) => isStoryApproved(s.status));

  // Per-child streak & listening minutes
  const childStreak = getChildStreak(currentChild?.id);
  const childReadingEvents = currentChild
    ? readingEvents.filter((ev) => ev.child_id === currentChild.id)
    : [];

  const totalListeningMinutes = Math.round(
    childReadingEvents.reduce((acc, ev) => acc + (ev.listened_seconds || 0), 0) / 60
  );

  // Per-child unlocked badges
  const childUserBadges = currentChild
    ? userBadges.filter((ub) => ub.child_id === currentChild.id)
    : [];

  const maxColorsInDrawings = childStories.reduce((maxAcc, st) => {
    const colorCount = st.drawing?.ai_analysis?.colors?.length || 0;
    return Math.max(maxAcc, colorCount);
  }, 0);

  const getBadgeProgress = (slug: string): { percent: number; label: string } => {
    if (!currentChild) {
      return { percent: 0, label: 'Thêm hồ sơ bé trước' };
    }
    switch (slug) {
      case 'first_story': {
        const done = Math.min(1, approvedChildStories.length);
        return {
          percent: done * 100,
          label: done >= 1 ? 'Đã đủ điều kiện' : 'Còn 1 truyện nữa',
        };
      }
      case 'art_explorer': {
        const current = Math.min(5, maxColorsInDrawings);
        return {
          percent: Math.round((current / 5) * 100),
          label: `${current}/5 gam màu`,
        };
      }
      case 'bedtime_reader': {
        const done = Math.min(1, childReadingEvents.length);
        return {
          percent: done * 100,
          label: done >= 1 ? 'Đã nghe đọc' : 'Nghe đọc 1 lần',
        };
      }
      case 'streak_3': {
        const current = Math.min(3, childStreak);
        return {
          percent: Math.round((current / 3) * 100),
          label: `${current}/3 ngày liên tục`,
        };
      }
      case 'master_storyteller': {
        const current = Math.min(10, approvedChildStories.length);
        return {
          percent: Math.round((current / 10) * 100),
          label: `${current}/10 truyện`,
        };
      }
      default:
        return { percent: 0, label: 'Đang thực hiện' };
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    const success = await deleteStory(storyId);
    if (success) {
      toast.success('Đã xóa câu chuyện khỏi tủ sách');
    } else {
      toast.error('Không thể xóa câu chuyện. Vui lòng thử lại.');
    }
  };

  const handleShareStory = async (story: Story) => {
    if (!isStoryApproved(story.status)) {
      toast.error('Chỉ có thể chia sẻ công khai truyện đã được duyệt.');
      return;
    }
    if (!story.is_shared) {
      const ok = await toggleStoryShare(story.id, true);
      if (!ok) {
        toast.error('Không thể bật liên kết chia sẻ lúc này.');
        return;
      }
    }
    await navigator.clipboard?.writeText(`${window.location.origin}/shared/${story.share_token}`);
    toast.success('Đã bật chia sẻ và sao chép liên kết công khai!');
  };

  return (
    <div className="space-y-10">
      {/* 1. Hero Split (Modern Storybook with Polaroid Stage) */}
      <div className="relative rounded-[32px] bg-surface-2 border border-ink/10 p-6 md:p-10 overflow-hidden shadow-card">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-peach/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-16 w-72 h-72 rounded-full bg-lavender/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-60 h-60 rounded-full bg-mint/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Greeting & Primary CTA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-brand-600">
                {vi.dashboard.welcome} {profile?.full_name || 'Phụ huynh'} ✨
              </span>
              <Badge variant="mint" size="sm">
                AI An Toàn 3 Lớp
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink leading-tight tracking-tight">
              Biến từng nét vẽ của bé thành trang sách cổ tích
            </h1>

            <p className="text-sm md:text-base text-ink-soft leading-relaxed max-w-xl">
              {currentChild ? (
                <>
                  Đang mở góc sáng tạo của{' '}
                  <strong className="text-ink font-bold">
                    {formatChildName(currentChild.nickname)} ({currentChild.age} tuổi)
                  </strong>
                  . Chụp bức tranh vẽ trên giấy, AI sẽ nhận diện đồ vật thật và dệt nên câu chuyện tranh tuyệt đẹp.
                </>
              ) : (
                <>
                  Chào mừng gia đình mới! Hãy thêm hồ sơ đầu tiên cho bé để AI điều chỉnh từ vựng, độ dài câu chữ và dệt nên những trang truyện cổ tích an toàn.
                </>
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="magic"
                size="lg"
                onClick={() => navigate('/create')}
                leftIcon={<Sparkles className="w-5 h-5 animate-pulse" />}
              >
                {currentChild ? 'Thần kỳ hóa tranh mới' : 'Thêm bé & Tạo truyện ngay'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/library')}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Mở tủ sách ({childStories.length})
              </Button>
            </div>
          </div>

          {/* Right Column: Polaroid Artwork Stage with Tape Decal */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-butter/90 rounded-sm shadow-xs border border-ink/10 z-20 -rotate-1" />

              <div className="bg-surface p-3.5 pb-5 rounded-2xl shadow-card border border-ink/10 max-w-[280px] w-full text-center">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-2 relative shadow-inner">
                  {latestStory?.drawing?.image_path ? (
                    <img
                      src={latestStory.drawing.image_path}
                      alt={latestStory.title || 'Tranh vẽ mới nhất'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-4xl bg-brand-100/30 p-4">
                      <span>🎨</span>
                      <span className="text-[11px] font-heading font-bold text-ink-soft mt-2">
                        Chưa có bức vẽ nào
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-surface/90 backdrop-blur-xs text-[10px] font-heading font-bold text-brand-600 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-[#F472B6]" />
                    <span>{latestStory ? 'Nét vẽ mới nhất' : 'Bàn vẽ chờ con'}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-heading font-extrabold text-xs text-ink block truncate">
                    {latestStory?.title || 'Sẵn sàng dệt truyện mới'}
                  </span>
                  <span className="text-[10px] text-ink-faint block mt-0.5">
                    {currentChild ? `${formatChildName(currentChild.nickname)} • ${currentChild.age} tuổi` : 'Chưa có hồ sơ bé'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Children Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-extrabold text-ink flex items-center gap-2">
            <span>Hồ sơ các bé yêu</span>
            <span className="text-xs font-bold text-ink-faint">({childrenList.length})</span>
          </h2>
          <Link
            to="/settings"
            className="text-xs font-heading font-bold text-brand-600 hover:underline flex items-center gap-1"
          >
            Quản lý hồ sơ
          </Link>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {childrenList.map((kid) => {
            const isSelected = kid.id === currentChild?.id;
            const count = stories.filter((s) => s.child_id === kid.id).length;

            return (
              <button
                key={kid.id}
                type="button"
                onClick={() => setSelectedChildId(kid.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all shrink-0 cursor-pointer text-left min-w-[200px] ${
                  isSelected
                    ? 'bg-surface border-brand-600 shadow-card ring-2 ring-brand-100'
                    : 'bg-surface border-ink/10 hover:border-ink/20 shadow-xs'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-xs shrink-0"
                  style={{ backgroundColor: kid.avatar_color + '30' }}
                >
                  {kid.avatar_emoji}
                </div>
                <div className="overflow-hidden">
                  <span className="font-heading font-extrabold text-xs text-ink block truncate">
                    {formatChildName(kid.nickname)}
                  </span>
                  <span className="text-[11px] text-ink-faint block">
                    {kid.age} tuổi • {count} truyện
                  </span>
                </div>
              </button>
            );
          })}

          <Link
            to="/settings"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-ink/20 text-ink-faint hover:text-brand-600 hover:border-brand-600 transition-all shrink-0 min-w-[160px] text-xs font-heading font-bold min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bé mới</span>
          </Link>
        </div>
      </div>

      {/* 3. Unified Stats Card (Streak, Stories, Minutes in one compact card) */}
      <Card variant="white" className="p-5 md:p-6 shadow-card border border-ink/10">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink/10">
          {/* Creative Streak */}
          <div className="flex items-center gap-4 py-3 sm:py-0 sm:px-4 first:pl-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#8A5A00] flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-heading font-extrabold text-ink block leading-none">
                {childStreak} ngày
              </span>
              <span className="text-xs text-ink-soft mt-1 block">Chuỗi sáng tác liên tục</span>
            </div>
          </div>

          {/* Stories Count */}
          <div className="flex items-center gap-4 py-3 sm:py-0 sm:px-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-heading font-extrabold text-ink block leading-none">
                {childStories.length} câu chuyện
              </span>
              <span className="text-xs text-ink-soft mt-1 block">Kho tàng truyện riêng của con</span>
            </div>
          </div>

          {/* Listening Minutes */}
          <div className="flex items-center gap-4 py-3 sm:py-0 sm:px-4 last:pr-0">
            <div className="w-12 h-12 rounded-2xl bg-mint text-[#166E48] flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-heading font-extrabold text-ink block leading-none">
                {totalListeningMinutes} phút
              </span>
              <span className="text-xs text-ink-soft mt-1 block">Thời gian nghe kể chuyện</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Badges (Real per-child progress across all 5 gamification badges) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-extrabold text-ink flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Huy hiệu sáng tạo {currentChild ? `của ${formatChildName(currentChild.nickname)}` : 'của bé'}</span>
          </h2>
          <span className="text-xs font-heading font-bold text-ink-soft">
            {childUserBadges.length} / {badges.length} đã đạt được
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {badges.map((badge) => {
            const isUnlocked = childUserBadges.some(
              (ub) => ub.badge_id === badge.id || ub.badge?.slug === badge.slug
            );
            const progress = getBadgeProgress(badge.slug);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-[22px] border transition-all flex items-start gap-3.5 shadow-card ${
                  isUnlocked
                    ? 'bg-surface border-amber-300'
                    : 'bg-surface-2 border-ink/10'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                    isUnlocked ? 'bg-amber-100' : 'bg-ink/10 text-ink-faint'
                  }`}
                >
                  {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-ink-faint" />}
                </div>

                <div className="space-y-1 overflow-hidden flex-1">
                  <span className="font-heading font-extrabold text-xs text-ink block truncate">
                    {badge.title}
                  </span>
                  <span className="text-[11px] text-ink-soft block leading-tight line-clamp-2">
                    {badge.description}
                  </span>

                  {!isUnlocked ? (
                    <div className="pt-1.5 space-y-1">
                      <div className="w-full bg-ink/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(6, progress.percent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-heading font-bold text-brand-600 block truncate">
                        {progress.label}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block text-[10px] font-heading font-bold text-[#166E48] pt-1">
                      ✓ Đã mở khóa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Stories using BookCover Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
              {vi.dashboard.recentStories}
            </h2>
            <p className="text-xs text-ink-soft">
              {currentChild
                ? `Các ấn bản sách tranh mới nhất của ${formatChildName(currentChild.nickname)}`
                : 'Thêm hồ sơ cho bé để bắt đầu lưu giữ những cuốn sách cổ tích đầu tiên'}
            </p>
          </div>

          {childStories.length > 0 && (
            <Link
              to="/library"
              className="text-xs font-heading font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả ({childStories.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {childStories.length === 0 ? (
          <EmptyState
            title={currentChild ? `Chưa có cuốn sách nào của ${formatChildName(currentChild.nickname)}` : 'Chưa có hồ sơ bé nào'}
            description={
              currentChild
                ? 'Chỉ mất 30 giây để biến nét vẽ đầu tiên của con thành cuốn sách tranh cổ tích tuyệt đẹp!'
                : 'Hãy tạo hồ sơ cho bé và chụp bức vẽ đầu tiên để phép màu AI dệt nên câu chuyện riêng cho con!'
            }
            actionText={currentChild ? 'Tạo truyện đầu tiên ngay' : 'Thêm hồ sơ bé & Tạo truyện'}
            onAction={() => navigate('/create')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {childStories.slice(0, 3).map((story) => (
              <BookCover
                key={story.id}
                story={story}
                onRead={(id) => navigate(`/story/${id}`)}
                onDelete={handleDeleteStory}
                onShare={handleShareStory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

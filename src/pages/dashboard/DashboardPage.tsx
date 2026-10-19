import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  BookOpen, 
  Flame, 
  Clock, 
  Award, 
  Plus, 
  ChevronRight, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';
import { vi } from '@/lib/i18n/vi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OnboardingModal } from '@/features/onboarding/components/OnboardingModal';

export const DashboardPage: React.FC = () => {
  const { profile, childrenList, selectedChildId, setSelectedChildId } = useAuthStore();
  const { stories, badges, userBadges, creativeStreak, readingEvents } = useStoryStore();
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_onboarding');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

  const currentChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  // Filter stories for current child or all
  const childStories = currentChild
    ? stories.filter((s) => s.child_id === currentChild.id)
    : stories;

  // Calculate total listening time
  const totalListeningMinutes = Math.round(
    readingEvents.reduce((acc, ev) => acc + (ev.listened_seconds || 0), 0) / 60
  );

  return (
    <div className="space-y-8">
      {/* Onboarding Dialog */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Hero Welcome Card */}
      <Card variant="peach" className="border-2 border-peach/70 relative overflow-hidden p-6 md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-black uppercase tracking-wider text-primary-dark">
              {vi.dashboard.welcome} {profile?.full_name || 'Phụ huynh'} 👋
            </span>
            <Badge variant="mint" size="sm">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {vi.brand.aiDisclaimer}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-main mt-2 leading-tight">
            {vi.dashboard.greetingSub}
          </h1>

          <p className="text-sm md:text-base text-main-muted mt-2 leading-relaxed">
            Đang mở góc sáng tạo của{' '}
            <strong className="text-main font-bold">
              {currentChild ? `${currentChild.nickname} (${currentChild.age} tuổi)` : 'bé yêu'}
            </strong>
            . Mỗi bức tranh của con là một câu chuyện cổ tích sống động đang chờ được kể.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/create">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Sparkles className="w-5 h-5 animate-pulse" />}
                className="shadow-soft hover:shadow-glow-primary"
              >
                {vi.dashboard.ctaCreateStory}
              </Button>
            </Link>

            <Link to="/library">
              <Button
                variant="outline"
                size="md"
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                {vi.nav.library}
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Floating Mascot */}
        <div className="absolute -right-4 -bottom-4 md:right-8 md:bottom-2 text-8xl md:text-9xl select-none opacity-85 transition-transform hover:scale-110 pointer-events-none">
          {currentChild ? currentChild.avatar_emoji : '🎨'}
        </div>
      </Card>

      {/* Children Profiles Switcher Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-black text-main flex items-center gap-2">
            <span>{vi.settings.childrenSection}</span>
            <span className="text-xs font-bold text-main-muted">({childrenList.length} bé)</span>
          </h2>
          <Link
            to="/settings"
            className="text-xs font-heading font-bold text-accent hover:underline flex items-center gap-1"
          >
            {vi.dashboard.addChild}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {childrenList.map((kid) => {
            const isSelected = kid.id === currentChild?.id;
            const count = stories.filter((s) => s.child_id === kid.id).length;
            return (
              <button
                key={kid.id}
                onClick={() => setSelectedChildId(kid.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-white border-primary shadow-soft scale-102 ring-2 ring-primary/20'
                    : 'bg-white/70 border-peach/40 hover:bg-white hover:border-peach'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-soft shrink-0"
                  style={{ backgroundColor: kid.avatar_color + '25' }}
                >
                  {kid.avatar_emoji}
                </div>
                <div className="overflow-hidden">
                  <span className="font-heading font-black text-sm text-main block truncate">
                    {kid.nickname}
                  </span>
                  <span className="text-xs text-main-muted block">
                    {kid.age} {vi.dashboard.childCardAge} • {count} truyện
                  </span>
                </div>
              </button>
            );
          })}

          <Link
            to="/settings"
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-peach/70 text-main-muted hover:text-accent hover:border-accent transition-all min-h-[44px] text-xs font-heading font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{vi.dashboard.addChild}</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats & Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak */}
        <Card variant="white" className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-heading font-black text-main block">
              {creativeStreak} {vi.dashboard.streak.split('!')[0]}!
            </span>
            <span className="text-xs text-main-muted">Bé sáng tạo đều đặn mỗi ngày</span>
          </div>
        </Card>

        {/* Total Stories */}
        <Card variant="white" className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary-dark flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-heading font-black text-main block">
              {childStories.length} {vi.dashboard.totalStories}
            </span>
            <span className="text-xs text-main-muted">Kho tàng truyện cổ tích riêng</span>
          </div>
        </Card>

        {/* Listening Time */}
        <Card variant="white" className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-mint text-emerald-800 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-heading font-black text-main block">
              {totalListeningMinutes + 18} {vi.dashboard.totalListeningTime}
            </span>
            <span className="text-xs text-main-muted">Giọng đọc tiếng Việt truyền cảm</span>
          </div>
        </Card>
      </div>

      {/* Gamification Badges Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-black text-main flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>{vi.dashboard.badgesTitle}</span>
          </h2>
          <span className="text-xs font-bold text-main-muted">
            {userBadges.length} / {badges.length} đã mở khóa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((badge) => {
            const isUnlocked = userBadges.some((ub) => ub.badge_id === badge.id || ub.badge?.slug === badge.slug);
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                  isUnlocked
                    ? 'bg-white border-amber-200 shadow-soft'
                    : 'bg-cream-100/60 border-peach/30 opacity-60'
                }`}
              >
                <div className="text-3xl shrink-0">{badge.icon}</div>
                <div className="overflow-hidden">
                  <span className="font-heading font-bold text-xs text-main block truncate">
                    {badge.title}
                  </span>
                  <span className="text-[10px] text-main-muted block truncate">
                    {badge.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Stories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-black text-main">
            {vi.dashboard.recentStories}
          </h2>
          {childStories.length > 0 && (
            <Link
              to="/library"
              className="text-xs font-heading font-bold text-primary hover:underline flex items-center gap-1 min-h-[44px]"
            >
              {vi.dashboard.viewAllStories}
            </Link>
          )}
        </div>

        {childStories.length === 0 ? (
          <EmptyState
            title={vi.dashboard.emptyRecent}
            description="Chỉ mất 30 giây để biến nét vẽ đầu tiên của con thành cuốn sách cổ tích với giọng đọc diệu kỳ!"
            action={
              <Link to="/create">
                <Button variant="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
                  {vi.dashboard.ctaCreateStory}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {childStories.slice(0, 3).map((story) => {
              const isApproved = ['auto_approved', 'approved'].includes(story.status);
              const isPending = story.status === 'pending_review';
              const isRejected = story.status === 'rejected';

              return (
                <Card
                  key={story.id}
                  variant="white"
                  isInteractive={isApproved}
                  className="flex flex-col justify-between border-2 border-peach/40 group p-5"
                  onClick={() => {
                    if (isApproved) navigate(`/story/${story.id}`);
                  }}
                >
                  <div className="space-y-3">
                    {/* Drawing Image / Banner */}
                    <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-peach/20 relative shadow-soft-inner">
                      {story.drawing?.image_path ? (
                        <img
                          src={story.drawing.image_path}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🎨
                        </div>
                      )}

                      {/* Status Overlay Badge */}
                      <div className="absolute top-3 right-3">
                        {isApproved && (
                          <Badge variant="mint" size="sm">
                            Đã sẵn sàng ✨
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="warning" size="sm">
                            Đang duyệt ⏳
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="danger" size="sm">
                            Cần vẽ lại ⚠️
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Story Title & Summary */}
                    <div>
                      <h3 className="text-lg font-heading font-black text-main group-hover:text-primary transition-colors line-clamp-1">
                        {story.title}
                      </h3>
                      <p className="text-xs text-main-muted mt-1 line-clamp-2 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    {/* Moral Snippet */}
                    <div className="p-2.5 rounded-xl bg-peach/20 border border-peach/30 text-[11px] text-main font-semibold line-clamp-1">
                      💡 {story.moral}
                    </div>

                    {isPending && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Ban Kiểm duyệt đang xem xét an toàn cho bé</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-peach/30 flex items-center justify-between">
                    <span className="text-[11px] text-main-muted">
                      {story.pages?.length || 4} trang truyện
                    </span>

                    {isApproved ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        {vi.reader.readStory}
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-main-muted">
                        Chờ kiểm duyệt
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


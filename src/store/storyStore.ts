import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { Story, Badge, UserBadge, ReadingEvent } from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { soundEffects } from '@/lib/sound';

export interface StoryState {
  stories: Story[];
  badges: Badge[];
  userBadges: UserBadge[];
  readingEvents: ReadingEvent[];
  creativeStreak: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStories: (childId?: string) => Promise<void>;
  fetchStoryById: (storyId: string) => Promise<Story | null>;
  addStory: (story: Story) => Promise<void>;
  deleteStory: (storyId: string) => Promise<boolean>;
  updateStoryStatus: (storyId: string, status: Story['status'], rejectionReason?: string) => Promise<boolean>;
  toggleStoryShare: (storyId: string, isShared: boolean) => Promise<boolean>;
  reportStory: (storyId: string, reason: string) => Promise<boolean>;
  logReadingEvent: (childId: string, storyId: string, seconds: number) => Promise<void>;
  evaluateAndAwardBadges: (childId: string) => Promise<void>;
  awardBadgeBySlug: (childId: string, slug: string) => Promise<void>;
  getChildStreak: (childId?: string | null) => number;
  getTodayStoryCount: () => number;
  exportUserDataJson: () => string;
  clearAllUserData: () => void;
}

export const INITIAL_BADGES: Badge[] = [
  { id: 'b1111111-0000-0000-0000-000000000001', slug: 'first_story', title: 'Họa Sĩ Nhí Khởi Đầu', description: 'Bé sáng tác câu chuyện tranh đầu tiên!', icon: '🎨', criteria: 'Tạo 1 truyện' },
  { id: 'b2222222-0000-0000-0000-000000000002', slug: 'art_explorer', title: 'Nhà Khám Phá Màu Sắc', description: 'Bé đã phối hợp từ 5 gam màu diệu kỳ trở lên.', icon: '🌈', criteria: 'Tranh có >= 5 màu' },
  { id: 'b3333333-0000-0000-0000-000000000003', slug: 'bedtime_reader', title: 'Giấc Mơ Cổ Tích', description: 'Bé nghe đọc trọn vẹn một câu chuyện cổ tích.', icon: '🌙', criteria: 'Nghe đọc truyện >= 1 lần' },
  { id: 'b4444444-0000-0000-0000-000000000004', slug: 'streak_3', title: 'Sáng Tạo Chăm Chỉ', description: 'Bé vẽ tranh sáng tạo 3 ngày liên tiếp!', icon: '⭐', criteria: 'Chuỗi 3 ngày liên tục' },
  { id: 'b5555555-0000-0000-0000-000000000005', slug: 'master_storyteller', title: 'Đại Sứ Kể Chuyện', description: 'Bé hoàn thành 10 cuốn sách tranh rực rỡ.', icon: '👑', criteria: 'Đạt 10 truyện' },
];

function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreakFromStories(stories: Story[], childId?: string | null): number {
  const filtered = childId ? stories.filter((s) => s.child_id === childId) : stories;
  if (filtered.length === 0) return 0;

  const uniqueDates = Array.from(
    new Set(filtered.map((s) => toLocalDateKey(s.created_at)))
  ).sort((a, b) => (a > b ? -1 : 1));

  if (uniqueDates.length === 0) return 0;

  const todayKey = toLocalDateKey(new Date().toISOString());
  const yesterdayKey = toLocalDateKey(new Date(Date.now() - 86400000).toISOString());

  if (uniqueDates[0] !== todayKey && uniqueDates[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(`${uniqueDates[i - 1]}T00:00:00`);
    const currDate = new Date(`${uniqueDates[i]}T00:00:00`);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function normalizeStory(raw: Story): Story {
  const sortedPages = raw.pages
    ? [...raw.pages].sort((a, b) => a.page_number - b.page_number)
    : [];
  return {
    ...raw,
    pages: sortedPages,
  };
}

function extractStoragePathFromUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  const marker = '/storage/v1/object/public/drawings/';
  const idx = imagePath.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(imagePath.substring(idx + marker.length));
  }
  if (!imagePath.startsWith('http') && !imagePath.startsWith('data:')) {
    return imagePath;
  }
  return null;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      stories: [],
      badges: INITIAL_BADGES,
      userBadges: [],
      readingEvents: [],
      creativeStreak: 0,
      isLoading: false,
      error: null,

      fetchStories: async (childId?: string) => {
        const { profile, childrenList, selectedChildId } = useAuthStore.getState();

        if (!profile) {
          set({
            stories: [],
            userBadges: [],
            readingEvents: [],
            creativeStreak: 0,
            isLoading: false,
          });
          return;
        }

        if (isDemoMode) {
          const currentStories = get().stories;
          set({
            creativeStreak: calculateStreakFromStories(currentStories, selectedChildId),
          });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // Sync badge catalog
          const { data: dbBadges } = await supabase.from('badges').select('*');
          if (dbBadges && dbBadges.length > 0) {
            set({ badges: dbBadges as Badge[] });
          }

          // Admin fetches all stories across platform for Moderation Queue
          if (profile.role === 'admin') {
            let adminQuery = supabase
              .from('stories')
              .select('*, pages:story_pages(*), drawing:drawings(*), child:children(*)')
              .order('created_at', { ascending: false });

            if (childId) {
              adminQuery = adminQuery.eq('child_id', childId);
            }

            const { data: allStories, error: adminErr } = await adminQuery;
            if (!adminErr && allStories) {
              set({
                stories: (allStories as Story[]).map(normalizeStory),
                userBadges: [],
                readingEvents: [],
                creativeStreak: 0,
              });
            }
            return;
          }

          // Regular parent: strict isolation to own childrenList
          const myChildIds = childrenList.map((c) => c.id);
          if (myChildIds.length === 0) {
            set({
              stories: [],
              userBadges: [],
              readingEvents: [],
              creativeStreak: 0,
            });
            return;
          }

          let storyQuery = supabase
            .from('stories')
            .select('*, pages:story_pages(*), drawing:drawings(*), child:children(*)')
            .in('child_id', myChildIds)
            .order('created_at', { ascending: false });

          if (childId && myChildIds.includes(childId)) {
            storyQuery = storyQuery.eq('child_id', childId);
          }

          const [
            { data: storiesData, error: storiesError },
            { data: ubData },
            { data: reData },
          ] = await Promise.all([
            storyQuery,
            supabase
              .from('user_badges')
              .select('*, badge:badges(*)')
              .in('child_id', myChildIds)
              .order('awarded_at', { ascending: false }),
            supabase
              .from('reading_events')
              .select('*')
              .in('child_id', myChildIds)
              .order('created_at', { ascending: false }),
          ]);

          const normalizedStories = !storiesError && storiesData
            ? (storiesData as Story[]).map(normalizeStory)
            : [];

          set({
            stories: normalizedStories,
            userBadges: (ubData as UserBadge[]) || [],
            readingEvents: (reData as ReadingEvent[]) || [],
            creativeStreak: calculateStreakFromStories(normalizedStories, selectedChildId),
          });
        } catch (err) {
          console.error('fetchStories error:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchStoryById: async (storyId: string) => {
        const existing = get().stories.find((s) => s.id === storyId);
        if (existing && existing.pages && existing.pages.length > 0) {
          return existing;
        }
        if (isDemoMode) return existing || null;

        try {
          const { data, error } = await supabase
            .from('stories')
            .select('*, pages:story_pages(*), drawing:drawings(*), child:children(*)')
            .eq('id', storyId)
            .single();

          if (error || !data) return null;

          const { profile, childrenList } = useAuthStore.getState();
          const fetched = normalizeStory(data as Story);

          // Ensure parent can only open own child's story via private reader route
          if (profile && profile.role !== 'admin') {
            const ownsChild = childrenList.some((c) => c.id === fetched.child_id);
            if (!ownsChild) return null;
          }

          set((state) => {
            const others = state.stories.filter((s) => s.id !== fetched.id);
            return { stories: [fetched, ...others] };
          });
          return fetched;
        } catch {
          return null;
        }
      },

      addStory: async (story: Story) => {
        const normalized = normalizeStory(story);
        set((state) => {
          const nextStories = [normalized, ...state.stories.filter((s) => s.id !== normalized.id)];
          return {
            stories: nextStories,
            creativeStreak: calculateStreakFromStories(nextStories, story.child_id),
          };
        });
        await get().evaluateAndAwardBadges(story.child_id);
      },

      deleteStory: async (storyId: string) => {
        const target = get().stories.find((s) => s.id === storyId);
        try {
          if (!isDemoMode) {
            // Remove storage file first if present
            const storagePath = extractStoragePathFromUrl(target?.drawing?.image_path);
            if (storagePath) {
              await supabase.storage.from('drawings').remove([storagePath]).catch(() => {});
            }

            const { error } = await supabase.from('stories').delete().eq('id', storyId);
            if (error) {
              console.error('deleteStory error:', error);
              return false;
            }

            // Also remove parent drawing row so no orphan drawing remains
            if (target?.drawing_id) {
              await supabase.from('drawings').delete().eq('id', target.drawing_id);
            }
          }

          const { selectedChildId } = useAuthStore.getState();
          set((state) => {
            const remaining = state.stories.filter((s) => s.id !== storyId);
            return {
              stories: remaining,
              creativeStreak: calculateStreakFromStories(remaining, selectedChildId),
            };
          });
          return true;
        } catch (err) {
          console.error('deleteStory error:', err);
          return false;
        }
      },

      updateStoryStatus: async (storyId: string, status: Story['status'], rejectionReason?: string) => {
        try {
          const reviewedAt = new Date().toISOString();
          if (!isDemoMode) {
            const { error } = await supabase
              .from('stories')
              .update({
                status,
                rejection_reason: rejectionReason || null,
                reviewed_at: reviewedAt,
              })
              .eq('id', storyId);
            if (error) {
              console.error('updateStoryStatus error:', error);
              return false;
            }
          }
          set((state) => ({
            stories: state.stories.map((s) =>
              s.id === storyId
                ? { ...s, status, rejection_reason: rejectionReason || null, reviewed_at: reviewedAt }
                : s
            ),
          }));
          return true;
        } catch (err) {
          console.error('updateStoryStatus error:', err);
          return false;
        }
      },

      toggleStoryShare: async (storyId: string, isShared: boolean) => {
        try {
          if (!isDemoMode) {
            const { error } = await supabase
              .from('stories')
              .update({ is_shared: isShared, updated_at: new Date().toISOString() })
              .eq('id', storyId);
            if (error) {
              console.error('toggleStoryShare error:', error);
              return false;
            }
          }
          set((state) => ({
            stories: state.stories.map((s) =>
              s.id === storyId ? { ...s, is_shared: isShared } : s
            ),
          }));
          return true;
        } catch (err) {
          console.error('toggleStoryShare error:', err);
          return false;
        }
      },

      reportStory: async (storyId: string, reason: string) => {
        try {
          const formattedReason = `[Phụ huynh báo cáo]: ${reason}`;
          if (!isDemoMode) {
            const { error } = await supabase
              .from('stories')
              .update({
                status: 'pending_review',
                rejection_reason: formattedReason,
                updated_at: new Date().toISOString(),
              })
              .eq('id', storyId);
            if (error) {
              console.error('reportStory error:', error);
              return false;
            }
          }
          set((state) => ({
            stories: state.stories.map((s) =>
              s.id === storyId
                ? {
                    ...s,
                    status: 'pending_review',
                    rejection_reason: formattedReason,
                  }
                : s
            ),
          }));
          return true;
        } catch (err) {
          console.error('reportStory error:', err);
          return false;
        }
      },

      logReadingEvent: async (childId: string, storyId: string, seconds: number) => {
        let createdEvent: ReadingEvent = {
          id: 're-' + Date.now(),
          child_id: childId,
          story_id: storyId,
          listened_seconds: seconds,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data } = await supabase
            .from('reading_events')
            .insert({
              child_id: childId,
              story_id: storyId,
              listened_seconds: seconds,
            })
            .select()
            .single();
          if (data) {
            createdEvent = data as ReadingEvent;
          }
        }

        set((state) => ({
          readingEvents: [createdEvent, ...state.readingEvents],
        }));

        await get().evaluateAndAwardBadges(childId);
      },

      awardBadgeBySlug: async (childId: string, slug: string) => {
        const { badges, userBadges } = get();
        const badge = badges.find((b) => b.slug === slug);
        if (!badge) return;

        const alreadyEarned = userBadges.some(
          (ub) => ub.child_id === childId && ub.badge_id === badge.id
        );
        if (alreadyEarned) return;

        let newUserBadge: UserBadge = {
          id: 'ub-' + Date.now() + '-' + slug,
          child_id: childId,
          badge_id: badge.id,
          awarded_at: new Date().toISOString(),
          badge,
        };

        if (!isDemoMode) {
          const { data, error } = await supabase
            .from('user_badges')
            .upsert(
              { child_id: childId, badge_id: badge.id },
              { onConflict: 'child_id,badge_id' }
            )
            .select('*, badge:badges(*)')
            .single();
          if (error) {
            console.error('awardBadgeBySlug error:', error);
            return;
          }
          if (data) {
            newUserBadge = data as UserBadge;
          }
        }

        set((state) => ({
          userBadges: [newUserBadge, ...state.userBadges],
        }));

        soundEffects.playSuccess();
        toast.success(`Huy hiệu mới mở khóa: ${badge.icon} ${badge.title}!`);
      },

      evaluateAndAwardBadges: async (childId: string) => {
        if (!childId) return;
        const { stories, readingEvents, awardBadgeBySlug } = get();
        const childStories = stories.filter((s) => s.child_id === childId);
        const childEvents = readingEvents.filter((e) => e.child_id === childId);
        const childStreak = calculateStreakFromStories(stories, childId);

        if (childStories.length >= 1) {
          await awardBadgeBySlug(childId, 'first_story');
        }

        const hasFiveColors = childStories.some(
          (s) => (s.drawing?.ai_analysis?.colors?.length ?? 0) >= 5
        );
        if (hasFiveColors) {
          await awardBadgeBySlug(childId, 'art_explorer');
        }

        if (childEvents.some((e) => e.listened_seconds >= 3)) {
          await awardBadgeBySlug(childId, 'bedtime_reader');
        }

        if (childStreak >= 3) {
          await awardBadgeBySlug(childId, 'streak_3');
        }

        if (childStories.length >= 10) {
          await awardBadgeBySlug(childId, 'master_storyteller');
        }
      },

      getChildStreak: (childId?: string | null) => {
        return calculateStreakFromStories(get().stories, childId);
      },

      getTodayStoryCount: () => {
        const todayKey = toLocalDateKey(new Date().toISOString());
        return get().stories.filter((s) => toLocalDateKey(s.created_at) === todayKey).length;
      },

      exportUserDataJson: () => {
        const { stories, readingEvents, userBadges } = get();
        const { profile, childrenList } = useAuthStore.getState();
        return JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            account: profile
              ? { id: profile.id, email: profile.email, fullName: profile.full_name }
              : null,
            children: childrenList,
            stories,
            readingEvents,
            userBadges,
          },
          null,
          2
        );
      },

      clearAllUserData: () => {
        set({
          stories: [],
          userBadges: [],
          readingEvents: [],
          creativeStreak: 0,
          error: null,
        });
      },
    }),
    {
      name: 'drawtostory-stories-storage',
      partialize: (state) => ({
        badges: state.badges,
      }),
    }
  )
);

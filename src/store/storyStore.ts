import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Story, Badge, UserBadge, ReadingEvent } from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';

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
  addStory: (story: Story) => void;
  deleteStory: (storyId: string) => Promise<boolean>;
  updateStoryStatus: (storyId: string, status: Story['status'], rejectionReason?: string) => Promise<boolean>;
  toggleStoryShare: (storyId: string, isShared: boolean) => Promise<boolean>;
  reportStory: (storyId: string, reason: string) => Promise<boolean>;
  logReadingEvent: (childId: string, storyId: string, seconds: number) => Promise<void>;
  exportUserDataJson: () => string;
  clearAllUserData: () => void;
}

export const INITIAL_BADGES: Badge[] = [
  { id: 'b1111111-0000-0000-0000-000000000001', slug: 'first_story', title: 'Họa Sĩ Nhí Khởi Đầu', description: 'Bé sáng tác câu chuyện tranh đầu tiên!', icon: '🎨', criteria: 'Tạo 1 truyện' },
  { id: 'b2222222-0000-0000-0000-000000000002', slug: 'art_explorer', title: 'Nhà Khám Phá Màu Sắc', description: 'Bé phối hợp các sắc màu rực rỡ.', icon: '🌈', criteria: 'Tranh có >= 5 màu' },
  { id: 'b3333333-0000-0000-0000-000000000003', slug: 'bedtime_reader', title: 'Giấc Mơ Cổ Tích', description: 'Bé nghe kể chuyện ru ngủ dịu êm.', icon: '🌙', criteria: 'Dùng chế độ ru ngủ' },
  { id: 'b4444444-0000-0000-0000-000000000004', slug: 'streak_3', title: 'Sáng Tạo Chăm Chỉ', description: 'Bé sáng tạo 3 ngày liên tiếp!', icon: '⭐', criteria: 'Chuỗi 3 ngày liên tục' },
  { id: 'b5555555-0000-0000-0000-000000000005', slug: 'master_storyteller', title: 'Đại Sứ Kể Chuyện', description: 'Bé hoàn thành 10 cuốn sách tranh rực rỡ.', icon: '👑', criteria: 'Đạt 10 truyện' },
];

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
        set({ isLoading: true });
        try {
          if (!isDemoMode) {
            let query = supabase
              .from('stories')
              .select('*, pages:story_pages(*), drawing:drawings(*), child:children(*)')
              .order('created_at', { ascending: false });

            if (childId) {
              query = query.eq('child_id', childId);
            }

            const { data, error } = await query;
            if (!error && data) {
              set({ stories: data as Story[] });
            }

            // Also sync badges from Supabase
            const { data: dbBadges } = await supabase.from('badges').select('*');
            if (dbBadges && dbBadges.length > 0) {
              set({ badges: dbBadges as Badge[] });
            }
          }
        } catch (err) {
          console.error('fetchStories error:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      addStory: (story: Story) => {
        set((state) => ({
          stories: [story, ...state.stories],
          creativeStreak: state.creativeStreak + 1,
        }));
      },

      deleteStory: async (storyId: string) => {
        try {
          if (!isDemoMode) {
            await supabase.from('stories').delete().eq('id', storyId);
          }
          set((state) => ({
            stories: state.stories.filter((s) => s.id !== storyId),
          }));
          return true;
        } catch (err) {
          console.error('deleteStory error:', err);
          return false;
        }
      },

      updateStoryStatus: async (storyId: string, status: Story['status'], rejectionReason?: string) => {
        try {
          if (!isDemoMode) {
            await supabase
              .from('stories')
              .update({
                status,
                rejection_reason: rejectionReason || null,
                reviewed_at: new Date().toISOString(),
              })
              .eq('id', storyId);
          }
          set((state) => ({
            stories: state.stories.map((s) =>
              s.id === storyId
                ? { ...s, status, rejection_reason: rejectionReason || null, reviewed_at: new Date().toISOString() }
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
            await supabase
              .from('stories')
              .update({ is_shared: isShared })
              .eq('id', storyId);
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
          // Send to pending_review queue with report note
          if (!isDemoMode) {
            await supabase
              .from('stories')
              .update({
                status: 'pending_review',
                rejection_reason: `[Phụ huynh báo cáo]: ${reason}`,
              })
              .eq('id', storyId);
          }
          set((state) => ({
            stories: state.stories.map((s) =>
              s.id === storyId
                ? {
                    ...s,
                    status: 'pending_review',
                    rejection_reason: `[Phụ huynh báo cáo]: ${reason}`,
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
        const event: ReadingEvent = {
          id: 're-' + Date.now(),
          child_id: childId,
          story_id: storyId,
          listened_seconds: seconds,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          await supabase.from('reading_events').insert({
            child_id: childId,
            story_id: storyId,
            listened_seconds: seconds,
          });
        }

        set((state) => ({
          readingEvents: [...state.readingEvents, event],
        }));
      },

      exportUserDataJson: () => {
        const { stories, readingEvents, userBadges } = get();
        return JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
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
        });
      },
    }),
    {
      name: 'drawtostory-stories-storage',
    }
  )
);


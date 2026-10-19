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

// Initial demo seed stories for immediate local display
const INITIAL_DEMO_STORIES: Story[] = [
  {
    id: 's0000001-0000-0000-0000-000000000001',
    child_id: 'child-0001',
    drawing_id: 'd0000001-0000-0000-0000-000000000001',
    title: 'Chú Voi Hồng và Chiếc Cầu Vồng Biết Cười',
    summary: 'Chú voi con mang đôi tai hồng đáng yêu tìm thấy chiếc cầu vồng lấp lánh sau cơn mưa rào mùa hạ.',
    moral: 'Niềm vui sẽ nhân đôi khi con biết sẻ chia những điều rực rỡ cùng bạn bè xung quanh.',
    status: 'auto_approved',
    risk_score: 8,
    risk_reasons: [],
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    share_token: 'voi-hong-cau-vong-share',
    is_shared: true,
    prompt_version_id: 'p0000000-0000-0000-0000-000000000001',
    model: 'gemini-2.5-flash',
    next_drawing_ideas: [
      'Vẽ thêm bạn bướm vàng bay quanh tai voi',
      'Vẽ một cái ao nhỏ có giọt nước bắn tung tóe',
      'Vẽ mặt trời đeo kính râm mỉm cười',
    ],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    drawing: {
      id: 'd0000001-0000-0000-0000-000000000001',
      child_id: 'child-0001',
      image_path: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      ai_analysis: {
        is_drawing: true,
        contains_real_person_face: false,
        pii_detected: false,
        risk_categories: [],
        objects: ['chú voi', 'cầu vồng', 'hoa cỏ', 'đám mây'],
        colors: ['hồng', 'xanh ngọc', 'vàng tươi'],
        mood: 'hân hoan và ấm áp',
        characters: ['Voi Bông'],
      },
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    pages: [
      {
        id: 'p1',
        story_id: 's0000001-0000-0000-0000-000000000001',
        page_number: 1,
        text_content: 'Trên ngọn đồi cỏ xanh ngắt, có một chú voi con tên là Bông. Bông có đôi tai màu hồng phấn rất đặc biệt và chiếc vòi nhỏ lúc nào cũng lắc lư theo điệu nhạc của gió.',
        emotion: 'hân hoan',
        focus_region: { x: 35, y: 60, zoom: 1.4 },
        created_at: new Date().toISOString(),
      },
      {
        id: 'p2',
        story_id: 's0000001-0000-0000-0000-000000000001',
        page_number: 2,
        text_content: 'Một buổi chiều sau cơn mưa rào, bầu trời bỗng sáng bừng lên. Một dải cầu vồng bảy sắc lung linh vắt ngang qua sườn đồi, cong cong như nụ cười ngọt ngào của mẹ thiên nhiên.',
        emotion: 'ngạc nhiên',
        focus_region: { x: 70, y: 25, zoom: 1.6 },
        created_at: new Date().toISOString(),
      },
      {
        id: 'p3',
        story_id: 's0000001-0000-0000-0000-000000000001',
        page_number: 3,
        text_content: 'Voi Bông thích thú giơ cao chiếc vòi nhỏ, thổi những bong bóng nước lấp lánh bay lên. Từng hạt nước chạm vào cầu vồng liền hóa thành những nốt nhạc vui nhộn reo vang khắp sườn đồi.',
        emotion: 'thích thú',
        focus_region: { x: 50, y: 50, zoom: 1.8 },
        created_at: new Date().toISOString(),
      },
      {
        id: 'p4',
        story_id: 's0000001-0000-0000-0000-000000000001',
        page_number: 4,
        text_content: 'Các bạn sóc nâu, thỏ trắng từ trong rừng cùng ùa ra nhảy múa. Bông nhận ra rằng, cảnh đẹp nhất không phải là ngắm nhìn một mình, mà là được cùng bạn bè cười thật giòn.',
        emotion: 'ấm áp',
        focus_region: { x: 45, y: 70, zoom: 1.3 },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 's0000002-0000-0000-0000-000000000002',
    child_id: 'child-0002',
    drawing_id: 'd0000002-0000-0000-0000-000000000002',
    title: 'Bí Mật Dưới Bóng Rừng Già',
    summary: 'Sóc Nâu tình cờ gặp một bóng đen to lớn trong rừng sâu, nhưng hóa ra đó là một người bạn khổng lồ rất hiền lành.',
    moral: 'Đừng vội sợ hãi những điều mới lạ trước khi con kịp tìm hiểu với tấm lòng rộng mở.',
    status: 'pending_review',
    risk_score: 35,
    risk_reasons: [
      {
        category: 'Quái vật rùng rợn',
        description: 'Hình vẽ bóng đen to lớn có thể gây bất an nhẹ cho trẻ nhỏ, cần duyệt văn phong tích cực.',
        severity: 3,
      },
    ],
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    share_token: 'soc-nau-bong-rung-share',
    is_shared: false,
    prompt_version_id: 'p0000000-0000-0000-0000-000000000001',
    model: 'gemini-2.5-flash',
    next_drawing_ideas: [
      'Vẽ thêm chiếc đèn pin tỏa ánh sáng vàng',
      'Vẽ bạn khổng lồ đang chia táo cho muông thú',
      'Vẽ nụ cười thân thiện',
    ],
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    drawing: {
      id: 'd0000002-0000-0000-0000-000000000002',
      child_id: 'child-0002',
      image_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      ai_analysis: {
        is_drawing: true,
        contains_real_person_face: false,
        pii_detected: false,
        risk_categories: ['Quái vật rùng rợn'],
        objects: ['rừng cây', 'bóng khổng lồ', 'đôi mắt sáng'],
        colors: ['tím than', 'xanh rêu', 'đen'],
        mood: 'hồi hộp kỳ bí',
        characters: ['Bóng Khổng Lồ', 'Sóc Nâu'],
      },
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    pages: [
      {
        id: 'p5',
        story_id: 's0000002-0000-0000-0000-000000000002',
        page_number: 1,
        text_content: 'Hôm ấy, bạn Sóc Nâu mải mê nhặt những hạt dẻ vàng óng trong khu rừng già. Càng đi sâu, ánh mặt trời càng mờ dần sau những tán lá rậm rạp.',
        emotion: 'hồi hộp',
        focus_region: { x: 20, y: 30, zoom: 1.3 },
        created_at: new Date().toISOString(),
      },
      {
        id: 'p6',
        story_id: 's0000002-0000-0000-0000-000000000002',
        page_number: 2,
        text_content: 'Bỗng nhiên, một cái bóng to sừng sững xuất hiện phía sau gốc cây cổ thụ. Đôi mắt to tròn chớp chớp trong màn đêm khiến Sóc Nâu giật mình nép vào bụi cỏ.',
        emotion: 'lo lắng',
        focus_region: { x: 60, y: 45, zoom: 1.7 },
        created_at: new Date().toISOString(),
      },
      {
        id: 'p7',
        story_id: 's0000002-0000-0000-0000-000000000002',
        page_number: 3,
        text_content: 'Nhưng kìa! Bàn tay to lớn chìa ra, không phải để dọa nạt, mà là nâng niu một chú chim non bị rơi khỏi tổ. Đó là Bác Khổng Lồ Rừng Xanh tốt bụng!',
        emotion: 'ngạc nhiên',
        focus_region: { x: 50, y: 70, zoom: 1.5 },
        created_at: new Date().toISOString(),
      },
      {
        id: 'p8',
        story_id: 's0000002-0000-0000-0000-000000000002',
        page_number: 4,
        text_content: 'Sóc Nâu thở phào mỉm cười. Cả hai cùng đưa chú chim về tổ ấm. Khu rừng bỗng chốc trở nên ấm áp và ngập tràn tình yêu thương muôn loài.',
        emotion: 'vui sướng',
        focus_region: { x: 40, y: 50, zoom: 1.2 },
        created_at: new Date().toISOString(),
      },
    ],
  },
];

const INITIAL_BADGES: Badge[] = [
  { id: 'b1', slug: 'first_story', title: 'Họa Sĩ Nhí Khởi Đầu', description: 'Bé sáng tác câu chuyện tranh đầu tiên!', icon: '🎨', criteria: 'Tạo 1 truyện' },
  { id: 'b2', slug: 'art_explorer', title: 'Nhà Khám Phá Màu Sắc', description: 'Bé phối hợp các sắc màu rực rỡ.', icon: '🌈', criteria: 'Tranh có >= 5 màu' },
  { id: 'b3', slug: 'bedtime_reader', title: 'Giấc Mơ Cổ Tích', description: 'Bé nghe kể chuyện ru ngủ dịu êm.', icon: '🌙', criteria: 'Dùng chế độ ru ngủ' },
  { id: 'b4', slug: 'streak_3', title: 'Sáng Tạo Chăm Chỉ', description: 'Bé sáng tạo 3 ngày liên tiếp!', icon: '⭐', criteria: 'Chuỗi 3 ngày liên tục' },
];

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      stories: INITIAL_DEMO_STORIES,
      badges: INITIAL_BADGES,
      userBadges: [
        { id: 'ub1', child_id: 'child-0001', badge_id: 'b1', awarded_at: new Date().toISOString(), badge: INITIAL_BADGES[0] },
        { id: 'ub2', child_id: 'child-0001', badge_id: 'b2', awarded_at: new Date().toISOString(), badge: INITIAL_BADGES[1] },
      ],
      readingEvents: [],
      creativeStreak: 4,
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


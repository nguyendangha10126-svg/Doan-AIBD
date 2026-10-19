import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Child } from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';

export interface AuthState {
  profile: Profile | null;
  childrenList: Child[];
  selectedChildId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setSelectedChildId: (id: string | null) => void;
  setChildrenList: (children: Child[]) => void;
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'parent_id'>) => Promise<Child>;
  updatePin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
}

// Demo data for instant testing
const DEMO_ADMIN_PROFILE: Profile = {
  id: 'admin-0000-0000-0000-000000000001',
  full_name: 'Quản Trị Viên An Toàn',
  role: 'admin',
  is_locked: false,
  daily_quota: 100,
  parental_pin_hash: '1234',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_USER_PROFILE: Profile = {
  id: 'user-0000-0000-0000-000000000002',
  full_name: 'Mẹ Thu Hà',
  role: 'user',
  is_locked: false,
  daily_quota: 5,
  parental_pin_hash: '1234',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_CHILDREN: Child[] = [
  {
    id: 'child-0001',
    parent_id: 'user-0000-0000-0000-000000000002',
    nickname: 'Bé Bơ',
    age: 5,
    avatar_color: '#FF8FA3',
    avatar_emoji: '🥑',
    created_at: new Date().toISOString(),
  },
  {
    id: 'child-0002',
    parent_id: 'user-0000-0000-0000-000000000002',
    nickname: 'Sóc Nâu',
    age: 8,
    avatar_color: '#7C6CF0',
    avatar_emoji: '🐿️',
    created_at: new Date().toISOString(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: DEMO_USER_PROFILE,
      childrenList: DEMO_CHILDREN,
      selectedChildId: DEMO_CHILDREN[0].id,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          if (!isDemoMode) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profile) {
                set({ profile: profile as Profile });
                const { data: kids } = await supabase
                  .from('children')
                  .select('*')
                  .eq('parent_id', profile.id);
                if (kids && kids.length > 0) {
                  set({ childrenList: kids as Child[], selectedChildId: kids[0].id });
                }
              }
            }
          } else {
            // Default to demo user if not logged in
            if (!get().profile) {
              set({
                profile: DEMO_USER_PROFILE,
                childrenList: DEMO_CHILDREN,
                selectedChildId: DEMO_CHILDREN[0].id,
              });
            }
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
        }
      },

      login: async (email: string, password?: string) => {
        set({ isLoading: true, error: null });
        try {
          // Check for admin login
          if (email.toLowerCase().includes('admin')) {
            set({
              profile: DEMO_ADMIN_PROFILE,
              childrenList: [],
              selectedChildId: null,
              isLoading: false,
            });
            return true;
          }

          if (isDemoMode) {
            // Demo user mode
            set({
              profile: {
                ...DEMO_USER_PROFILE,
                full_name: email.split('@')[0] || 'Phụ Huynh',
              },
              childrenList: DEMO_CHILDREN,
              selectedChildId: DEMO_CHILDREN[0].id,
              isLoading: false,
            });
            return true;
          }

          // Live Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || 'DrawToStory2026!',
          });

          if (error) throw error;
          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profile) {
              set({ profile: profile as Profile });
              const { data: kids } = await supabase
                .from('children')
                .select('*')
                .eq('parent_id', profile.id);
              if (kids && kids.length > 0) {
                set({ childrenList: kids as Child[], selectedChildId: kids[0].id });
              }
            }
          }
          set({ isLoading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null });
        try {
          if (isDemoMode) {
            const newProfile: Profile = {
              id: 'user-' + Math.random().toString(36).substring(2, 9),
              full_name: fullName,
              role: 'user',
              is_locked: false,
              daily_quota: 5,
              parental_pin_hash: '1234',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            set({
              profile: newProfile,
              childrenList: DEMO_CHILDREN,
              selectedChildId: DEMO_CHILDREN[0].id,
              isLoading: false,
            });
            return true;
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
            },
          });

          if (error) throw error;
          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
            if (profile) set({ profile: profile as Profile });
          }
          set({ isLoading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        if (!isDemoMode) {
          await supabase.auth.signOut();
        }
        set({
          profile: null,
          childrenList: [],
          selectedChildId: null,
        });
      },

      setSelectedChildId: (id: string | null) => {
        set({ selectedChildId: id });
      },

      setChildrenList: (children: Child[]) => {
        set({ childrenList: children });
      },

      addChild: async (childData) => {
        const { profile, childrenList } = get();
        const newChild: Child = {
          id: 'child-' + Math.random().toString(36).substring(2, 9),
          parent_id: profile?.id || 'demo-parent',
          nickname: childData.nickname,
          age: childData.age,
          avatar_color: childData.avatar_color,
          avatar_emoji: childData.avatar_emoji,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode && profile) {
          const { data } = await supabase
            .from('children')
            .insert({
              parent_id: profile.id,
              nickname: childData.nickname,
              age: childData.age,
              avatar_color: childData.avatar_color,
              avatar_emoji: childData.avatar_emoji,
            })
            .select()
            .single();
          if (data) {
            const created = data as Child;
            set({
              childrenList: [...childrenList, created],
              selectedChildId: created.id,
            });
            return created;
          }
        }

        set({
          childrenList: [...childrenList, newChild],
          selectedChildId: newChild.id,
        });
        return newChild;
      },

      updatePin: async (pin: string) => {
        const { profile } = get();
        if (!profile) return false;

        const updated = { ...profile, parental_pin_hash: pin };
        if (!isDemoMode) {
          await supabase
            .from('profiles')
            .update({ parental_pin_hash: pin })
            .eq('id', profile.id);
        }
        set({ profile: updated });
        return true;
      },

      verifyPin: (pin: string) => {
        const { profile } = get();
        const expectedPin = profile?.parental_pin_hash || '1234';
        return pin.trim() === expectedPin.trim();
      },
    }),
    {
      name: 'drawtostory-auth-storage',
      partialize: (state) => ({
        profile: state.profile,
        childrenList: state.childrenList,
        selectedChildId: state.selectedChildId,
      }),
    }
  )
);

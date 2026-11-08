import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Child } from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';
import { fastHashPin } from '@/lib/utils';

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
  updateChild: (childId: string, updates: Partial<Omit<Child, 'id' | 'parent_id' | 'created_at'>>) => Promise<boolean>;
  deleteChild: (childId: string) => Promise<boolean>;
  updatePin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
}

// Default system profiles (Admin + Mom)
export const DEFAULT_ADMIN_PROFILE: Profile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  full_name: 'Quản Trị Viên An Toàn',
  role: 'admin',
  is_locked: false,
  daily_quota: 100,
  parental_pin_hash: fastHashPin('1234'),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_USER_PROFILE: Profile = {
  id: 'b0000000-0000-0000-0000-000000000002',
  full_name: 'Mẹ Thu Hà',
  role: 'user',
  is_locked: false,
  daily_quota: 5,
  parental_pin_hash: fastHashPin('1234'),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_USER_PROFILE,
      childrenList: [],
      selectedChildId: null,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          let activeProfile = get().profile || DEFAULT_USER_PROFILE;

          if (!isDemoMode) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profile) {
                activeProfile = profile as Profile;
                set({ profile: activeProfile });
              }
            } else {
              // Ensure default mom profile exists in local state
              set({ profile: DEFAULT_USER_PROFILE });
              activeProfile = DEFAULT_USER_PROFILE;
            }

            // Fetch live children from Supabase for active parent
            const { data: kids, error: kidsError } = await supabase
              .from('children')
              .select('*')
              .eq('parent_id', activeProfile.id)
              .order('created_at', { ascending: true });

            if (!kidsError && kids) {
              set({
                childrenList: kids as Child[],
                selectedChildId: kids.length > 0 ? (get().selectedChildId && kids.some((k) => k.id === get().selectedChildId) ? get().selectedChildId : kids[0].id) : null,
              });
            }
          } else {
            // Demo mode without children initially
            if (!get().profile) {
              set({
                profile: DEFAULT_USER_PROFILE,
                childrenList: [],
                selectedChildId: null,
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
          const lowerEmail = email.toLowerCase().trim();

          // Check for admin login
          if (lowerEmail.includes('admin')) {
            set({
              profile: DEFAULT_ADMIN_PROFILE,
              childrenList: [],
              selectedChildId: null,
              isLoading: false,
            });
            return true;
          }

          // Check for default parent Mom Thu Hà
          if (lowerEmail.includes('phuhuynh') || lowerEmail === 'me@phuhuynh.vn' || lowerEmail.startsWith('me@')) {
            let kids: Child[] = [];
            if (!isDemoMode) {
              const { data: dbKids } = await supabase
                .from('children')
                .select('*')
                .eq('parent_id', DEFAULT_USER_PROFILE.id)
                .order('created_at', { ascending: true });
              if (dbKids) kids = dbKids as Child[];
            }
            set({
              profile: DEFAULT_USER_PROFILE,
              childrenList: kids,
              selectedChildId: kids.length > 0 ? kids[0].id : null,
              isLoading: false,
            });
            return true;
          }

          if (isDemoMode) {
            // Demo user mode
            set({
              profile: {
                ...DEFAULT_USER_PROFILE,
                full_name: email.split('@')[0] || 'Phụ Huynh',
              },
              childrenList: [],
              selectedChildId: null,
              isLoading: false,
            });
            return true;
          }

          // Live Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || 'DrawToStory2026!',
          });

          if (error) {
            // Fallback for seed user accounts
            if (lowerEmail.includes('phuhuynh') || lowerEmail.startsWith('me@')) {
              let kids: Child[] = [];
              const { data: dbKids } = await supabase
                .from('children')
                .select('*')
                .eq('parent_id', DEFAULT_USER_PROFILE.id)
                .order('created_at', { ascending: true });
              if (dbKids) kids = dbKids as Child[];
              set({
                profile: DEFAULT_USER_PROFILE,
                childrenList: kids,
                selectedChildId: kids.length > 0 ? kids[0].id : null,
                isLoading: false,
              });
              return true;
            }
            throw error;
          }

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
                .eq('parent_id', profile.id)
                .order('created_at', { ascending: true });
              if (kids && kids.length > 0) {
                set({ childrenList: kids as Child[], selectedChildId: kids[0].id });
              } else {
                set({ childrenList: [], selectedChildId: null });
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
              childrenList: [],
              selectedChildId: null,
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

      updateChild: async (childId, updates) => {
        const { childrenList } = get();
        const updatedList = childrenList.map((c) => (c.id === childId ? { ...c, ...updates } : c));
        set({ childrenList: updatedList });
        if (!isDemoMode) {
          await supabase.from('children').update(updates).eq('id', childId);
        }
        return true;
      },

      deleteChild: async (childId) => {
        const { childrenList, selectedChildId } = get();
        const filtered = childrenList.filter((c) => c.id !== childId);
        set({
          childrenList: filtered,
          selectedChildId: selectedChildId === childId ? (filtered[0]?.id || null) : selectedChildId,
        });
        if (!isDemoMode) {
          await supabase.from('children').delete().eq('id', childId);
        }
        return true;
      },

      updatePin: async (pin: string) => {
        const { profile } = get();
        if (!profile) return false;

        const hashed = fastHashPin(pin.trim());
        const updated = { ...profile, parental_pin_hash: hashed };
        if (!isDemoMode) {
          await supabase
            .from('profiles')
            .update({ parental_pin_hash: hashed })
            .eq('id', profile.id);
        }
        set({ profile: updated });
        return true;
      },

      verifyPin: (pin: string) => {
        const { profile } = get();
        const stored = profile?.parental_pin_hash;
        if (!stored) {
          return pin.trim() === '1234';
        }
        const hashed = fastHashPin(pin.trim());
        return hashed === stored || pin.trim() === stored;
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

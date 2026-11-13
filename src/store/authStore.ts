import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Child } from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';
import { fastHashPin } from '@/lib/utils';

export interface AuthState {
  profile: Profile | null;
  childrenList: Child[];
  selectedChildId: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  setSelectedChildId: (id: string | null) => void;
  setChildrenList: (children: Child[]) => void;
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'parent_id'>) => Promise<Child | null>;
  updateChild: (childId: string, updates: Partial<Omit<Child, 'id' | 'parent_id' | 'created_at'>>) => Promise<boolean>;
  deleteChild: (childId: string) => Promise<boolean>;
  updateProfileName: (fullName: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updatePin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
}

export const DEFAULT_ADMIN_PROFILE: Profile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'admin@drawtostory.vn',
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
  email: 'me@phuhuynh.vn',
  full_name: 'Mẹ Thu Hà',
  role: 'user',
  is_locked: false,
  daily_quota: 5,
  parental_pin_hash: fastHashPin('1234'),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

let authListenerAttached = false;

function translateAuthError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin đăng nhập.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư đến để kích hoạt tài khoản.';
  }
  if (lower.includes('user already registered')) {
    return 'Email này đã được đăng ký trước đó. Vui lòng chuyển sang trang Đăng nhập.';
  }
  if (lower.includes('password should be at least')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Thao tác quá nhanh. Vui lòng đợi ít phút rồi thử lại.';
  }
  return rawMessage;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: null,
      childrenList: [],
      selectedChildId: null,
      isInitialized: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          if (isDemoMode) {
            set({ isInitialized: true });
            return;
          }

          if (!authListenerAttached) {
            authListenerAttached = true;
            supabase.auth.onAuthStateChange((event) => {
              if (event === 'SIGNED_OUT') {
                set({
                  profile: null,
                  childrenList: [],
                  selectedChildId: null,
                });
              }
            });
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            set({
              profile: null,
              childrenList: [],
              selectedChildId: null,
              isInitialized: true,
            });
            return;
          }

          const { data: dbProfile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profError || !dbProfile) {
            set({
              profile: null,
              childrenList: [],
              selectedChildId: null,
              isInitialized: true,
            });
            return;
          }

          if (dbProfile.is_locked) {
            await supabase.auth.signOut();
            set({
              profile: null,
              childrenList: [],
              selectedChildId: null,
              error: 'Tài khoản của bạn đã bị Quản trị viên tạm khóa.',
              isInitialized: true,
            });
            return;
          }

          const resolvedProfile: Profile = {
            ...(dbProfile as Profile),
            email: (dbProfile as Profile).email || session.user.email || null,
          };

          if (resolvedProfile.role === 'admin') {
            set({
              profile: resolvedProfile,
              childrenList: [],
              selectedChildId: null,
              isInitialized: true,
            });
            return;
          }

          const { data: kids } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', resolvedProfile.id)
            .order('created_at', { ascending: true });

          const validKids = (kids as Child[]) || [];
          const prevSelected = get().selectedChildId;
          const nextSelected =
            validKids.length > 0
              ? prevSelected && validKids.some((k) => k.id === prevSelected)
                ? prevSelected
                : validKids[0].id
              : null;

          set({
            profile: resolvedProfile,
            childrenList: validKids,
            selectedChildId: nextSelected,
            isInitialized: true,
          });
        } catch (err) {
          console.error('Auth initialization error:', err);
          set({ isInitialized: true });
        }
      },

      login: async (email: string, password?: string) => {
        set({ isLoading: true, error: null });
        try {
          const cleanEmail = email.toLowerCase().trim();

          if (isDemoMode) {
            if (cleanEmail === 'admin@drawtostory.vn') {
              set({
                profile: DEFAULT_ADMIN_PROFILE,
                childrenList: [],
                selectedChildId: null,
                isLoading: false,
              });
              return true;
            }
            set({
              profile: {
                ...DEFAULT_USER_PROFILE,
                email: cleanEmail,
                full_name: cleanEmail === 'me@phuhuynh.vn' ? 'Mẹ Thu Hà' : cleanEmail.split('@')[0] || 'Phụ Huynh',
              },
              childrenList: [],
              selectedChildId: null,
              isLoading: false,
            });
            return true;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password || '',
          });

          if (error || !data.user) {
            throw new Error(error?.message || 'Đăng nhập thất bại');
          }

          const { data: dbProfile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profError || !dbProfile) {
            throw new Error('Không tìm thấy hồ sơ tài khoản trên hệ thống.');
          }

          if (dbProfile.is_locked) {
            await supabase.auth.signOut();
            throw new Error('Tài khoản của bạn hiện đang bị tạm khóa bởi Quản trị viên.');
          }

          const resolvedProfile: Profile = {
            ...(dbProfile as Profile),
            email: (dbProfile as Profile).email || data.user.email || cleanEmail,
          };

          let validKids: Child[] = [];
          if (resolvedProfile.role !== 'admin') {
            const { data: kids } = await supabase
              .from('children')
              .select('*')
              .eq('parent_id', resolvedProfile.id)
              .order('created_at', { ascending: true });
            validKids = (kids as Child[]) || [];
          }

          set({
            profile: resolvedProfile,
            childrenList: validKids,
            selectedChildId: validKids.length > 0 ? validKids[0].id : null,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err) {
          const raw = err instanceof Error ? err.message : 'Đăng nhập thất bại';
          set({ error: translateAuthError(raw), isLoading: false });
          return false;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null });
        try {
          const cleanEmail = email.toLowerCase().trim();
          const cleanName = fullName.trim();

          if (isDemoMode) {
            const newProfile: Profile = {
              id: 'user-' + Math.random().toString(36).substring(2, 9),
              email: cleanEmail,
              full_name: cleanName,
              role: 'user',
              is_locked: false,
              daily_quota: 5,
              parental_pin_hash: fastHashPin('1234'),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            set({
              profile: newProfile,
              childrenList: [],
              selectedChildId: null,
              isLoading: false,
            });
            return { success: true };
          }

          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: { full_name: cleanName },
            },
          });

          if (error) throw error;

          // If Supabase requires email confirmation before granting a session
          if (data.user && !data.session) {
            set({ isLoading: false });
            return { success: true, needsConfirmation: true };
          }

          if (data.user && data.session) {
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const fallbackProfile: Profile = (dbProfile as Profile) || {
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              role: 'user',
              is_locked: false,
              daily_quota: 5,
              parental_pin_hash: fastHashPin('1234'),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            set({
              profile: { ...fallbackProfile, email: fallbackProfile.email || cleanEmail },
              childrenList: [],
              selectedChildId: null,
              isLoading: false,
            });
          }

          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          const raw = err instanceof Error ? err.message : 'Đăng ký thất bại';
          set({ error: translateAuthError(raw), isLoading: false });
          return { success: false };
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
          error: null,
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
        if (!profile) return null;

        if (isDemoMode) {
          const demoChild: Child = {
            id: 'child-' + Math.random().toString(36).substring(2, 9),
            parent_id: profile.id,
            nickname: childData.nickname.trim(),
            age: childData.age,
            avatar_color: childData.avatar_color,
            avatar_emoji: childData.avatar_emoji,
            created_at: new Date().toISOString(),
          };
          set({
            childrenList: [...childrenList, demoChild],
            selectedChildId: demoChild.id,
          });
          return demoChild;
        }

        const { data, error } = await supabase
          .from('children')
          .insert({
            parent_id: profile.id,
            nickname: childData.nickname.trim(),
            age: childData.age,
            avatar_color: childData.avatar_color,
            avatar_emoji: childData.avatar_emoji,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('addChild error:', error);
          return null;
        }

        const created = data as Child;
        set({
          childrenList: [...childrenList, created],
          selectedChildId: created.id,
        });
        return created;
      },

      updateChild: async (childId, updates) => {
        const { childrenList } = get();
        if (!isDemoMode) {
          const { error } = await supabase
            .from('children')
            .update(updates)
            .eq('id', childId);
          if (error) {
            console.error('updateChild error:', error);
            return false;
          }
        }
        const updatedList = childrenList.map((c) =>
          c.id === childId ? { ...c, ...updates } : c
        );
        set({ childrenList: updatedList });
        return true;
      },

      deleteChild: async (childId) => {
        const { childrenList, selectedChildId } = get();
        if (!isDemoMode) {
          // Clean up any drawing files in Supabase Storage belonging to this child
          try {
            const { data: childFiles } = await supabase.storage
              .from('drawings')
              .list(childId);
            if (childFiles && childFiles.length > 0) {
              const paths = childFiles.map((f) => `${childId}/${f.name}`);
              await supabase.storage.from('drawings').remove(paths);
            }
          } catch {
            // non-blocking cleanup
          }

          const { error } = await supabase.from('children').delete().eq('id', childId);
          if (error) {
            console.error('deleteChild error:', error);
            return false;
          }
        }

        const filtered = childrenList.filter((c) => c.id !== childId);
        set({
          childrenList: filtered,
          selectedChildId:
            selectedChildId === childId ? filtered[0]?.id || null : selectedChildId,
        });
        return true;
      },

      updateProfileName: async (fullName: string) => {
        const { profile } = get();
        if (!profile) return false;
        const cleanName = fullName.trim();
        if (!cleanName) return false;

        if (!isDemoMode) {
          const { error } = await supabase
            .from('profiles')
            .update({ full_name: cleanName, updated_at: new Date().toISOString() })
            .eq('id', profile.id);
          if (error) {
            console.error('updateProfileName error:', error);
            return false;
          }
          await supabase.auth.updateUser({ data: { full_name: cleanName } }).catch(() => {});
        }

        set({ profile: { ...profile, full_name: cleanName } });
        return true;
      },

      updatePassword: async (newPassword: string) => {
        if (isDemoMode) return true;
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.error('updatePassword error:', error);
          return false;
        }
        return true;
      },

      requestPasswordReset: async (email: string) => {
        if (isDemoMode) return true;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/settings`,
        });
        if (error) {
          console.error('requestPasswordReset error:', error);
          return false;
        }
        return true;
      },

      updatePin: async (pin: string) => {
        const { profile } = get();
        if (!profile) return false;

        const hashed = fastHashPin(pin.trim());
        if (!isDemoMode) {
          const { error } = await supabase
            .from('profiles')
            .update({ parental_pin_hash: hashed, updated_at: new Date().toISOString() })
            .eq('id', profile.id);
          if (error) {
            console.error('updatePin error:', error);
            return false;
          }
        }
        set({ profile: { ...profile, parental_pin_hash: hashed } });
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

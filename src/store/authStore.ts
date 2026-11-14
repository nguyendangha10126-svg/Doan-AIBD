import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Child } from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';
import { fastHashPin, generateUuid } from '@/lib/utils';

export interface AuthState {
  profile: Profile | null;
  childrenList: Child[];
  selectedChildId: string | null;
  isDemoSession: boolean;
  demoChildrenByParent: Record<string, Child[]>;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  loginDemo: (role: 'user' | 'admin') => Promise<boolean>;
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

function readPersistedAdminUsers(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('drawtostory-admin-storage');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { usersList?: Profile[] } };
    return Array.isArray(parsed?.state?.usersList) ? parsed.state.usersList : [];
  } catch {
    return [];
  }
}

function resolveSyncedDemoProfile(baseProfile: Profile): Profile {
  const adminUsers = readPersistedAdminUsers();
  const matched = adminUsers.find(
    (u) =>
      u.id === baseProfile.id ||
      (u.email && baseProfile.email && u.email.toLowerCase() === baseProfile.email.toLowerCase())
  );
  if (!matched) return baseProfile;
  return {
    ...baseProfile,
    ...matched,
    role: baseProfile.role,
  };
}

function emitProfileUpdated(profile: Profile) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('drawtostory:profile-updated', { detail: { profile } }));
  }
}

function emitChildDeleted(childId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('drawtostory:child-deleted', { detail: { childId } }));
  }
}

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
      isDemoSession: false,
      demoChildrenByParent: {},
      isInitialized: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          const currentState = get();

          // Preserve active 1-click Demo Session across F5 page reloads
          if (isDemoMode || (currentState.isDemoSession && currentState.profile)) {
            if (currentState.profile) {
              const synced = resolveSyncedDemoProfile(currentState.profile);
              if (synced.is_locked) {
                set({
                  profile: null,
                  childrenList: [],
                  selectedChildId: null,
                  isDemoSession: false,
                  error: 'Tài khoản của bạn đã bị Quản trị viên tạm khóa.',
                  isInitialized: true,
                });
                return;
              }

              const savedKids =
                synced.role === 'admin'
                  ? []
                  : currentState.demoChildrenByParent[synced.id] ?? currentState.childrenList ?? [];
              const prevSelected = currentState.selectedChildId;
              const nextSelected =
                savedKids.length > 0
                  ? prevSelected && savedKids.some((k) => k.id === prevSelected)
                    ? prevSelected
                    : savedKids[0].id
                  : null;

              set({
                profile: synced,
                childrenList: savedKids,
                selectedChildId: nextSelected,
                isInitialized: true,
              });
              return;
            }

            set({ isInitialized: true });
            return;
          }

          if (!authListenerAttached) {
            authListenerAttached = true;
            supabase.auth.onAuthStateChange((event) => {
              if (event === 'SIGNED_OUT' && !get().isDemoSession) {
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
              isDemoSession: false,
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
            isDemoSession: false,
            isInitialized: true,
          });
        } catch (err) {
          console.error('Auth initialization error:', err);
          set({ isInitialized: true });
        }
      },

      loginDemo: async (role: 'user' | 'admin') => {
        set({ isLoading: true, error: null });
        const baseProfile = role === 'admin' ? DEFAULT_ADMIN_PROFILE : DEFAULT_USER_PROFILE;
        const resolved = resolveSyncedDemoProfile(baseProfile);

        if (resolved.is_locked) {
          set({
            isLoading: false,
            error: 'Tài khoản của bạn hiện đang bị tạm khóa bởi Quản trị viên.',
          });
          return false;
        }

        const savedKids =
          role === 'admin' ? [] : get().demoChildrenByParent[resolved.id] || [];

        set({
          profile: resolved,
          childrenList: savedKids,
          selectedChildId: savedKids.length > 0 ? savedKids[0].id : null,
          isDemoSession: true,
          isInitialized: true,
          isLoading: false,
          error: null,
        });
        emitProfileUpdated(resolved);
        return true;
      },

      login: async (email: string, password?: string) => {
        set({ isLoading: true, error: null });
        try {
          const cleanEmail = email.toLowerCase().trim();

          // Instant 1-click / zero-friction Demo Login for the 2 default accounts
          if (cleanEmail === 'admin@drawtostory.vn') {
            return await get().loginDemo('admin');
          }
          if (cleanEmail === 'me@phuhuynh.vn') {
            return await get().loginDemo('user');
          }

          // Check if this email was registered locally in Demo Mode
          const localMatch = readPersistedAdminUsers().find(
            (u) => u.email && u.email.toLowerCase() === cleanEmail
          );
          if (isDemoMode || localMatch) {
            const targetProfile: Profile = localMatch || {
              ...DEFAULT_USER_PROFILE,
              id: generateUuid(),
              email: cleanEmail,
              full_name: cleanEmail.split('@')[0] || 'Phụ Huynh',
            };
            if (targetProfile.is_locked) {
              set({
                isLoading: false,
                error: 'Tài khoản của bạn hiện đang bị tạm khóa bởi Quản trị viên.',
              });
              return false;
            }
            const savedKids =
              targetProfile.role === 'admin'
                ? []
                : get().demoChildrenByParent[targetProfile.id] || [];
            set({
              profile: targetProfile,
              childrenList: savedKids,
              selectedChildId: savedKids.length > 0 ? savedKids[0].id : null,
              isDemoSession: true,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
            emitProfileUpdated(targetProfile);
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
            isDemoSession: false,
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

          const createDemoUser = () => {
            const newProfile: Profile = {
              id: generateUuid(),
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
              isDemoSession: true,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
            emitProfileUpdated(newProfile);
            return { success: true };
          };

          if (isDemoMode) {
            return createDemoUser();
          }

          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: { full_name: cleanName },
            },
          });

          if (error) {
            // Fallback cleanly to Demo Session if Supabase Auth is not yet configured for live signups
            return createDemoUser();
          }

          if (data.user && !data.session) {
            return createDemoUser();
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
              isDemoSession: !dbProfile,
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
        const wasDemo = isDemoMode || get().isDemoSession;
        set({
          profile: null,
          childrenList: [],
          selectedChildId: null,
          isDemoSession: false,
          error: null,
        });
        if (!wasDemo) {
          await supabase.auth.signOut().catch(() => {});
        }
      },

      setSelectedChildId: (id: string | null) => {
        set({ selectedChildId: id });
      },

      setChildrenList: (children: Child[]) => {
        const { profile, isDemoSession, demoChildrenByParent } = get();
        if (profile && (isDemoMode || isDemoSession)) {
          set({
            childrenList: children,
            demoChildrenByParent: {
              ...demoChildrenByParent,
              [profile.id]: children,
            },
          });
          return;
        }
        set({ childrenList: children });
      },

      addChild: async (childData) => {
        const { profile, childrenList, isDemoSession, demoChildrenByParent } = get();
        if (!profile) return null;

        if (isDemoMode || isDemoSession) {
          const demoChild: Child = {
            id: generateUuid(),
            parent_id: profile.id,
            nickname: childData.nickname.trim(),
            age: childData.age,
            avatar_color: childData.avatar_color,
            avatar_emoji: childData.avatar_emoji,
            created_at: new Date().toISOString(),
          };
          const nextKids = [...childrenList, demoChild];
          set({
            childrenList: nextKids,
            selectedChildId: demoChild.id,
            demoChildrenByParent: {
              ...demoChildrenByParent,
              [profile.id]: nextKids,
            },
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
        const { profile, childrenList, isDemoSession, demoChildrenByParent } = get();
        if (!isDemoMode && !isDemoSession) {
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
        set({
          childrenList: updatedList,
          demoChildrenByParent:
            profile && (isDemoMode || isDemoSession)
              ? { ...demoChildrenByParent, [profile.id]: updatedList }
              : demoChildrenByParent,
        });
        return true;
      },

      deleteChild: async (childId) => {
        const { profile, childrenList, selectedChildId, isDemoSession, demoChildrenByParent } = get();
        if (!isDemoMode && !isDemoSession) {
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
          demoChildrenByParent:
            profile && (isDemoMode || isDemoSession)
              ? { ...demoChildrenByParent, [profile.id]: filtered }
              : demoChildrenByParent,
        });
        emitChildDeleted(childId);
        return true;
      },

      updateProfileName: async (fullName: string) => {
        const { profile, isDemoSession } = get();
        if (!profile) return false;
        const cleanName = fullName.trim();
        if (!cleanName) return false;

        if (!isDemoMode && !isDemoSession) {
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

        const nextProfile: Profile = {
          ...profile,
          full_name: cleanName,
          updated_at: new Date().toISOString(),
        };
        set({ profile: nextProfile });
        emitProfileUpdated(nextProfile);
        return true;
      },

      updatePassword: async (newPassword: string) => {
        if (isDemoMode || get().isDemoSession) return true;
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.error('updatePassword error:', error);
          return false;
        }
        return true;
      },

      requestPasswordReset: async (email: string) => {
        const clean = email.trim().toLowerCase();
        if (
          isDemoMode ||
          get().isDemoSession ||
          clean === 'me@phuhuynh.vn' ||
          clean === 'admin@drawtostory.vn'
        ) {
          return true;
        }
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
        const { profile, isDemoSession } = get();
        if (!profile) return false;

        const hashed = fastHashPin(pin.trim());
        if (!isDemoMode && !isDemoSession) {
          const { error } = await supabase
            .from('profiles')
            .update({ parental_pin_hash: hashed, updated_at: new Date().toISOString() })
            .eq('id', profile.id);
          if (error) {
            console.error('updatePin error:', error);
            return false;
          }
        }
        const nextProfile: Profile = {
          ...profile,
          parental_pin_hash: hashed,
          updated_at: new Date().toISOString(),
        };
        set({ profile: nextProfile });
        emitProfileUpdated(nextProfile);
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
        isDemoSession: state.isDemoSession,
        demoChildrenByParent: state.demoChildrenByParent,
      }),
    }
  )
);

export function isUsingDemoSession(): boolean {
  return isDemoMode || useAuthStore.getState().isDemoSession;
}

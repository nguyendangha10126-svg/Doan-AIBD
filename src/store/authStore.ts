import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Child } from '@/types/database';
import { supabase, supabaseUrl, isDemoMode } from '@/lib/supabase';
import { fastHashPin, saltedHashPinSync, generateUuid, stripChildPrefix } from '@/lib/utils';

export interface AuthState {
  profile: Profile | null;
  childrenList: Child[];
  selectedChildId: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    fullName: string,
    parentalPin?: string
  ) => Promise<{ success: boolean; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<{ success: boolean; error?: string }>;
  setSelectedChildId: (id: string | null) => void;
  setChildrenList: (children: Child[]) => void;
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'parent_id'>) => Promise<Child | null>;
  updateChild: (
    childId: string,
    updates: Partial<Omit<Child, 'id' | 'parent_id' | 'created_at'>>
  ) => Promise<boolean>;
  deleteChild: (childId: string) => Promise<boolean>;
  updateProfileName: (fullName: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  hasPinConfigured: () => boolean;
  updatePin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
}

let authListenerAttached = false;

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

function emitLoggedOut() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('drawtostory:logged-out'));
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

function sanitizeNicknameInput(rawNickname: string): string {
  const trimmed = rawNickname.trim().replace(/\s+/g, ' ');
  const stripped = stripChildPrefix(trimmed);
  return stripped || trimmed;
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
                emitLoggedOut();
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
            emitLoggedOut();
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

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const cleanEmail = email.toLowerCase().trim();
          if (!cleanEmail || !password) {
            throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
          }

          if (isDemoMode) {
            const mockId = generateUuid();
            const isMockAdmin = cleanEmail.startsWith('admin@');
            const mockProfile: Profile = {
              id: mockId,
              email: cleanEmail,
              full_name: isMockAdmin ? 'Quản Trị Viên (Dev)' : cleanEmail.split('@')[0] || 'Phụ Huynh',
              role: isMockAdmin ? 'admin' : 'user',
              is_locked: false,
              daily_quota: isMockAdmin ? 100 : 5,
              parental_pin_hash: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            emitLoggedOut();
            set({
              profile: mockProfile,
              childrenList: [],
              selectedChildId: null,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
            emitProfileUpdated(mockProfile);
            return true;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
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
            await supabase.auth.signOut();
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

          // Clear any previous in-memory story/admin state before activating new user
          emitLoggedOut();

          set({
            profile: resolvedProfile,
            childrenList: validKids,
            selectedChildId: validKids.length > 0 ? validKids[0].id : null,
            isInitialized: true,
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

      register: async (
        email: string,
        password: string,
        fullName: string,
        parentalPin?: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const cleanEmail = email.toLowerCase().trim();
          const cleanName = fullName.trim();
          const cleanPin = parentalPin && /^\d{4}$/.test(parentalPin.trim()) ? parentalPin.trim() : '';

          if (isDemoMode) {
            const mockId = generateUuid();
            const newProfile: Profile = {
              id: mockId,
              email: cleanEmail,
              full_name: cleanName,
              role: 'user',
              is_locked: false,
              daily_quota: 5,
              parental_pin_hash: cleanPin ? saltedHashPinSync(cleanPin, mockId) : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            emitLoggedOut();
            set({
              profile: newProfile,
              childrenList: [],
              selectedChildId: null,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
            emitProfileUpdated(newProfile);
            return { success: true };
          }

          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: { full_name: cleanName },
            },
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data.user && !data.session) {
            set({ isLoading: false });
            return { success: true, needsConfirmation: true };
          }

          if (data.user && data.session) {
            let pinHash: string | null = null;
            if (cleanPin) {
              pinHash = saltedHashPinSync(cleanPin, data.user.id);
              await supabase
                .from('profiles')
                .update({ parental_pin_hash: pinHash, updated_at: new Date().toISOString() })
                .eq('id', data.user.id);
            }

            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            const resolvedProfile: Profile = dbProfile
              ? {
                  ...(dbProfile as Profile),
                  email: (dbProfile as Profile).email || cleanEmail,
                  parental_pin_hash: pinHash || (dbProfile as Profile).parental_pin_hash || null,
                }
              : {
                  id: data.user.id,
                  email: cleanEmail,
                  full_name: cleanName,
                  role: 'user',
                  is_locked: false,
                  daily_quota: 5,
                  parental_pin_hash: pinHash,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };

            emitLoggedOut();
            set({
              profile: resolvedProfile,
              childrenList: [],
              selectedChildId: null,
              isInitialized: true,
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
        set({
          profile: null,
          childrenList: [],
          selectedChildId: null,
          error: null,
        });
        emitLoggedOut();
        if (!isDemoMode) {
          await supabase.auth.signOut().catch(() => {});
        }
      },

      deleteAccount: async (currentPassword: string) => {
        const { profile } = get();
        if (!profile) {
          return { success: false, error: 'Phiên đăng nhập không hợp lệ.' };
        }

        if (isDemoMode) {
          await get().logout();
          return { success: true };
        }

        if (!currentPassword) {
          return { success: false, error: 'Vui lòng nhập mật khẩu hiện tại để xác thực xóa tài khoản.' };
        }

        try {
          // 1. Re-authenticate user password before destructive GDPR deletion
          if (profile.email) {
            const { error: verifyErr } = await supabase.auth.signInWithPassword({
              email: profile.email,
              password: currentPassword,
            });
            if (verifyErr) {
              return {
                success: false,
                error: 'Mật khẩu xác nhận không chính xác. Tài khoản chưa bị xóa.',
              };
            }
          }

          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) {
            return { success: false, error: 'Không thể xác thực phiên làm việc hiện tại.' };
          }

          // 2. Call Server-Side Edge Function to erase Storage files + DB rows + auth.users
          const fnRes = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const fnJson = (await fnRes.json().catch(() => null)) as {
            data?: { deleted?: boolean };
            error?: { code?: string; message?: string };
          } | null;

          if (!fnRes.ok) {
            if (fnRes.status === 404) {
              return {
                success: false,
                error:
                  'Edge Function delete-account chưa được triển khai trên Supabase. Vui lòng chạy: supabase functions deploy delete-account',
              };
            }
            return {
              success: false,
              error: fnJson?.error?.message || 'Không thể xóa tài khoản từ máy chủ.',
            };
          }

          // 3. Clean up local user guide preferences & sign out
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(`drawtostory_guide_never_${profile.id}`);
            window.sessionStorage.removeItem(`drawtostory_guide_seen_session_${profile.id}`);
          }

          await get().logout();
          return { success: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi xóa tài khoản.';
          return { success: false, error: msg };
        }
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

        const normalizedNickname = sanitizeNicknameInput(childData.nickname);

        if (isDemoMode) {
          const demoChild: Child = {
            id: generateUuid(),
            parent_id: profile.id,
            nickname: normalizedNickname,
            age: childData.age,
            avatar_color: childData.avatar_color,
            avatar_emoji: childData.avatar_emoji,
            created_at: new Date().toISOString(),
          };
          const nextKids = [...childrenList, demoChild];
          set({
            childrenList: nextKids,
            selectedChildId: demoChild.id,
          });
          return demoChild;
        }

        const { data, error } = await supabase
          .from('children')
          .insert({
            parent_id: profile.id,
            nickname: normalizedNickname,
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
        const normalizedUpdates = {
          ...updates,
          ...(typeof updates.nickname === 'string'
            ? { nickname: sanitizeNicknameInput(updates.nickname) }
            : {}),
        };

        if (!isDemoMode) {
          const { error } = await supabase
            .from('children')
            .update(normalizedUpdates)
            .eq('id', childId);
          if (error) {
            console.error('updateChild error:', error);
            return false;
          }
        }
        const updatedList = childrenList.map((c) =>
          c.id === childId ? { ...c, ...normalizedUpdates } : c
        );
        set({ childrenList: updatedList });
        return true;
      },

      deleteChild: async (childId) => {
        const { childrenList, selectedChildId } = get();
        if (!isDemoMode) {
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
        emitChildDeleted(childId);
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

      hasPinConfigured: () => {
        return Boolean(get().profile?.parental_pin_hash);
      },

      updatePin: async (pin: string) => {
        const { profile } = get();
        if (!profile) return false;
        const cleanPin = pin.trim();
        if (!/^\d{4}$/.test(cleanPin)) return false;

        const hashed = saltedHashPinSync(cleanPin, profile.id);
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
        // SECURITY: Never fall back to a public default PIN such as '1234'
        if (!profile || !stored) {
          return false;
        }
        const cleanPin = pin.trim();
        if (!/^\d{4}$/.test(cleanPin)) {
          return false;
        }
        const salted = saltedHashPinSync(cleanPin, profile.id);
        if (salted === stored) return true;
        // Support custom PINs saved before v2 salt upgrade, except the insecure '1234' hash
        const legacyHash = fastHashPin(cleanPin);
        if (stored !== '001627dbf308f962' && legacyHash === stored) {
          return true;
        }
        return false;
      },
    }),
    {
      name: 'drawtostory-auth-storage',
      partialize: (state) => ({
        selectedChildId: state.selectedChildId,
        ...(isDemoMode
          ? {
              profile: state.profile,
              childrenList: state.childrenList,
            }
          : {}),
      }),
    }
  )
);

export function isUsingDemoSession(): boolean {
  return isDemoMode;
}

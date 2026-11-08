import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SafetyRule, 
  SystemPrompt, 
  AiLog, 
  ModerationReview, 
  AdminAuditLog, 
  Profile 
} from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';
import { DEFAULT_ADMIN_PROFILE, DEFAULT_USER_PROFILE } from '@/store/authStore';

export interface AdminKpis {
  storiesToday: number;
  blockedRatePercent: number;
  pendingQueueCount: number;
  monthlyCostUsd: number;
  monthlyBudgetUsd: number;
  aiAdminAgreementPercent: number;
}

export interface DailyChartPoint {
  date: string;
  stories: number;
  tokens: number;
  cost: number;
  avgLatency: number;
  approved: number;
  rejected: number;
}

export interface AdminState {
  kpis: AdminKpis;
  chartData: DailyChartPoint[];
  safetyRules: SafetyRule[];
  systemPrompts: SystemPrompt[];
  aiLogs: AiLog[];
  moderationReviews: ModerationReview[];
  auditLogs: AdminAuditLog[];
  usersList: Profile[];
  moderationMode: 'auto' | 'manual_all';
  autoApproveMaxRisk: number;
  globalDailyLimit: number;
  strictDrawingCheck: boolean;
  isLoading: boolean;
  
  // Actions
  fetchAdminData: () => Promise<void>;
  toggleSafetyRule: (ruleId: string) => Promise<void>;
  addSafetyRule: (rule: Omit<SafetyRule, 'id' | 'created_at'>) => Promise<void>;
  deleteSafetyRule: (ruleId: string) => Promise<void>;
  updateSafetyRule: (rule: SafetyRule) => Promise<void>;

  saveSystemPromptVersion: (name: string, promptText: string) => Promise<void>;
  setActiveSystemPrompt: (promptId: string) => Promise<void>;

  approveStoryModeration: (storyId: string, adminId: string, reason?: string) => Promise<void>;
  rejectStoryModeration: (storyId: string, adminId: string, reason: string) => Promise<void>;
  batchModeration: (storyIds: string[], decision: 'approved' | 'rejected', reason: string) => Promise<void>;

  updateModerationSettings: (mode: 'auto' | 'manual_all', maxRisk: number) => Promise<void>;
  setStrictDrawingCheck: (val: boolean) => Promise<void>;
  updateGlobalDailyLimit: (limit: number) => Promise<void>;
  toggleUserLock: (userId: string) => Promise<void>;
  updateUserQuota: (userId: string, quota: number) => Promise<void>;

  logAudit: (action: string, targetType: string, targetId: string, details?: Record<string, unknown>) => Promise<void>;
  exportAiLogsCsv: () => string;
}

// Default clean initial chart points (7 days, 0 counts)
const CLEAN_CHART_DATA: DailyChartPoint[] = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(Date.now() - (6 - i) * 86400000);
  return {
    date: `${d.getDate()}/${d.getMonth() + 1}`,
    stories: 0,
    approved: 0,
    rejected: 0,
    tokens: 0,
    cost: 0,
    avgLatency: 0,
  };
});

// Master Safety Rules from Supabase schema
const INITIAL_SAFETY_RULES: SafetyRule[] = [
  { id: 'e0000001-0000-0000-0000-000000000001', category: 'Bạo lực & Vũ khí', description: 'Tranh vẽ hoặc văn bản chứa súng đạn, đao kiếm gây thương tích đẫm máu.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000002-0000-0000-0000-000000000002', category: 'Nội dung người lớn', description: 'Mọi yếu tố không phù hợp với thuần phong mỹ tục lứa tuổi thiếu nhi.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000003-0000-0000-0000-000000000003', category: 'Khuôn mặt người thật', description: 'Bảo vệ quyền riêng tư trẻ em: phát hiện ảnh chụp mặt thật thay vì tranh vẽ.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000004-0000-0000-0000-000000000004', category: 'Thông tin cá nhân (PII)', description: 'Số điện thoại, địa chỉ nhà, tên trường học xuất hiện trên giấy vẽ.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000005-0000-0000-0000-000000000005', category: 'Quái vật rùng rợn', description: 'Hình ảnh ma quỷ dị dạng gây ác mộng hoặc sang chấn tâm lý cho trẻ dưới 6 tuổi.', severity: 4, action: 'flag', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000006-0000-0000-0000-000000000006', category: 'Ngôn từ tiêu cực', description: 'Từ ngữ xúc phạm, chửi bậy, miệt thị bạn bè hoặc bắt nạt học đường.', severity: 4, action: 'rewrite', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000007-0000-0000-0000-000000000007', category: 'Hành vi nguy hiểm', description: 'Hành vi bắt chước nguy hại: nghịch diêm, sờ ổ điện, leo trèo ban công nguy hiểm.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000008-0000-0000-0000-000000000008', category: 'Phân biệt đối xử', description: 'Phân biệt giàu nghèo, giới tính, màu da hoặc khuyết tật cơ thể.', severity: 3, action: 'rewrite', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000009-0000-0000-0000-000000000009', category: 'Bi kịch bế tắc', description: 'Cốt truyện tuyệt vọng, mất mát không lối thoát hoặc kết thúc đau thương.', severity: 4, action: 'rewrite', is_active: true, created_at: new Date().toISOString() },
  { id: 'e0000010-0000-0000-0000-000000000010', category: 'Xung đột gia đình gay gắt', description: 'Bạo lực gia đình, trẻ bỏ nhà ra đi hoặc thù ghét cha mẹ.', severity: 4, action: 'flag', is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    name: 'Kể chuyện tranh thiếu nhi Việt Nam chuẩn mực v1.2',
    version: 1,
    prompt_text: `Bạn là Bác Gấu Kể Chuyện - tác giả truyện tranh thiếu nhi Việt Nam giàu tình yêu thương và am hiểu tâm lý trẻ thơ.
Nhiệm vụ: Từ bức tranh do bé vẽ, hãy dệt nên một câu chuyện tranh cổ tích ấm áp 4-5 trang.

QUY TẮC BẮT BUỘC:
1. Độ tuổi và từ vựng: Điều chỉnh độ dài câu và từ vựng chính xác theo độ tuổi của bé (2-5 tuổi câu ngắn, nhịp điệu vui vẻ; 6-12 tuổi cốt truyện phiêu lưu giàu tưởng tượng).
2. Độ dài mỗi trang: Đúng từ 30 đến 50 từ tiếng Việt. Giọng văn êm dịu, sư phạm.
3. Cảm xúc và vùng nhìn: Mỗi trang xác định emotion và focus_region {x, y, zoom} trên tranh gốc.
4. Kết thúc và bài học (Moral): Câu chuyện luôn kết thúc có hậu, tràn đầy hy vọng.
5. Vẽ tiếp gì nào: Đúng 3 gợi ý nét vẽ sáng tạo để bé tiếp tục vẽ bức tranh tiếp theo.`,
    is_active: true,
    created_by: 'a0000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      kpis: {
        storiesToday: 0,
        blockedRatePercent: 0,
        pendingQueueCount: 0,
        monthlyCostUsd: 0,
        monthlyBudgetUsd: 50.0,
        aiAdminAgreementPercent: 100,
      },
      chartData: CLEAN_CHART_DATA,
      safetyRules: INITIAL_SAFETY_RULES,
      systemPrompts: INITIAL_SYSTEM_PROMPTS,
      aiLogs: [],
      moderationReviews: [],
      auditLogs: [],
      usersList: [DEFAULT_ADMIN_PROFILE, DEFAULT_USER_PROFILE],
      moderationMode: 'auto',
      autoApproveMaxRisk: 25,
      globalDailyLimit: 5,
      strictDrawingCheck: true,
      isLoading: false,

      fetchAdminData: async () => {
        if (isDemoMode) return;
        set({ isLoading: true });
        try {
          // Fetch profiles, rules, prompts, settings, stories, logs
          const [
            { data: profiles },
            { data: rules },
            { data: prompts },
            { data: settings },
            { data: logs },
            { data: stories },
            { data: reviews },
            { data: audits },
          ] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('safety_rules').select('*').order('created_at', { ascending: true }),
            supabase.from('system_prompts').select('*').order('created_at', { ascending: false }),
            supabase.from('app_settings').select('*'),
            supabase.from('ai_logs').select('*').order('created_at', { ascending: false }).limit(50),
            supabase.from('stories').select('id, status, risk_score, created_at'),
            supabase.from('moderation_reviews').select('*').order('created_at', { ascending: false }),
            supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
          ]);

          const stateUpdates: Partial<AdminState> = {};

          if (profiles && profiles.length > 0) {
            stateUpdates.usersList = profiles as Profile[];
          }

          if (rules && rules.length > 0) {
            stateUpdates.safetyRules = rules as SafetyRule[];
          }

          if (prompts && prompts.length > 0) {
            stateUpdates.systemPrompts = prompts as SystemPrompt[];
          }

          if (logs) {
            stateUpdates.aiLogs = logs as AiLog[];
          }

          if (reviews) {
            stateUpdates.moderationReviews = reviews as ModerationReview[];
          }

          if (audits) {
            stateUpdates.auditLogs = audits as AdminAuditLog[];
          }

          // Parse app settings
          if (settings) {
            settings.forEach((s: { key: string; value: string }) => {
              if (s.key === 'moderation_mode') stateUpdates.moderationMode = s.value as 'auto' | 'manual_all';
              if (s.key === 'auto_approve_max_risk') stateUpdates.autoApproveMaxRisk = parseInt(s.value, 10) || 25;
              if (s.key === 'daily_story_limit') stateUpdates.globalDailyLimit = parseInt(s.value, 10) || 5;
              if (s.key === 'strict_drawing_check') stateUpdates.strictDrawingCheck = s.value === 'true';
            });
          }

          // Compute Real-time KPIs
          const allStories = stories || [];
          const allLogs = logs || [];
          const todayPrefix = new Date().toISOString().substring(0, 10);
          const storiesToday = allStories.filter((s) => (s.created_at || '').startsWith(todayPrefix)).length;
          const pendingCount = allStories.filter((s) => s.status === 'pending_review').length;
          const rejectedCount = allStories.filter((s) => s.status === 'rejected').length;
          const blockedRate = allStories.length > 0 ? Number(((rejectedCount / allStories.length) * 100).toFixed(1)) : 0;
          const totalCostUsd = allLogs.reduce((acc, curr) => acc + (Number(curr.estimated_cost_usd) || 0), 0);

          let budgetUsd = 50.0;
          const budgetSetting = settings?.find((s: { key: string }) => s.key === 'monthly_budget_usd');
          if (budgetSetting) budgetUsd = parseFloat(budgetSetting.value) || 50.0;

          stateUpdates.kpis = {
            storiesToday,
            blockedRatePercent: blockedRate,
            pendingQueueCount: pendingCount,
            monthlyCostUsd: Number(totalCostUsd.toFixed(4)),
            monthlyBudgetUsd: budgetUsd,
            aiAdminAgreementPercent: reviews && reviews.length > 0 ? 95 : 100,
          };

          set(stateUpdates);
        } catch (err) {
          console.error('fetchAdminData error:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleSafetyRule: async (ruleId: string) => {
        const rule = get().safetyRules.find((r) => r.id === ruleId);
        const nextActive = !rule?.is_active;

        set((state) => ({
          safetyRules: state.safetyRules.map((r) =>
            r.id === ruleId ? { ...r, is_active: nextActive } : r
          ),
        }));

        if (!isDemoMode) {
          await supabase.from('safety_rules').update({ is_active: nextActive }).eq('id', ruleId);
        }
        await get().logAudit('TOGGLE_RULE', 'safety_rules', ruleId, { is_active: nextActive });
      },

      addSafetyRule: async (rule) => {
        const tempId = 'e' + Date.now().toString(16).padStart(31, '0').substring(0, 31);
        const newRule: SafetyRule = {
          ...rule,
          id: tempId,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data } = await supabase.from('safety_rules').insert(rule).select().single();
          if (data) newRule.id = data.id;
        }

        set((state) => ({
          safetyRules: [newRule, ...state.safetyRules],
        }));
        await get().logAudit('CREATE_RULE', 'safety_rules', newRule.id, { category: rule.category });
      },

      deleteSafetyRule: async (ruleId: string) => {
        set((state) => ({
          safetyRules: state.safetyRules.filter((r) => r.id !== ruleId),
        }));

        if (!isDemoMode) {
          await supabase.from('safety_rules').delete().eq('id', ruleId);
        }
        await get().logAudit('DELETE_RULE', 'safety_rules', ruleId);
      },

      updateSafetyRule: async (rule: SafetyRule) => {
        set((state) => ({
          safetyRules: state.safetyRules.map((r) => (r.id === rule.id ? rule : r)),
        }));

        if (!isDemoMode) {
          await supabase.from('safety_rules').update(rule).eq('id', rule.id);
        }
        await get().logAudit('UPDATE_RULE', 'safety_rules', rule.id, { severity: rule.severity, action: rule.action });
      },

      saveSystemPromptVersion: async (name: string, promptText: string) => {
        const { systemPrompts } = get();
        const nextVersion = systemPrompts.length + 1;
        const newPrompt: SystemPrompt = {
          id: 'f' + Date.now().toString(16).padStart(31, '0').substring(0, 31),
          name,
          version: nextVersion,
          prompt_text: promptText,
          is_active: false,
          created_by: 'a0000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data } = await supabase.from('system_prompts').insert({
            name,
            version: nextVersion,
            prompt_text: promptText,
            is_active: false,
            created_by: 'a0000000-0000-0000-0000-000000000001',
          }).select().single();
          if (data) newPrompt.id = data.id;
        }

        set({ systemPrompts: [newPrompt, ...systemPrompts] });
        await get().logAudit('SAVE_PROMPT_VERSION', 'system_prompts', newPrompt.id, { version: nextVersion });
      },

      setActiveSystemPrompt: async (promptId: string) => {
        set((state) => ({
          systemPrompts: state.systemPrompts.map((p) => ({
            ...p,
            is_active: p.id === promptId,
          })),
        }));

        if (!isDemoMode) {
          await supabase.from('system_prompts').update({ is_active: false }).neq('id', promptId);
          await supabase.from('system_prompts').update({ is_active: true }).eq('id', promptId);
        }
        await get().logAudit('SET_ACTIVE_PROMPT', 'system_prompts', promptId);
      },

      approveStoryModeration: async (storyId: string, adminId: string, reason = 'Phê duyệt an toàn') => {
        const review: ModerationReview = {
          id: 'rev-' + Date.now(),
          story_id: storyId,
          admin_id: adminId,
          decision: 'approved',
          reason,
          ai_risk_score_at_review: 20,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          await supabase.from('moderation_reviews').insert({
            story_id: storyId,
            admin_id: adminId,
            decision: 'approved',
            reason,
            ai_risk_score_at_review: 20,
          });
          await supabase.from('stories').update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
          }).eq('id', storyId);
        }

        set((state) => ({
          moderationReviews: [review, ...state.moderationReviews],
          kpis: { ...state.kpis, pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - 1) },
        }));
        await get().logAudit('APPROVE_STORY', 'stories', storyId, { reason });
      },

      rejectStoryModeration: async (storyId: string, adminId: string, reason: string) => {
        const review: ModerationReview = {
          id: 'rev-' + Date.now(),
          story_id: storyId,
          admin_id: adminId,
          decision: 'rejected',
          reason,
          ai_risk_score_at_review: 55,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          await supabase.from('moderation_reviews').insert({
            story_id: storyId,
            admin_id: adminId,
            decision: 'rejected',
            reason,
            ai_risk_score_at_review: 55,
          });
          await supabase.from('stories').update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
          }).eq('id', storyId);
        }

        set((state) => ({
          moderationReviews: [review, ...state.moderationReviews],
          kpis: { ...state.kpis, pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - 1) },
        }));
        await get().logAudit('REJECT_STORY', 'stories', storyId, { reason });
      },

      batchModeration: async (storyIds: string[], decision: 'approved' | 'rejected', reason: string) => {
        const newReviews: ModerationReview[] = storyIds.map((id) => ({
          id: 'rev-' + Math.random().toString(36).substring(2, 9),
          story_id: id,
          admin_id: 'a0000000-0000-0000-0000-000000000001',
          decision,
          reason,
          ai_risk_score_at_review: decision === 'approved' ? 15 : 60,
          created_at: new Date().toISOString(),
        }));

        if (!isDemoMode) {
          for (const sId of storyIds) {
            await supabase.from('moderation_reviews').insert({
              story_id: sId,
              admin_id: 'a0000000-0000-0000-0000-000000000001',
              decision,
              reason,
              ai_risk_score_at_review: decision === 'approved' ? 15 : 60,
            });
            await supabase.from('stories').update({
              status: decision === 'approved' ? 'approved' : 'rejected',
              rejection_reason: decision === 'rejected' ? reason : null,
              reviewed_by: 'a0000000-0000-0000-0000-000000000001',
              reviewed_at: new Date().toISOString(),
            }).eq('id', sId);
          }
        }

        set((state) => ({
          moderationReviews: [...newReviews, ...state.moderationReviews],
          kpis: {
            ...state.kpis,
            pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - storyIds.length),
          },
        }));
        await get().logAudit('BATCH_MODERATION', 'stories', storyIds.join(','), { count: storyIds.length, decision });
      },

      updateModerationSettings: async (mode: 'auto' | 'manual_all', maxRisk: number) => {
        set({
          moderationMode: mode,
          autoApproveMaxRisk: maxRisk,
        });

        if (!isDemoMode) {
          await supabase.from('app_settings').upsert([
            { key: 'moderation_mode', value: mode, updated_at: new Date().toISOString() },
            { key: 'auto_approve_max_risk', value: maxRisk.toString(), updated_at: new Date().toISOString() },
          ]);
        }
        await get().logAudit('UPDATE_SETTINGS', 'app_settings', 'moderation_mode', { mode, maxRisk });
      },

      setStrictDrawingCheck: async (val: boolean) => {
        set({ strictDrawingCheck: val });

        if (!isDemoMode) {
          await supabase.from('app_settings').upsert({
            key: 'strict_drawing_check',
            value: val ? 'true' : 'false',
            updated_at: new Date().toISOString(),
          });
        }
        await get().logAudit('UPDATE_STRICT_DRAWING', 'app_settings', 'strict_drawing_check', { enabled: val });
      },

      updateGlobalDailyLimit: async (limit: number) => {
        set({ globalDailyLimit: limit });

        if (!isDemoMode) {
          await supabase.from('app_settings').upsert({
            key: 'daily_story_limit',
            value: limit.toString(),
            updated_at: new Date().toISOString(),
          });
        }
        await get().logAudit('UPDATE_GLOBAL_LIMIT', 'app_settings', 'daily_story_limit', { limit });
      },

      toggleUserLock: async (userId: string) => {
        const user = get().usersList.find((u) => u.id === userId);
        const nextLock = !user?.is_locked;

        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === userId ? { ...u, is_locked: nextLock } : u
          ),
        }));

        if (!isDemoMode) {
          await supabase.from('profiles').update({ is_locked: nextLock }).eq('id', userId);
        }
        await get().logAudit('TOGGLE_USER_LOCK', 'profiles', userId, { is_locked: nextLock });
      },

      updateUserQuota: async (userId: string, quota: number) => {
        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === userId ? { ...u, daily_quota: quota } : u
          ),
        }));

        if (!isDemoMode) {
          await supabase.from('profiles').update({ daily_quota: quota }).eq('id', userId);
        }
        await get().logAudit('UPDATE_USER_QUOTA', 'profiles', userId, { quota });
      },

      logAudit: async (action: string, targetType: string, targetId: string, details = {}) => {
        const audit: AdminAuditLog = {
          id: 'aud-' + Date.now(),
          admin_id: 'a0000000-0000-0000-0000-000000000001',
          action,
          target_type: targetType,
          target_id: targetId,
          details,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: 'a0000000-0000-0000-0000-000000000001',
            action,
            target_type: targetType,
            target_id: targetId,
            details,
          });
        }

        set((state) => ({
          auditLogs: [audit, ...state.auditLogs],
        }));
      },

      exportAiLogsCsv: () => {
        const { aiLogs } = get();
        const headers = ['Thời gian', 'Người dùng', 'Thao tác', 'Model', 'Input Tokens', 'Output Tokens', 'Độ trễ (ms)', 'Chi phí ($)', 'Trạng thái'];
        const rows = aiLogs.map((l) => [
          l.created_at,
          l.user_id || 'N/A',
          l.action,
          l.model,
          l.input_tokens,
          l.output_tokens,
          l.latency_ms,
          l.estimated_cost_usd,
          l.status,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      },
    }),
    {
      name: 'drawtostory-admin-storage',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SafetyRule,
  SystemPrompt,
  AiLog,
  ModerationReview,
  AdminAuditLog,
  Profile,
  RiskReason,
  isStoryApproved,
} from '@/types/database';
import { supabase, isDemoMode } from '@/lib/supabase';
import { DEFAULT_ADMIN_PROFILE, DEFAULT_USER_PROFILE, useAuthStore } from '@/store/authStore';
import { useStoryStore } from '@/store/storyStore';

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

export interface RejectionCategoryPoint {
  name: string;
  count: number;
}

export interface AdminState {
  kpis: AdminKpis;
  chartData: DailyChartPoint[];
  chartData30d: DailyChartPoint[];
  rejectionCategories: RejectionCategoryPoint[];
  hasReviewedStories: boolean;
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
  geminiApiKey: string;
  isLoading: boolean;

  // Actions
  fetchAdminData: () => Promise<void>;
  toggleSafetyRule: (ruleId: string) => Promise<boolean>;
  addSafetyRule: (rule: Omit<SafetyRule, 'id' | 'created_at'>) => Promise<boolean>;
  deleteSafetyRule: (ruleId: string) => Promise<boolean>;
  updateSafetyRule: (rule: SafetyRule) => Promise<boolean>;

  saveSystemPromptVersion: (name: string, promptText: string) => Promise<boolean>;
  setActiveSystemPrompt: (promptId: string) => Promise<boolean>;

  approveStoryModeration: (storyId: string, adminId: string, reason?: string) => Promise<boolean>;
  rejectStoryModeration: (storyId: string, adminId: string, reason: string) => Promise<boolean>;
  batchModeration: (storyIds: string[], decision: 'approved' | 'rejected', reason: string) => Promise<boolean>;

  updateModerationSettings: (mode: 'auto' | 'manual_all', maxRisk: number) => Promise<boolean>;
  setStrictDrawingCheck: (val: boolean) => Promise<boolean>;
  updateGlobalDailyLimit: (limit: number) => Promise<boolean>;
  updateMonthlyBudget: (budgetUsd: number) => Promise<boolean>;
  updateGeminiApiKey: (apiKey: string) => Promise<boolean>;
  toggleUserLock: (userId: string) => Promise<boolean>;
  updateUserQuota: (userId: string, quota: number) => Promise<boolean>;

  logAudit: (action: string, targetType: string, targetId: string, details?: Record<string, unknown>) => Promise<void>;
  exportAiLogsCsv: () => string;
}

function buildEmptyDays(daysCount: number): Array<{ isoKey: string; point: DailyChartPoint }> {
  return Array.from({ length: daysCount }).map((_, idx) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (daysCount - 1 - idx));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      isoKey: `${year}-${month}-${day}`,
      point: {
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        stories: 0,
        approved: 0,
        rejected: 0,
        tokens: 0,
        cost: 0,
        avgLatency: 0,
      },
    };
  });
}

function toLocalDayKey(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CLEAN_CHART_7D = buildEmptyDays(7).map((b) => b.point);
const CLEAN_CHART_30D = buildEmptyDays(30).map((b) => b.point);

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
1. Bám sát tranh vẽ 100%: Tiêu đề và mọi trang truyện phải kể đúng về các nhân vật, đồ vật, màu sắc thật sự xuất hiện trong tranh của bé; tuyệt đối không bịa thêm nhân vật chính ngoài tranh.
2. Độ tuổi và từ vựng: Điều chỉnh độ dài câu và từ vựng chính xác theo độ tuổi của bé (2-5 tuổi câu ngắn, nhịp điệu vui vẻ; 6-12 tuổi cốt truyện phiêu lưu giàu tưởng tượng).
3. Độ dài mỗi trang: Đúng từ 30 đến 50 từ tiếng Việt. Giọng văn êm dịu, sư phạm.
4. Cảm xúc và vùng nhìn: Mỗi trang xác định emotion và focus_region {x, y, zoom} trên tranh gốc.
5. Kết thúc và bài học (Moral): Câu chuyện luôn kết thúc có hậu, tràn đầy hy vọng.
6. Vẽ tiếp gì nào: Đúng 3 gợi ý nét vẽ sáng tạo để bé tiếp tục vẽ bức tranh tiếp theo.`,
    is_active: true,
    created_by: 'a0000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
];

const ERROR_CODE_LABELS: Record<string, string> = {
  NOT_A_DRAWING: 'Ảnh không phải tranh vẽ',
  REAL_FACE_DETECTED: 'Khuôn mặt người thật',
  PII_DETECTED: 'Thông tin cá nhân (PII)',
  UNSAFE_INPUT: 'Vi phạm an toàn đầu vào',
  IMAGE_TOO_BLURRY: 'Ảnh mờ / thiếu nét',
  IMAGE_TOO_DARK: 'Ảnh thiếu sáng',
};

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
      chartData: CLEAN_CHART_7D,
      chartData30d: CLEAN_CHART_30D,
      rejectionCategories: [],
      hasReviewedStories: false,
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
      geminiApiKey: '',
      isLoading: false,

      fetchAdminData: async () => {
        if (isDemoMode) return;
        set({ isLoading: true });
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

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
            supabase.from('system_prompts').select('*').order('version', { ascending: false }),
            supabase.from('app_settings').select('*'),
            supabase.from('ai_logs').select('*').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(500),
            supabase.from('stories').select('id, status, risk_score, risk_reasons, rejection_reason, created_at'),
            supabase.from('moderation_reviews').select('*').order('created_at', { ascending: false }),
            supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
          ]);

          const stateUpdates: Partial<AdminState> = {};

          if (profiles) {
            stateUpdates.usersList = profiles as Profile[];
          }

          if (rules && rules.length > 0) {
            stateUpdates.safetyRules = rules as SafetyRule[];
          }

          if (prompts && prompts.length > 0) {
            stateUpdates.systemPrompts = prompts as SystemPrompt[];
          }

          const allLogs = (logs as AiLog[]) || [];
          stateUpdates.aiLogs = allLogs;

          const allReviews = (reviews as ModerationReview[]) || [];
          stateUpdates.moderationReviews = allReviews;
          stateUpdates.hasReviewedStories = allReviews.length > 0;

          if (audits) {
            stateUpdates.auditLogs = audits as AdminAuditLog[];
          }

          let maxRiskThreshold = 25;
          let budgetUsd = 50.0;

          if (settings) {
            settings.forEach((s: { key: string; value: string }) => {
              if (s.key === 'moderation_mode') {
                stateUpdates.moderationMode = s.value === 'manual_all' ? 'manual_all' : 'auto';
              }
              if (s.key === 'auto_approve_max_risk') {
                maxRiskThreshold = parseInt(s.value, 10) || 25;
                stateUpdates.autoApproveMaxRisk = maxRiskThreshold;
              }
              if (s.key === 'daily_story_limit') {
                stateUpdates.globalDailyLimit = parseInt(s.value, 10) || 5;
              }
              if (s.key === 'strict_drawing_check') {
                stateUpdates.strictDrawingCheck = s.value === 'true';
              }
              if (s.key === 'monthly_budget_usd') {
                budgetUsd = parseFloat(s.value) || 50.0;
              }
              if (s.key === 'gemini_api_key') {
                stateUpdates.geminiApiKey = s.value || '';
              }
            });
          }

          // Build 30-day & 7-day real charts
          const buckets = buildEmptyDays(30);
          const bucketMap = new Map(buckets.map((b) => [b.isoKey, b.point]));
          const latencyCounter = new Map<string, { sum: number; count: number }>();

          const allStories = (stories || []) as Array<{
            id: string;
            status: string;
            risk_score: number;
            risk_reasons: RiskReason[] | null;
            rejection_reason: string | null;
            created_at: string;
          }>;

          for (const st of allStories) {
            const key = toLocalDayKey(st.created_at);
            const bucket = bucketMap.get(key);
            if (bucket) {
              bucket.stories += 1;
              if (isStoryApproved(st.status)) bucket.approved += 1;
              if (st.status === 'rejected') bucket.rejected += 1;
            }
          }

          for (const lg of allLogs) {
            const key = toLocalDayKey(lg.created_at);
            const bucket = bucketMap.get(key);
            if (bucket) {
              bucket.tokens += (Number(lg.input_tokens) || 0) + (Number(lg.output_tokens) || 0);
              bucket.cost = Number((bucket.cost + (Number(lg.estimated_cost_usd) || 0)).toFixed(6));
              if (lg.latency_ms > 0) {
                const prev = latencyCounter.get(key) || { sum: 0, count: 0 };
                latencyCounter.set(key, { sum: prev.sum + lg.latency_ms, count: prev.count + 1 });
              }
            }
          }

          for (const [key, lat] of latencyCounter.entries()) {
            const bucket = bucketMap.get(key);
            if (bucket && lat.count > 0) {
              bucket.avgLatency = Math.round(lat.sum / lat.count);
            }
          }

          const computed30d = buckets.map((b) => b.point);
          stateUpdates.chartData30d = computed30d;
          stateUpdates.chartData = computed30d.slice(-7);

          // Build real rejection / block categories
          const catCounts = new Map<string, number>();
          for (const st of allStories) {
            if (st.status === 'rejected') {
              const reasons = Array.isArray(st.risk_reasons) ? st.risk_reasons : [];
              if (reasons.length > 0) {
                for (const r of reasons) {
                  if (r.category) {
                    catCounts.set(r.category, (catCounts.get(r.category) || 0) + 1);
                  }
                }
              } else {
                catCounts.set('Từ chối kiểm duyệt', (catCounts.get('Từ chối kiểm duyệt') || 0) + 1);
              }
            }
          }
          for (const lg of allLogs) {
            if (lg.status === 'error' && lg.error_code && ERROR_CODE_LABELS[lg.error_code]) {
              const label = ERROR_CODE_LABELS[lg.error_code];
              catCounts.set(label, (catCounts.get(label) || 0) + 1);
            }
          }
          stateUpdates.rejectionCategories = Array.from(catCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

          // Compute Real KPIs
          const todayKey = toLocalDayKey(new Date().toISOString());
          const storiesToday = allStories.filter((s) => toLocalDayKey(s.created_at) === todayKey).length;
          const pendingCount = allStories.filter((s) => s.status === 'pending_review').length;
          const rejectedCount = allStories.filter((s) => s.status === 'rejected').length;
          const inputBlockedCount = allLogs.filter(
            (l) => l.action === 'layer1_input_safety_blocked'
          ).length;
          const totalAttempts = allStories.length + inputBlockedCount;
          const blockedRate =
            totalAttempts > 0
              ? Number((((rejectedCount + inputBlockedCount) / totalAttempts) * 100).toFixed(1))
              : 0;

          const currentMonthPrefix = new Date().toISOString().substring(0, 7);
          const monthlyCostUsd = allLogs
            .filter((l) => (l.created_at || '').startsWith(currentMonthPrefix))
            .reduce((acc, curr) => acc + (Number(curr.estimated_cost_usd) || 0), 0);

          let agreementPercent = 100;
          if (allReviews.length > 0) {
            const agreed = allReviews.filter(
              (r) =>
                (r.decision === 'rejected' && r.ai_risk_score_at_review > maxRiskThreshold) ||
                (r.decision === 'approved' && r.ai_risk_score_at_review <= 60)
            ).length;
            agreementPercent = Math.round((agreed / allReviews.length) * 100);
          }

          stateUpdates.kpis = {
            storiesToday,
            blockedRatePercent: blockedRate,
            pendingQueueCount: pendingCount,
            monthlyCostUsd: Number(monthlyCostUsd.toFixed(4)),
            monthlyBudgetUsd: budgetUsd,
            aiAdminAgreementPercent: agreementPercent,
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
        if (!rule) return false;
        const nextActive = !rule.is_active;

        if (!isDemoMode) {
          const { error } = await supabase
            .from('safety_rules')
            .update({ is_active: nextActive })
            .eq('id', ruleId);
          if (error) {
            console.error('toggleSafetyRule error:', error);
            return false;
          }
        }

        set((state) => ({
          safetyRules: state.safetyRules.map((r) =>
            r.id === ruleId ? { ...r, is_active: nextActive } : r
          ),
        }));
        await get().logAudit('TOGGLE_RULE', 'safety_rules', ruleId, { is_active: nextActive });
        return true;
      },

      addSafetyRule: async (rule) => {
        let createdRule: SafetyRule = {
          ...rule,
          id: 'e' + Date.now().toString(16).padStart(31, '0').substring(0, 31),
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data, error } = await supabase
            .from('safety_rules')
            .insert(rule)
            .select()
            .single();
          if (error || !data) {
            console.error('addSafetyRule error:', error);
            return false;
          }
          createdRule = data as SafetyRule;
        }

        set((state) => ({
          safetyRules: [createdRule, ...state.safetyRules],
        }));
        await get().logAudit('CREATE_RULE', 'safety_rules', createdRule.id, { category: rule.category });
        return true;
      },

      deleteSafetyRule: async (ruleId: string) => {
        if (!isDemoMode) {
          const { error } = await supabase.from('safety_rules').delete().eq('id', ruleId);
          if (error) {
            console.error('deleteSafetyRule error:', error);
            return false;
          }
        }

        set((state) => ({
          safetyRules: state.safetyRules.filter((r) => r.id !== ruleId),
        }));
        await get().logAudit('DELETE_RULE', 'safety_rules', ruleId);
        return true;
      },

      updateSafetyRule: async (rule: SafetyRule) => {
        if (!isDemoMode) {
          const { error } = await supabase
            .from('safety_rules')
            .update({
              category: rule.category,
              description: rule.description,
              severity: rule.severity,
              action: rule.action,
              is_active: rule.is_active,
            })
            .eq('id', rule.id);
          if (error) {
            console.error('updateSafetyRule error:', error);
            return false;
          }
        }

        set((state) => ({
          safetyRules: state.safetyRules.map((r) => (r.id === rule.id ? rule : r)),
        }));
        await get().logAudit('UPDATE_RULE', 'safety_rules', rule.id, {
          severity: rule.severity,
          action: rule.action,
        });
        return true;
      },

      saveSystemPromptVersion: async (name: string, promptText: string) => {
        const { systemPrompts } = get();
        const maxVersion = systemPrompts.reduce((max, p) => Math.max(max, p.version || 0), 0);
        const nextVersion = maxVersion + 1;
        const adminId = useAuthStore.getState().profile?.id || DEFAULT_ADMIN_PROFILE.id;

        let createdPrompt: SystemPrompt = {
          id: 'f' + Date.now().toString(16).padStart(31, '0').substring(0, 31),
          name: name.trim(),
          version: nextVersion,
          prompt_text: promptText.trim(),
          is_active: false,
          created_by: adminId,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data, error } = await supabase
            .from('system_prompts')
            .insert({
              name: name.trim(),
              version: nextVersion,
              prompt_text: promptText.trim(),
              is_active: false,
              created_by: adminId,
            })
            .select()
            .single();
          if (error || !data) {
            console.error('saveSystemPromptVersion error:', error);
            return false;
          }
          createdPrompt = data as SystemPrompt;
        }

        set({ systemPrompts: [createdPrompt, ...systemPrompts] });
        await get().logAudit('SAVE_PROMPT_VERSION', 'system_prompts', createdPrompt.id, {
          version: nextVersion,
        });
        return true;
      },

      setActiveSystemPrompt: async (promptId: string) => {
        if (!isDemoMode) {
          const { error: offError } = await supabase
            .from('system_prompts')
            .update({ is_active: false })
            .neq('id', promptId);
          if (offError) {
            console.error('setActiveSystemPrompt offError:', offError);
            return false;
          }
          const { error: onError } = await supabase
            .from('system_prompts')
            .update({ is_active: true })
            .eq('id', promptId);
          if (onError) {
            console.error('setActiveSystemPrompt onError:', onError);
            return false;
          }
        }

        set((state) => ({
          systemPrompts: state.systemPrompts.map((p) => ({
            ...p,
            is_active: p.id === promptId,
          })),
        }));
        await get().logAudit('SET_ACTIVE_PROMPT', 'system_prompts', promptId);
        return true;
      },

      approveStoryModeration: async (storyId: string, adminId: string, reason = 'Phê duyệt an toàn') => {
        const resolvedAdminId = useAuthStore.getState().profile?.id || adminId || DEFAULT_ADMIN_PROFILE.id;
        const targetStory = useStoryStore.getState().stories.find((s) => s.id === storyId);
        const riskAtReview = targetStory?.risk_score ?? 0;

        let createdReview: ModerationReview = {
          id: 'rev-' + Date.now(),
          story_id: storyId,
          admin_id: resolvedAdminId,
          decision: 'approved',
          reason,
          ai_risk_score_at_review: riskAtReview,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data: revData, error: revErr } = await supabase
            .from('moderation_reviews')
            .insert({
              story_id: storyId,
              admin_id: resolvedAdminId,
              decision: 'approved',
              reason,
              ai_risk_score_at_review: riskAtReview,
            })
            .select()
            .single();

          if (revErr) {
            console.error('approveStoryModeration review error:', revErr);
            return false;
          }
          if (revData) createdReview = revData as ModerationReview;

          const { error: storyErr } = await supabase
            .from('stories')
            .update({
              status: 'approved',
              rejection_reason: null,
              reviewed_by: resolvedAdminId,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', storyId);

          if (storyErr) {
            console.error('approveStoryModeration story error:', storyErr);
            return false;
          }
        }

        await useStoryStore.getState().updateStoryStatus(storyId, 'approved');

        set((state) => ({
          moderationReviews: [createdReview, ...state.moderationReviews],
          hasReviewedStories: true,
          kpis: {
            ...state.kpis,
            pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - 1),
          },
        }));
        await get().logAudit('APPROVE_STORY', 'stories', storyId, { reason, riskAtReview });
        return true;
      },

      rejectStoryModeration: async (storyId: string, adminId: string, reason: string) => {
        const resolvedAdminId = useAuthStore.getState().profile?.id || adminId || DEFAULT_ADMIN_PROFILE.id;
        const targetStory = useStoryStore.getState().stories.find((s) => s.id === storyId);
        const riskAtReview = targetStory?.risk_score ?? 50;

        let createdReview: ModerationReview = {
          id: 'rev-' + Date.now(),
          story_id: storyId,
          admin_id: resolvedAdminId,
          decision: 'rejected',
          reason,
          ai_risk_score_at_review: riskAtReview,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data: revData, error: revErr } = await supabase
            .from('moderation_reviews')
            .insert({
              story_id: storyId,
              admin_id: resolvedAdminId,
              decision: 'rejected',
              reason,
              ai_risk_score_at_review: riskAtReview,
            })
            .select()
            .single();

          if (revErr) {
            console.error('rejectStoryModeration review error:', revErr);
            return false;
          }
          if (revData) createdReview = revData as ModerationReview;

          const { error: storyErr } = await supabase
            .from('stories')
            .update({
              status: 'rejected',
              rejection_reason: reason,
              reviewed_by: resolvedAdminId,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', storyId);

          if (storyErr) {
            console.error('rejectStoryModeration story error:', storyErr);
            return false;
          }
        }

        await useStoryStore.getState().updateStoryStatus(storyId, 'rejected', reason);

        set((state) => ({
          moderationReviews: [createdReview, ...state.moderationReviews],
          hasReviewedStories: true,
          kpis: {
            ...state.kpis,
            pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - 1),
          },
        }));
        await get().logAudit('REJECT_STORY', 'stories', storyId, { reason, riskAtReview });
        return true;
      },

      batchModeration: async (storyIds: string[], decision: 'approved' | 'rejected', reason: string) => {
        const resolvedAdminId = useAuthStore.getState().profile?.id || DEFAULT_ADMIN_PROFILE.id;
        const storiesMap = new Map(useStoryStore.getState().stories.map((s) => [s.id, s]));

        const newReviews: ModerationReview[] = [];

        for (const sId of storyIds) {
          const riskAtReview = storiesMap.get(sId)?.risk_score ?? (decision === 'approved' ? 15 : 60);
          if (!isDemoMode) {
            const { error: revErr } = await supabase.from('moderation_reviews').insert({
              story_id: sId,
              admin_id: resolvedAdminId,
              decision,
              reason,
              ai_risk_score_at_review: riskAtReview,
            });
            if (revErr) {
              console.error('batchModeration review error:', revErr);
              return false;
            }
            const { error: stErr } = await supabase
              .from('stories')
              .update({
                status: decision === 'approved' ? 'approved' : 'rejected',
                rejection_reason: decision === 'rejected' ? reason : null,
                reviewed_by: resolvedAdminId,
                reviewed_at: new Date().toISOString(),
              })
              .eq('id', sId);
            if (stErr) {
              console.error('batchModeration story error:', stErr);
              return false;
            }
          }

          await useStoryStore
            .getState()
            .updateStoryStatus(sId, decision === 'approved' ? 'approved' : 'rejected', decision === 'rejected' ? reason : undefined);

          newReviews.push({
            id: 'rev-' + Math.random().toString(36).substring(2, 9),
            story_id: sId,
            admin_id: resolvedAdminId,
            decision,
            reason,
            ai_risk_score_at_review: riskAtReview,
            created_at: new Date().toISOString(),
          });
        }

        set((state) => ({
          moderationReviews: [...newReviews, ...state.moderationReviews],
          hasReviewedStories: true,
          kpis: {
            ...state.kpis,
            pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - storyIds.length),
          },
        }));
        await get().logAudit('BATCH_MODERATION', 'stories', storyIds.join(','), {
          count: storyIds.length,
          decision,
        });
        return true;
      },

      updateModerationSettings: async (mode: 'auto' | 'manual_all', maxRisk: number) => {
        if (!isDemoMode) {
          const { error } = await supabase.from('app_settings').upsert([
            { key: 'moderation_mode', value: mode, updated_at: new Date().toISOString() },
            { key: 'auto_approve_max_risk', value: maxRisk.toString(), updated_at: new Date().toISOString() },
          ]);
          if (error) {
            console.error('updateModerationSettings error:', error);
            return false;
          }
        }

        set({
          moderationMode: mode,
          autoApproveMaxRisk: maxRisk,
        });
        await get().logAudit('UPDATE_SETTINGS', 'app_settings', 'moderation_mode', { mode, maxRisk });
        return true;
      },

      setStrictDrawingCheck: async (val: boolean) => {
        if (!isDemoMode) {
          const { error } = await supabase.from('app_settings').upsert({
            key: 'strict_drawing_check',
            value: val ? 'true' : 'false',
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.error('setStrictDrawingCheck error:', error);
            return false;
          }
        }

        set({ strictDrawingCheck: val });
        await get().logAudit('UPDATE_STRICT_DRAWING', 'app_settings', 'strict_drawing_check', {
          enabled: val,
        });
        return true;
      },

      updateGlobalDailyLimit: async (limit: number) => {
        if (!isDemoMode) {
          const { error } = await supabase.from('app_settings').upsert({
            key: 'daily_story_limit',
            value: limit.toString(),
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.error('updateGlobalDailyLimit error:', error);
            return false;
          }
        }

        set({ globalDailyLimit: limit });
        await get().logAudit('UPDATE_GLOBAL_LIMIT', 'app_settings', 'daily_story_limit', { limit });
        return true;
      },

      updateMonthlyBudget: async (budgetUsd: number) => {
        if (!isDemoMode) {
          const { error } = await supabase.from('app_settings').upsert({
            key: 'monthly_budget_usd',
            value: budgetUsd.toFixed(2),
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.error('updateMonthlyBudget error:', error);
            return false;
          }
        }

        set((state) => ({
          kpis: { ...state.kpis, monthlyBudgetUsd: budgetUsd },
        }));
        await get().logAudit('UPDATE_MONTHLY_BUDGET', 'app_settings', 'monthly_budget_usd', { budgetUsd });
        return true;
      },

      updateGeminiApiKey: async (apiKey: string) => {
        const cleanKey = apiKey.trim();
        if (!isDemoMode) {
          const { error } = await supabase.from('app_settings').upsert({
            key: 'gemini_api_key',
            value: cleanKey,
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.error('updateGeminiApiKey error:', error);
            return false;
          }
        }

        set({ geminiApiKey: cleanKey });
        await get().logAudit('UPDATE_AI_KEY', 'app_settings', 'gemini_api_key', {
          configured: Boolean(cleanKey),
        });
        return true;
      },

      toggleUserLock: async (userId: string) => {
        const user = get().usersList.find((u) => u.id === userId);
        if (!user) return false;
        const nextLock = !user.is_locked;

        if (!isDemoMode) {
          const { error } = await supabase
            .from('profiles')
            .update({ is_locked: nextLock, updated_at: new Date().toISOString() })
            .eq('id', userId);
          if (error) {
            console.error('toggleUserLock error:', error);
            return false;
          }
        }

        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === userId ? { ...u, is_locked: nextLock } : u
          ),
        }));
        await get().logAudit('TOGGLE_USER_LOCK', 'profiles', userId, { is_locked: nextLock });
        return true;
      },

      updateUserQuota: async (userId: string, quota: number) => {
        if (!isDemoMode) {
          const { error } = await supabase
            .from('profiles')
            .update({ daily_quota: quota, updated_at: new Date().toISOString() })
            .eq('id', userId);
          if (error) {
            console.error('updateUserQuota error:', error);
            return false;
          }
        }

        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === userId ? { ...u, daily_quota: quota } : u
          ),
        }));
        await get().logAudit('UPDATE_USER_QUOTA', 'profiles', userId, { quota });
        return true;
      },

      logAudit: async (action: string, targetType: string, targetId: string, details = {}) => {
        const adminId = useAuthStore.getState().profile?.id || DEFAULT_ADMIN_PROFILE.id;
        let audit: AdminAuditLog = {
          id: 'aud-' + Date.now(),
          admin_id: adminId,
          action,
          target_type: targetType,
          target_id: targetId,
          details,
          created_at: new Date().toISOString(),
        };

        if (!isDemoMode) {
          const { data } = await supabase
            .from('admin_audit_logs')
            .insert({
              admin_id: adminId,
              action,
              target_type: targetType,
              target_id: targetId,
              details,
            })
            .select()
            .single();
          if (data) audit = data as AdminAuditLog;
        }

        set((state) => ({
          auditLogs: [audit, ...state.auditLogs],
        }));
      },

      exportAiLogsCsv: () => {
        const { aiLogs } = get();
        const headers = [
          'Thời gian',
          'Người dùng',
          'Thao tác',
          'Model',
          'Input Tokens',
          'Output Tokens',
          'Độ trễ (ms)',
          'Chi phí ($)',
          'Trạng thái',
          'Mã lỗi',
        ];
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
          l.error_code || '',
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      },
    }),
    {
      name: 'drawtostory-admin-storage',
      partialize: (state) => ({
        moderationMode: state.moderationMode,
        autoApproveMaxRisk: state.autoApproveMaxRisk,
        globalDailyLimit: state.globalDailyLimit,
        strictDrawingCheck: state.strictDrawingCheck,
      }),
    }
  )
);

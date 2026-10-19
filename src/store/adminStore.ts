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
  
  // Actions
  toggleSafetyRule: (ruleId: string) => void;
  addSafetyRule: (rule: Omit<SafetyRule, 'id' | 'created_at'>) => void;
  deleteSafetyRule: (ruleId: string) => void;
  updateSafetyRule: (rule: SafetyRule) => void;

  saveSystemPromptVersion: (name: string, promptText: string) => void;
  setActiveSystemPrompt: (promptId: string) => void;

  approveStoryModeration: (storyId: string, adminId: string, reason?: string) => void;
  rejectStoryModeration: (storyId: string, adminId: string, reason: string) => void;
  batchModeration: (storyIds: string[], decision: 'approved' | 'rejected', reason: string) => void;

  updateModerationSettings: (mode: 'auto' | 'manual_all', maxRisk: number) => void;
  updateGlobalDailyLimit: (limit: number) => void;
  toggleUserLock: (userId: string) => void;
  updateUserQuota: (userId: string, quota: number) => void;

  logAudit: (action: string, targetType: string, targetId: string, details?: Record<string, unknown>) => void;
  exportAiLogsCsv: () => string;
}

// 30 Days of realistic analytics chart points
const GENERATED_CHART_DATA: DailyChartPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date(Date.now() - (29 - i) * 86400000);
  const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
  const total = Math.floor(Math.random() * 8) + 4;
  const rejected = Math.floor(Math.random() * 2);
  const approved = total - rejected;
  const tokens = total * (1200 + Math.floor(Math.random() * 400));
  const cost = Number(((tokens / 1_000_000) * 0.18).toFixed(4));
  const avgLatency = 1800 + Math.floor(Math.random() * 900);

  return {
    date: dateStr,
    stories: total,
    approved,
    rejected,
    tokens,
    cost,
    avgLatency,
  };
});

const INITIAL_SAFETY_RULES: SafetyRule[] = [
  { id: 'r1', category: 'Bạo lực & Vũ khí', description: 'Tranh vẽ hoặc văn bản chứa súng đạn, đao kiếm gây thương tích đẫm máu.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'r2', category: 'Nội dung người lớn', description: 'Mọi yếu tố không phù hợp với thuần phong mỹ tục lứa tuổi thiếu nhi.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'r3', category: 'Khuôn mặt người thật', description: 'Bảo vệ quyền riêng tư trẻ em: phát hiện ảnh chụp mặt thật thay vì tranh vẽ.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'r4', category: 'Thông tin cá nhân (PII)', description: 'Số điện thoại, địa chỉ nhà, tên trường học xuất hiện trên giấy vẽ.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'r5', category: 'Quái vật rùng rợn', description: 'Hình ảnh ma quỷ dị dạng gây ác mộng hoặc sang chấn tâm lý cho trẻ dưới 6 tuổi.', severity: 4, action: 'flag', is_active: true, created_at: new Date().toISOString() },
  { id: 'r6', category: 'Ngôn từ tiêu cực', description: 'Từ ngữ xúc phạm, chửi bậy, miệt thị bạn bè hoặc bắt nạt học đường.', severity: 4, action: 'rewrite', is_active: true, created_at: new Date().toISOString() },
  { id: 'r7', category: 'Hành vi nguy hiểm', description: 'Hành vi bắt chước nguy hại: nghịch diêm, sờ ổ điện, leo trèo ban công nguy hiểm.', severity: 5, action: 'block', is_active: true, created_at: new Date().toISOString() },
  { id: 'r8', category: 'Phân biệt đối xử', description: 'Phân biệt giàu nghèo, giới tính, màu da hoặc khuyết tật cơ thể.', severity: 3, action: 'rewrite', is_active: true, created_at: new Date().toISOString() },
  { id: 'r9', category: 'Bi kịch bế tắc', description: 'Cốt truyện tuyệt vọng, mất mát không lối thoát hoặc kết thúc đau thương.', severity: 4, action: 'rewrite', is_active: true, created_at: new Date().toISOString() },
  { id: 'r10', category: 'Xung đột gia đình gay gắt', description: 'Bạo lực gia đình, trẻ bỏ nhà ra đi hoặc thù ghét cha mẹ.', severity: 4, action: 'flag', is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'p1',
    name: 'Kể chuyện tranh thiếu nhi Việt Nam chuẩn mực v1.2',
    version: 2,
    prompt_text: `Bạn là Bác Gấu Kể Chuyện - tác giả truyện tranh thiếu nhi Việt Nam giàu tình yêu thương và am hiểu tâm lý trẻ thơ.
Nhiệm vụ: Từ bức tranh do bé vẽ, hãy dệt nên một câu chuyện tranh cổ tích ấm áp 4-5 trang.

QUY TẮC BẮT BUỘC:
1. Độ tuổi và từ vựng: Điều chỉnh độ dài câu và từ vựng chính xác theo độ tuổi của bé (2-5 tuổi câu ngắn, nhịp điệu vui vẻ; 6-12 tuổi cốt truyện phiêu lưu giàu tưởng tượng).
2. Độ dài mỗi trang: Đúng từ 30 đến 50 từ tiếng Việt. Giọng văn êm dịu, sư phạm.
3. Cảm xúc và vùng nhìn: Mỗi trang xác định emotion và focus_region {x, y, zoom} trên tranh gốc.
4. Kết thúc và bài học (Moral): Câu chuyện luôn kết thúc có hậu, tràn đầy hy vọng.
5. Vẽ tiếp gì nào: Đúng 3 gợi ý nét vẽ sáng tạo để bé tiếp tục vẽ bức tranh tiếp theo.`,
    is_active: true,
    created_by: 'admin-1',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'p0',
    name: 'Bản thảo khởi tạo sơ khởi v1.0',
    version: 1,
    prompt_text: 'Kể chuyện cho bé từ tranh vẽ với kết thúc vui vẻ và bài học đạo đức.',
    is_active: false,
    created_by: 'admin-1',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const INITIAL_AI_LOGS: AiLog[] = Array.from({ length: 25 }).map((_, i) => ({
  id: 'log-' + (i + 1),
  user_id: 'user-0000-0000-0000-000000000002',
  story_id: 's0000001-0000-0000-0000-000000000001',
  action: 'generate_story_3_layers',
  model: 'gemini-2.5-flash',
  input_tokens: 850 + (i * 25),
  output_tokens: 460 + (i * 15),
  latency_ms: 1950 + (i * 50),
  estimated_cost_usd: Number((0.00085 + i * 0.00003).toFixed(6)),
  status: 'success',
  error_code: null,
  created_at: new Date(Date.now() - i * 3600000 * 8).toISOString(),
}));

const INITIAL_USERS: Profile[] = [
  { id: 'u1', full_name: 'Mẹ Thu Hà', role: 'user', is_locked: false, daily_quota: 5, parental_pin_hash: '1234', created_at: new Date(Date.now() - 25 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'u2', full_name: 'Ba Hải Đăng', role: 'user', is_locked: false, daily_quota: 5, parental_pin_hash: '1234', created_at: new Date(Date.now() - 20 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'u3', full_name: 'Cô Mai Anh', role: 'user', is_locked: true, daily_quota: 3, parental_pin_hash: '0000', created_at: new Date(Date.now() - 15 * 86400000).toISOString(), updated_at: new Date().toISOString() },
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      kpis: {
        storiesToday: 12,
        blockedRatePercent: 4.8,
        pendingQueueCount: 3,
        monthlyCostUsd: 14.85,
        monthlyBudgetUsd: 50.0,
        aiAdminAgreementPercent: 92.4,
      },
      chartData: GENERATED_CHART_DATA,
      safetyRules: INITIAL_SAFETY_RULES,
      systemPrompts: INITIAL_SYSTEM_PROMPTS,
      aiLogs: INITIAL_AI_LOGS,
      moderationReviews: [],
      auditLogs: [
        {
          id: 'aud-1',
          admin_id: 'admin-1',
          action: 'UPDATE_SAFETY_RULE',
          target_type: 'safety_rules',
          target_id: 'r3',
          details: { field: 'action', value: 'block' },
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'aud-2',
          admin_id: 'admin-1',
          action: 'ACTIVATE_PROMPT',
          target_type: 'system_prompts',
          target_id: 'p1',
          details: { version: 2 },
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      usersList: INITIAL_USERS,
      moderationMode: 'auto',
      autoApproveMaxRisk: 25,
      globalDailyLimit: 5,

      toggleSafetyRule: (ruleId: string) => {
        set((state) => ({
          safetyRules: state.safetyRules.map((r) =>
            r.id === ruleId ? { ...r, is_active: !r.is_active } : r
          ),
        }));
        get().logAudit('TOGGLE_RULE', 'safety_rules', ruleId);
      },

      addSafetyRule: (rule) => {
        const newRule: SafetyRule = {
          ...rule,
          id: 'r-' + Date.now(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          safetyRules: [newRule, ...state.safetyRules],
        }));
        get().logAudit('CREATE_RULE', 'safety_rules', newRule.id, { category: rule.category });
      },

      deleteSafetyRule: (ruleId: string) => {
        set((state) => ({
          safetyRules: state.safetyRules.filter((r) => r.id !== ruleId),
        }));
        get().logAudit('DELETE_RULE', 'safety_rules', ruleId);
      },

      updateSafetyRule: (rule: SafetyRule) => {
        set((state) => ({
          safetyRules: state.safetyRules.map((r) => (r.id === rule.id ? rule : r)),
        }));
        get().logAudit('UPDATE_RULE', 'safety_rules', rule.id, { severity: rule.severity, action: rule.action });
      },

      saveSystemPromptVersion: (name: string, promptText: string) => {
        const { systemPrompts } = get();
        const nextVersion = systemPrompts.length + 1;
        const newPrompt: SystemPrompt = {
          id: 'p-' + Date.now(),
          name,
          version: nextVersion,
          prompt_text: promptText,
          is_active: false,
          created_by: 'admin-1',
          created_at: new Date().toISOString(),
        };
        set({ systemPrompts: [newPrompt, ...systemPrompts] });
        get().logAudit('SAVE_PROMPT_VERSION', 'system_prompts', newPrompt.id, { version: nextVersion });
      },

      setActiveSystemPrompt: (promptId: string) => {
        set((state) => ({
          systemPrompts: state.systemPrompts.map((p) => ({
            ...p,
            is_active: p.id === promptId,
          })),
        }));
        get().logAudit('SET_ACTIVE_PROMPT', 'system_prompts', promptId);
      },

      approveStoryModeration: (storyId: string, adminId: string, reason = 'Phê duyệt an toàn') => {
        const review: ModerationReview = {
          id: 'rev-' + Date.now(),
          story_id: storyId,
          admin_id: adminId,
          decision: 'approved',
          reason,
          ai_risk_score_at_review: 20,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          moderationReviews: [review, ...state.moderationReviews],
          kpis: { ...state.kpis, pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - 1) },
        }));
        get().logAudit('APPROVE_STORY', 'stories', storyId, { reason });
      },

      rejectStoryModeration: (storyId: string, adminId: string, reason: string) => {
        const review: ModerationReview = {
          id: 'rev-' + Date.now(),
          story_id: storyId,
          admin_id: adminId,
          decision: 'rejected',
          reason,
          ai_risk_score_at_review: 55,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          moderationReviews: [review, ...state.moderationReviews],
          kpis: { ...state.kpis, pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - 1) },
        }));
        get().logAudit('REJECT_STORY', 'stories', storyId, { reason });
      },

      batchModeration: (storyIds: string[], decision: 'approved' | 'rejected', reason: string) => {
        const newReviews: ModerationReview[] = storyIds.map((id) => ({
          id: 'rev-' + Math.random().toString(36).substring(2, 9),
          story_id: id,
          admin_id: 'admin-1',
          decision,
          reason,
          ai_risk_score_at_review: decision === 'approved' ? 15 : 60,
          created_at: new Date().toISOString(),
        }));
        set((state) => ({
          moderationReviews: [...newReviews, ...state.moderationReviews],
          kpis: {
            ...state.kpis,
            pendingQueueCount: Math.max(0, state.kpis.pendingQueueCount - storyIds.length),
          },
        }));
        get().logAudit('BATCH_MODERATION', 'stories', storyIds.join(','), { count: storyIds.length, decision });
      },

      updateModerationSettings: (mode: 'auto' | 'manual_all', maxRisk: number) => {
        set({
          moderationMode: mode,
          autoApproveMaxRisk: maxRisk,
        });
        get().logAudit('UPDATE_SETTINGS', 'app_settings', 'moderation_mode', { mode, maxRisk });
      },

      updateGlobalDailyLimit: (limit: number) => {
        set({ globalDailyLimit: limit });
        get().logAudit('UPDATE_GLOBAL_LIMIT', 'app_settings', 'daily_story_limit', { limit });
      },

      toggleUserLock: (userId: string) => {
        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === userId ? { ...u, is_locked: !u.is_locked } : u
          ),
        }));
        get().logAudit('TOGGLE_USER_LOCK', 'profiles', userId);
      },

      updateUserQuota: (userId: string, quota: number) => {
        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === userId ? { ...u, daily_quota: quota } : u
          ),
        }));
        get().logAudit('UPDATE_USER_QUOTA', 'profiles', userId, { quota });
      },

      logAudit: (action: string, targetType: string, targetId: string, details = {}) => {
        const audit: AdminAuditLog = {
          id: 'aud-' + Date.now(),
          admin_id: 'admin-1',
          action,
          target_type: targetType,
          target_id: targetId,
          details,
          created_at: new Date().toISOString(),
        };
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


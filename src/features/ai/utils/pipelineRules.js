/**
 * Shared Production Rules for DrawToStory AI Pipeline & Child Name Formatting.
 * Imported directly by both the frontend application and automated verification tests (scripts/test-pipeline.js).
 */

/**
 * Normalize a child's nickname by stripping redundant leading "Bé " prefix.
 * @param {string | null | undefined} nickname
 * @returns {string}
 */
export function stripChildPrefix(nickname) {
  if (!nickname) return '';
  const trimmed = String(nickname).trim().replace(/\s+/g, ' ');
  return trimmed.replace(/^(bé\s+)+/i, '').trim();
}

/**
 * Format child display name with exactly one "Bé " prefix (prevents "Bé Bé Hà").
 * @param {string | null | undefined} nickname
 * @param {string} [fallback='Bé yêu']
 * @returns {string}
 */
export function formatChildName(nickname, fallback = 'Bé yêu') {
  if (!nickname || !String(nickname).trim()) {
    return fallback;
  }
  const trimmed = String(nickname).trim().replace(/\s+/g, ' ');
  const core = stripChildPrefix(trimmed);
  if (!core) {
    return 'Bé';
  }
  return `Bé ${core}`;
}

/**
 * Layer 1 Input Safety & Drawing Eligibility Evaluator.
 * Matches Edge Function `supabase/functions/_shared/safety.ts`.
 *
 * @param {{
 *   is_drawing: boolean;
 *   image_type: string;
 *   confidence?: number;
 *   contains_real_person_face: boolean;
 *   pii_detected: boolean;
 *   risk_categories?: string[];
 * }} inspection
 * @param {Array<{
 *   id?: string;
 *   category: string;
 *   description: string;
 *   severity: number;
 *   action: 'block' | 'flag' | 'rewrite';
 *   is_active: boolean;
 * }>} [activeRules=[]]
 * @param {boolean} [strictDrawingCheck=true]
 */
export function evaluateInputSafety(inspection, activeRules = [], strictDrawingCheck = true) {
  const allowedTypes = strictDrawingCheck
    ? ['child_drawing']
    : ['child_drawing', 'artwork'];

  const isEligibleDrawing = Boolean(inspection?.is_drawing) && allowedTypes.includes(inspection?.image_type);

  if (!isEligibleDrawing) {
    return {
      isSafe: false,
      errorCode: 'NOT_A_DRAWING',
      errorMessage: 'Mình chưa thấy nét vẽ của bé, thử chụp lại tranh trên giấy nhé',
      blockedRules: [],
    };
  }

  if (inspection.contains_real_person_face) {
    return {
      isSafe: false,
      errorCode: 'REAL_FACE_DETECTED',
      errorMessage:
        'Phát hiện khuôn mặt người thật trong ảnh. Để bảo vệ an toàn và quyền riêng tư cho bé, vui lòng chỉ chụp phần giấy vẽ.',
      blockedRules: [],
    };
  }

  if (inspection.pii_detected) {
    return {
      isSafe: false,
      errorCode: 'PII_DETECTED',
      errorMessage:
        'Phát hiện thông tin cá nhân (như số điện thoại, địa chỉ nhà, tên trường học) trên giấy vẽ. Cha mẹ hãy che lại trước khi chụp nhé!',
      blockedRules: [],
    };
  }

  const blockedRules = [];
  const riskCategories = Array.isArray(inspection.risk_categories) ? inspection.risk_categories : [];
  if (riskCategories.length > 0) {
    for (const cat of riskCategories) {
      const matched = (activeRules || []).find(
        (r) =>
          r.is_active &&
          r.action === 'block' &&
          r.category.toLowerCase().includes(String(cat).toLowerCase())
      );
      if (matched) {
        blockedRules.push(matched);
      }
    }
  }

  if (blockedRules.length > 0) {
    return {
      isSafe: false,
      errorCode: 'UNSAFE_INPUT',
      errorMessage: `Bức tranh có chi tiết chưa phù hợp với lứa tuổi thiếu nhi (${blockedRules
        .map((r) => r.category)
        .join(', ')}).`,
      blockedRules,
    };
  }

  return {
    isSafe: true,
    blockedRules: [],
  };
}

/**
 * Layer 3 Final Moderation Status Resolver.
 * Matches Edge Function `supabase/functions/generate-story/index.ts`.
 *
 * @param {{
 *   risk_score: number;
 *   faithfulness_score: number;
 *   recommended_action: 'auto_approved' | 'pending_review' | 'rejected';
 *   pedagogical_feedback?: string;
 * }} judgment
 * @param {{
 *   moderationMode?: 'auto' | 'manual_all';
 *   autoApproveMaxRisk?: number;
 * }} [options]
 */
export function computeModerationDecision(judgment, options = {}) {
  const moderationMode = options.moderationMode || 'auto';
  const autoApproveMaxRisk =
    typeof options.autoApproveMaxRisk === 'number' ? options.autoApproveMaxRisk : 25;

  /** @type {'auto_approved' | 'pending_review' | 'rejected'} */
  let finalStatus = 'auto_approved';

  if (judgment.risk_score > 60 || judgment.recommended_action === 'rejected') {
    finalStatus = 'rejected';
  } else if (
    moderationMode === 'manual_all' ||
    judgment.risk_score > autoApproveMaxRisk ||
    judgment.faithfulness_score < 60 ||
    judgment.recommended_action === 'pending_review'
  ) {
    finalStatus = 'pending_review';
  } else {
    finalStatus = 'auto_approved';
  }

  let rejectionReason = null;
  if (finalStatus === 'rejected') {
    rejectionReason = judgment.pedagogical_feedback || 'Nội dung không vượt qua kiểm định an toàn.';
  } else if (finalStatus === 'pending_review' && judgment.faithfulness_score < 60) {
    rejectionReason = 'LOW_FAITHFULNESS';
  }

  return {
    finalStatus,
    rejectionReason,
  };
}

import { Layer1Inspection } from './schemas.ts';

export interface SafetyRuleRow {
  id: string;
  category: string;
  description: string;
  severity: number;
  action: 'block' | 'flag' | 'rewrite';
  is_active: boolean;
}

export interface InputSafetyCheckResult {
  isSafe: boolean;
  errorCode?: string;
  errorMessage?: string;
  blockedRules: SafetyRuleRow[];
}

export function evaluateInputSafety(
  inspection: Layer1Inspection,
  activeRules: SafetyRuleRow[],
  strictDrawingCheck: boolean = true
): InputSafetyCheckResult {
  // 1. Mandatory Drawing Verification
  const allowedTypes = strictDrawingCheck
    ? ['child_drawing']
    : ['child_drawing', 'artwork'];

  const isEligibleDrawing = inspection.is_drawing && allowedTypes.includes(inspection.image_type);

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
      errorMessage: 'Phát hiện khuôn mặt người thật trong ảnh. Để bảo vệ an toàn và quyền riêng tư cho bé, vui lòng chỉ chụp phần giấy vẽ.',
      blockedRules: [],
    };
  }

  if (inspection.pii_detected) {
    return {
      isSafe: false,
      errorCode: 'PII_DETECTED',
      errorMessage: 'Phát hiện thông tin cá nhân (như số điện thoại, địa chỉ nhà, tên trường học) trên giấy vẽ. Cha mẹ hãy che lại trước khi chụp nhé!',
      blockedRules: [],
    };
  }

  // 2. Check against Active Block Rules
  const blockedRules: SafetyRuleRow[] = [];
  if (inspection.risk_categories && inspection.risk_categories.length > 0) {
    for (const cat of inspection.risk_categories) {
      const matched = activeRules.find(
        (r) => r.is_active && r.action === 'block' && r.category.toLowerCase().includes(cat.toLowerCase())
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
      errorMessage: `Bức tranh có chi tiết chưa phù hợp với lứa tuổi thiếu nhi (${blockedRules.map((r) => r.category).join(', ')}).`,
      blockedRules,
    };
  }

  return {
    isSafe: true,
    blockedRules: [],
  };
}

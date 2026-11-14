import type { DrawingAiAnalysis, SafetyRule } from '@/types/database';

export interface InputSafetyEvaluation {
  isSafe: boolean;
  errorCode?: string;
  errorMessage?: string;
  blockedRules: SafetyRule[];
}

export interface JudgeDecisionInput {
  risk_score: number;
  faithfulness_score: number;
  recommended_action: 'auto_approved' | 'pending_review' | 'rejected';
  pedagogical_feedback?: string;
}

export interface ModerationDecisionOptions {
  moderationMode?: 'auto' | 'manual_all';
  autoApproveMaxRisk?: number;
}

export interface ModerationDecisionOutput {
  finalStatus: 'auto_approved' | 'pending_review' | 'rejected';
  rejectionReason: string | null;
}

export function stripChildPrefix(nickname?: string | null): string;
export function formatChildName(nickname?: string | null, fallback?: string): string;
export function evaluateInputSafety(
  inspection: Pick<
    DrawingAiAnalysis,
    'is_drawing' | 'image_type' | 'contains_real_person_face' | 'pii_detected'
  > & {
    confidence?: number;
    risk_categories?: string[];
  },
  activeRules?: SafetyRule[],
  strictDrawingCheck?: boolean
): InputSafetyEvaluation;
export function computeModerationDecision(
  judgment: JudgeDecisionInput,
  options?: ModerationDecisionOptions
): ModerationDecisionOutput;

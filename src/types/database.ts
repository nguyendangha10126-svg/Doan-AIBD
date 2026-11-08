/**
 * Định nghĩa Type Database Supabase cho DrawToStory
 * Tuyệt đối không dùng 'any'
 */

export type UserRole = 'user' | 'admin';

export type StoryStatus = 
  | 'generating'
  | 'auto_approved'
  | 'pending_review'
  | 'approved'
  | 'parent_approved'
  | 'rejected'
  | 'failed';

export const isStoryApproved = (status?: string | null): boolean => {
  return Boolean(status && ['auto_approved', 'approved', 'parent_approved'].includes(status));
};

export type SafetyAction = 'block' | 'flag' | 'rewrite';

export interface FocusRegion {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  zoom: number; // multiplier e.g. 1.2 to 2.5
}

export interface RiskReason {
  rule_id?: string;
  category: string;
  description: string;
  severity: number;
}

export type ImageType = 
  | 'child_drawing' 
  | 'artwork' 
  | 'logo_graphic' 
  | 'photo' 
  | 'screenshot_text' 
  | 'other';

export type GenerationStage = 
  | 'analyzing' 
  | 'safety' 
  | 'writing' 
  | 'judging' 
  | 'done';

export interface DrawingAiAnalysis {
  is_drawing: boolean;
  image_type: ImageType;
  confidence: number;
  contains_real_person_face: boolean;
  pii_detected: boolean;
  risk_categories: string[];
  objects: string[];
  colors: string[];
  mood: string;
  characters: string[];
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_locked: boolean;
  daily_quota: number;
  parental_pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  nickname: string;
  age: number;
  avatar_color: string;
  avatar_emoji: string;
  created_at: string;
}

export interface Drawing {
  id: string;
  child_id: string;
  image_path: string;
  ai_analysis: DrawingAiAnalysis | null;
  created_at: string;
}

export interface Story {
  id: string;
  child_id: string;
  drawing_id: string;
  title: string;
  summary: string;
  moral: string;
  status: StoryStatus;
  risk_score: number;
  risk_reasons: RiskReason[];
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  share_token: string;
  is_shared: boolean;
  prompt_version_id: string | null;
  model: string;
  next_drawing_ideas: string[];
  generation_stage?: GenerationStage;
  faithfulness_score?: number;
  grounded_objects?: string[];
  created_at: string;
  updated_at: string;
  // joined fields
  pages?: StoryPage[];
  child?: Child;
  drawing?: Drawing;
}

export interface StoryPage {
  id: string;
  story_id: string;
  page_number: number;
  text_content: string;
  emotion: string;
  focus_region: FocusRegion;
  grounded_objects?: string[];
  created_at: string;
}

export interface SafetyRule {
  id: string;
  category: string;
  description: string;
  severity: number;
  action: SafetyAction;
  is_active: boolean;
  created_at: string;
}

export interface SystemPrompt {
  id: string;
  name: string;
  version: number;
  prompt_text: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ModerationReview {
  id: string;
  story_id: string;
  admin_id: string;
  decision: 'approved' | 'rejected';
  reason: string;
  ai_risk_score_at_review: number;
  created_at: string;
}

export interface AiLog {
  id: string;
  user_id: string | null;
  story_id: string | null;
  action: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost_usd: number;
  status: 'success' | 'error';
  error_code: string | null;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
}

export interface UserBadge {
  id: string;
  child_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}

export interface ReadingEvent {
  id: string;
  child_id: string;
  story_id: string;
  listened_seconds: number;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}


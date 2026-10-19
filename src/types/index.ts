export * from './database';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  dailyQuota: number;
}

export interface StoryFilterOptions {
  childId?: string;
  status?: string;
  searchQuery?: string;
}

export interface BedtimeSettings {
  isActive: boolean;
  dimLevel: number; // 0 to 1
  voiceRate: number; // e.g. 0.85
  timerMinutes: number; // 0 = off, 15, 30, 45
}


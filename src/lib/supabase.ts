import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials
const DEFAULT_SUPABASE_URL = 'https://htvslxbytqoteyimtcxg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_0M7XpzEBfVsKECDTkRVpKA_PgCpJiGc';

let rawInputUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (!rawInputUrl || rawInputUrl.includes('your-project.supabase.co') || rawInputUrl.includes('demo-drawtostory')) {
  rawInputUrl = DEFAULT_SUPABASE_URL;
}

const rawUrl = rawInputUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

let rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
if (!rawKey || rawKey.includes('your_anon_key_here')) {
  rawKey = DEFAULT_SUPABASE_ANON_KEY;
}

export const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

export const hasValidSupabaseConfig = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('your-project.supabase.co') &&
  !rawKey.includes('your_anon_key_here')
);

// Backward compatibility: isDemoMode is true when mock is forced OR when real config is missing
export const isDemoMode = isMockEnabled || !hasValidSupabaseConfig;

export const supabaseUrl = hasValidSupabaseConfig ? rawUrl : 'https://dummy-project.supabase.co';
export const supabaseAnonKey = hasValidSupabaseConfig ? rawKey : 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

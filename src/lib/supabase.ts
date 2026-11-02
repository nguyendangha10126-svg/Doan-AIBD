import { createClient } from '@supabase/supabase-js';

const rawInputUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawUrl = rawInputUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

export const hasValidSupabaseConfig = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('your-project.supabase.co') &&
  !rawUrl.includes('demo-drawtostory') &&
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

import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
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

const supabaseUrl = hasValidSupabaseConfig ? rawUrl : 'https://dummy-project.supabase.co';
const supabaseAnonKey = hasValidSupabaseConfig ? rawKey : 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

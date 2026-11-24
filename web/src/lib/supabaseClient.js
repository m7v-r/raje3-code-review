import { createClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './supabaseConfig';

const config = readSupabaseConfig(import.meta.env);
export const supabaseConfigurationError = config.error;
// One actionable message; no environment values are logged.
if (config.error) console.error(config.error);

export const supabase = config.error ? null : createClient(config.url, config.key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

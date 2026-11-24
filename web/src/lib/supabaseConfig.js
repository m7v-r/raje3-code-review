// Do not include environment values in error messages or logs.
export function readSupabaseConfig(env = {}) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const missing = [!url && 'VITE_SUPABASE_URL', !key && 'VITE_SUPABASE_PUBLISHABLE_KEY'].filter(Boolean);
  if (missing.length) return { error: `Raje3: missing ${missing.join(', ')} in web/.env.local.` };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error();
  } catch {
    return { error: 'Raje3: VITE_SUPABASE_URL must be a valid Supabase project URL.' };
  }
  if (!key.startsWith('sb_publishable_')) {
    // Legacy anon JWTs are accepted; secret/service keys are never passed to createClient.
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') throw new Error();
    } catch {
      return { error: 'Raje3: use a publishable or legacy anon key, never a secret/server key.' };
    }
  }
  return { url, key, error: null };
}

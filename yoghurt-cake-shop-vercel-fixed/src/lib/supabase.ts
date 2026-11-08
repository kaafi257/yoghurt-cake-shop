import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read from env or localStorage if configured via UI
export function getStoredCredentials() {
  try {
    const customUrl = localStorage.getItem('ycs_supabase_url');
    const customKey = localStorage.getItem('ycs_supabase_key');
    if (customUrl && customKey) {
      return { url: customUrl.trim(), anon: customKey.trim(), isCustom: true };
    }
  } catch {
    // ignore
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  return { url: envUrl || '', anon: envKey || '', isCustom: false };
}

const creds = getStoredCredentials();
export const supabaseConfigured = Boolean(creds.url && creds.anon);

export let supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(creds.url, creds.anon)
  : null;

export function updateSupabaseConfig(url: string, key: string): boolean {
  if (!url.trim() || !key.trim()) {
    try {
      localStorage.removeItem('ycs_supabase_url');
      localStorage.removeItem('ycs_supabase_key');
    } catch {}
    supabase = null;
    return false;
  }

  try {
    localStorage.setItem('ycs_supabase_url', url.trim());
    localStorage.setItem('ycs_supabase_key', key.trim());
    supabase = createClient(url.trim(), key.trim());
    return true;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return false;
  }
}

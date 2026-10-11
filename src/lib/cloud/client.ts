import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
export type CloudConfiguration = { status: 'unconfigured' } | { status: 'invalid'; code: string } | { status: 'configured'; url: string; key: string; projectRef: string };
export function readCloudConfiguration(env: Record<string, unknown> = import.meta.env ?? {}): CloudConfiguration {
  const url = String(env.VITE_SUPABASE_URL ?? '').trim();
  const key = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (!url && !key) return { status: 'unconfigured' };
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return { status: 'invalid', code: 'invalidPublicKey' };
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '') || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) throw new Error();
    return { status: 'configured', url: parsed.origin, key, projectRef: parsed.origin };
  } catch { return { status: 'invalid', code: 'invalidCloudUrl' }; }
}
let singleton: SupabaseClient | null = null;
export function getCloudClient(config: CloudConfiguration): SupabaseClient | null {
  if (config.status !== 'configured') return null;
  singleton ??= createClient(config.url, config.key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return singleton;
}

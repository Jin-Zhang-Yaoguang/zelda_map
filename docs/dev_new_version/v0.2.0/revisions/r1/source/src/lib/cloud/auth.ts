import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { AccountIdentity } from '../sync/types';
import { failure, normalizeError } from './errors';
export interface AccountAuth {
  start(listener: (identity: AccountIdentity | null, event: string) => void): Promise<AccountIdentity | null>;
  stop(): void; sendEmailOtp(email: string): Promise<void>; verifyEmailOtp(email: string, token: string): Promise<AccountIdentity>;
  signInGithub(): Promise<void>; signOut(): Promise<void>;
}
export function identityFromSession(session: Session | null): AccountIdentity | null {
  if (!session) return null;
  const user = session.user;
  const name = user.user_metadata?.user_name ?? user.user_metadata?.preferred_username ?? user.user_metadata?.full_name;
  return { uid: user.id, email: user.email ?? null, provider: typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : null, displayName: typeof name === 'string' ? name : null };
}
export function controlledHash(hash: string): string { return /^#\/(?:settings|shrine\/Dungeon(?:0\d{2}|1[0-2]\d|13[0-5]))?$/.test(hash) ? hash : '#/settings'; }
export function applicationRoot(baseUrl = import.meta.env?.BASE_URL ?? '/', origin = location.origin): string { return new URL(baseUrl, origin).href; }
const RETURN_KEY = 'zelda-map:oauth:return-hash';
let callbackPromise: Promise<void> | null = null;
export function createAccountAuth(client: SupabaseClient): AccountAuth {
  let unsubscribe: (() => void) | null = null;
  let active = false;
  let oauthBusy = false;
  async function callback(): Promise<void> {
    const url = new URL(location.href); const code = url.searchParams.get('code'); const authError = url.searchParams.get('error');
    if (!code && !authError) return;
    let hash = '#/settings';
    try {
      hash = controlledHash(sessionStorage.getItem(RETURN_KEY) ?? '');
      if (authError) throw failure('auth', 'oauthFailed');
      const { error } = await client.auth.exchangeCodeForSession(code!); if (error) throw error;
    } finally {
      for (const key of ['code','error','error_code','error_description']) url.searchParams.delete(key);
      url.hash = hash; history.replaceState(null, '', url.href);
      try { sessionStorage.removeItem(RETURN_KEY); } catch { /* 清URL仍完成；认证存储错误由调用者处理。 */ }
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }
  return {
    async start(listener) {
      active = true; unsubscribe?.();
      const { data } = client.auth.onAuthStateChange((event, session) => { const identity = identityFromSession(session); setTimeout(() => { if (active) listener(identity, event); }, 0); });
      unsubscribe = () => data.subscription.unsubscribe();
      try {
        const pending = callbackPromise ??= callback(); try { await pending; } finally { if (callbackPromise === pending) callbackPromise = Promise.resolve(); }
        const { data: restored, error } = await client.auth.getSession(); if (error) throw error;
        return identityFromSession(restored.session);
      } catch (e) { throw normalizeError(e, 'auth'); }
    },
    stop() { active = false; unsubscribe?.(); unsubscribe = null; },
    async sendEmailOtp(email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw failure('auth', 'invalidEmail');
      try { const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }); if (error) throw error; } catch (e) { throw normalizeError(e, 'auth'); }
    },
    async verifyEmailOtp(email, token) {
      if (!email.trim() || !token.trim()) throw failure('auth', 'invalidOtp');
      try { const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' }); if (error) throw error; const id = identityFromSession(data.session); if (!id) throw failure('auth','authFailed'); return id; } catch (e) { throw normalizeError(e, 'auth'); }
    },
    async signInGithub() {
      if (oauthBusy) throw failure('auth', 'authBusy'); oauthBusy = true;
      try {
        sessionStorage.setItem(RETURN_KEY, controlledHash(location.hash));
        if (sessionStorage.getItem(RETURN_KEY) !== controlledHash(location.hash)) throw failure('auth','storageUnavailable');
        const { error } = await client.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: applicationRoot() } }); if (error) throw error;
      } catch (e) { oauthBusy = false; throw normalizeError(e, 'auth'); }
    },
    async signOut() { try { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) throw error; } catch (e) { throw normalizeError(e, 'auth'); } },
  };
}

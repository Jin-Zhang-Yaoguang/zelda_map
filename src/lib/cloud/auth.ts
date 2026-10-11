import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { AccountIdentity } from '../sync/types';
import { failure, normalizeError } from './errors';
export interface AccountAuth {
  start(listener: (identity: AccountIdentity | null, event: string) => void): Promise<AccountIdentity | null>;
  stop(): void;
  signUpEmailPassword(email: string, password: string): Promise<AccountIdentity>;
  signInEmailPassword(email: string, password: string): Promise<AccountIdentity>;
  signOut(): Promise<void>;
}
export function identityFromSession(session: Session | null): AccountIdentity | null {
  if (!session || typeof session.user?.id !== 'string' || !session.user.id.trim() || typeof session.access_token !== 'string' || !session.access_token.trim()) return null;
  const user = session.user;
  const name = user.user_metadata?.user_name ?? user.user_metadata?.preferred_username ?? user.user_metadata?.full_name;
  return { uid: user.id, email: user.email ?? null, provider: typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : null, displayName: typeof name === 'string' ? name : null };
}
function validatedEmail(email: string): string {
  const value = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw failure('auth', 'invalidEmail');
  return value;
}
export function createAccountAuth(client: SupabaseClient): AccountAuth {
  let unsubscribe: (() => void) | null = null;
  let active = false;
  return {
    async start(listener) {
      active = true; unsubscribe?.();
      const { data } = client.auth.onAuthStateChange((event, session) => { const identity = identityFromSession(session); setTimeout(() => { if (active) listener(identity, event); }, 0); });
      unsubscribe = () => data.subscription.unsubscribe();
      try {
        const { data: restored, error } = await client.auth.getSession(); if (error) throw error;
        return identityFromSession(restored.session);
      } catch (e) { throw normalizeError(e, 'auth'); }
    },
    stop() { active = false; unsubscribe?.(); unsubscribe = null; },
    async signUpEmailPassword(email, password) {
      const value = validatedEmail(email);
      // 本机注册建议最低8字符；后台规则由Supabase继续校验，不改写密码。
      if (password.length < 8) throw failure('auth', 'weakPassword');
      try {
        const { data, error } = await client.auth.signUp({ email: value, password }); if (error) throw error;
        const identity = identityFromSession(data.session); if (!identity) throw failure('auth', 'sessionNotEstablished');
        return identity;
      } catch (e) { throw normalizeError(e, 'auth'); }
    },
    async signInEmailPassword(email, password) {
      const value = validatedEmail(email);
      if (!password.length) throw failure('auth', 'passwordRequired');
      try {
        const { data, error } = await client.auth.signInWithPassword({ email: value, password }); if (error) throw error;
        const identity = identityFromSession(data.session); if (!identity) throw failure('auth', 'sessionNotEstablished');
        return identity;
      } catch (e) { throw normalizeError(e, 'auth'); }
    },
    async signOut() { try { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) throw error; } catch (e) { throw normalizeError(e, 'auth'); } },
  };
}

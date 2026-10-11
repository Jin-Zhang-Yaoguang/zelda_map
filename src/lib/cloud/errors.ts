import type { AccountError } from '../sync/types';
export class AccountFailure extends Error {
  constructor(public readonly detail: AccountError) { super(detail.code); this.name = 'AccountFailure'; }
}
export function failure(operation: AccountError['operation'], code: string, retryable = false): AccountFailure { return new AccountFailure({ operation, code, retryable }); }
export function normalizeError(error: unknown, operation: AccountError['operation']): AccountFailure {
  if (error instanceof AccountFailure) return error;
  const e = error as { status?: number; code?: string; name?: string; message?: string } | null;
  // 认证凭据错误先按明确code分类，不能把guest误判为会话过期。
  if (operation === 'auth') {
    const authCodes: Record<string, string> = {
      invalid_credentials: 'invalidCredentials', email_not_confirmed: 'emailConfirmationRequired',
      weak_password: 'weakPassword', user_already_exists: 'accountExists', email_exists: 'accountExists',
      validation_failed: 'authValidationFailed',
    };
    if (e?.code && Object.hasOwn(authCodes, e.code)) return failure(operation, authCodes[e.code]);
  }
  if (e?.code === 'PGRST301' || e?.code === 'refresh_token_not_found' || e?.code === 'refresh_token_already_used' || e?.code === 'session_not_found' || e?.code === 'session_expired' || e?.name === 'AuthSessionMissingError' || ((operation === 'sync' || operation === 'transfer') && e?.status === 401)) return failure(operation, 'sessionExpired');
  if (e?.status === 429 || e?.code === 'over_request_rate_limit' || e?.code === 'over_email_send_rate_limit') return failure(operation, 'rateLimited', true);
  if (e?.status === 403 || e?.code === '42501') return failure(operation, 'permissionDenied');
  if (operation === 'auth' && e?.status === 401) return failure(operation, 'authFailed');
  if (operation === 'storage') return failure(operation, e?.name === 'DataError' ? 'corruptCache' : 'storageUnavailable', true);
  if (e?.status === 0 || e?.message?.includes('Failed to fetch') || e?.message?.includes('fetch failed') || e?.name === 'TypeError' || e?.name === 'AbortError' || (e?.status && e.status >= 500)) return failure(operation, 'networkFailure', true);
  return failure(operation, operation === 'auth' ? 'authFailed' : 'requestFailed');
}

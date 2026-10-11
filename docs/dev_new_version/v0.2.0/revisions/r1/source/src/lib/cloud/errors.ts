import type { AccountError } from '../sync/types';
export class AccountFailure extends Error {
  constructor(public readonly detail: AccountError) { super(detail.code); this.name = 'AccountFailure'; }
}
export function failure(operation: AccountError['operation'], code: string, retryable = false): AccountFailure { return new AccountFailure({ operation, code, retryable }); }
export function normalizeError(error: unknown, operation: AccountError['operation']): AccountFailure {
  if (error instanceof AccountFailure) return error;
  const e = error as { status?: number; code?: string; name?: string; message?: string } | null;
  // Auth验证码语义优先于通用401/403；同步请求仍使用会话/权限分类。
  if (operation === 'auth' && (e?.code === 'otp_expired' || e?.code === 'otp_disabled' || e?.code === 'validation_failed')) return failure(operation, 'invalidOtp');
  if (e?.status === 401 || e?.code === 'PGRST301' || e?.code === 'refresh_token_not_found' || e?.code === 'refresh_token_already_used') return failure(operation, 'sessionExpired');
  if (e?.status === 429 || e?.code === 'over_request_rate_limit' || e?.code === 'over_email_send_rate_limit') return failure(operation, 'rateLimited', true);
  if (e?.status === 403 || e?.code === '42501') return failure(operation, 'permissionDenied');
  if (operation === 'storage') return failure(operation, e?.name === 'DataError' ? 'corruptCache' : 'storageUnavailable', true);
  if (e?.status === 0 || e?.message?.includes('Failed to fetch') || e?.message?.includes('fetch failed') || e?.name === 'TypeError' || e?.name === 'AbortError' || (e?.status && e.status >= 500)) return failure(operation, 'networkFailure', true);
  return failure(operation, operation === 'auth' ? 'authFailed' : 'requestFailed');
}

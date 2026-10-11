import assert from 'node:assert/strict';
import { build } from 'esbuild';
const output = '/private/tmp/zelda-r2-auth-errors.mjs';
await build({ entryPoints: ['src/lib/cloud/errors.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm' });
const { normalizeError, failure } = await import(output + '?' + Date.now());
const authCases = [
  [{ code: 'invalid_credentials', status: 401 }, 'invalidCredentials', false],
  [{ code: 'invalid_credentials', status: 403 }, 'invalidCredentials', false],
  [{ code: 'email_not_confirmed', status: 400 }, 'emailConfirmationRequired', false],
  [{ code: 'weak_password', status: 422 }, 'weakPassword', false],
  [{ code: 'user_already_exists', status: 422 }, 'accountExists', false],
  [{ code: 'email_exists', status: 400 }, 'accountExists', false],
  [{ code: 'validation_failed', status: 400 }, 'authValidationFailed', false],
  [{ status: 401 }, 'authFailed', false], [{ status: 403 }, 'permissionDenied', false],
  [{ status: 429 }, 'rateLimited', true], [{ code: 'over_request_rate_limit' }, 'rateLimited', true],
  [{ status: 503 }, 'networkFailure', true], [{ status: 0 }, 'networkFailure', true],
  [new TypeError('Failed to fetch'), 'networkFailure', true], [new DOMException('aborted', 'AbortError'), 'networkFailure', true],
  [{ code: 'unexpected', message: '不得回显服务端错误' }, 'authFailed', false],
  [{ code: '__proto__' }, 'authFailed', false],
  [{ name: 'AuthSessionMissingError', status: 400 }, 'sessionExpired', false],
];
for (const [error, code, retryable] of authCases) assert.deepEqual(normalizeError(error, 'auth').detail, { operation: 'auth', code, retryable });
for (const code of ['PGRST301', 'refresh_token_not_found', 'refresh_token_already_used', 'session_not_found', 'session_expired']) assert.equal(normalizeError({ code, status: 400 }, 'auth').detail.code, 'sessionExpired');
for (const operation of ['sync', 'transfer']) {
  assert.equal(normalizeError({ status: 401 }, operation).detail.code, 'sessionExpired');
  assert.equal(normalizeError({ code: 'PGRST301' }, operation).detail.code, 'sessionExpired');
  assert.equal(normalizeError({ code: '42501' }, operation).detail.code, 'permissionDenied');
  assert.equal(normalizeError({ status: 429 }, operation).detail.retryable, true);
  assert.equal(normalizeError({ status: 503 }, operation).detail.code, 'networkFailure');
}
const explicit = failure('auth', 'sessionNotEstablished'); assert.equal(normalizeError(explicit, 'auth'), explicit);
console.log('r2错误映射矩阵通过：code优先、凭据不expired、明确会话/sync401过期、限流/网络/权限及安全文案。');

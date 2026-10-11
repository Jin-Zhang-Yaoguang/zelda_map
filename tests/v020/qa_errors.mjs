import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// 只测试实际源码或既有构建产物；全部输入为合成错误，没有真实认证或请求。
const root = fileURLToPath(new URL('../../', import.meta.url));
const phase = process.argv[2] ?? 'after';
assert(['before', 'after'].includes(phase), '使用 before 或 after');
const dir = path.join(root, 'docs/dev_new_version/v0.2.0/evidence');
await fs.mkdir(dir, { recursive: true });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const inputPath = phase === 'before'
  ? path.join(root, '.runtime/qa-v020/engine.mjs')
  : path.join(root, 'src/lib/cloud/errors.ts');
const original = await fs.readFile(inputPath, 'utf8');
let compiled;
if (phase === 'before') {
  assert(original.includes('function normalizeError(error, operation)'), '既有产物没有 normalizeError');
  // 仅追加出口，不重建旧逻辑；完整产物哈希留在结果中。
  compiled = original + '\nexport { normalizeError, AccountFailure, failure };\n';
} else {
  const result = await build({
    stdin: { contents: original, sourcefile: inputPath, resolveDir: path.dirname(inputPath), loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', target: 'node22', write: false,
  });
  compiled = result.outputFiles[0].text;
  await fs.writeFile(path.join(dir, 'error-normalization-after-source.ts'), original);
}
const modulePath = path.join(dir, `error-normalization-${phase}-bundle.mjs`);
await fs.writeFile(modulePath, compiled);
const { normalizeError, AccountFailure } = await import(pathToFileURL(modulePath).href + '?source=' + hash(original));
const evidence = {
  phase,
  layer: '本地错误映射；全部输入为合成对象，无真实 Supabase、JWT、邮件、OAuth 或 HTTP 请求',
  startedAt: new Date().toISOString(),
  provenance: phase === 'before' ? '修前既有真实构建产物，仅追加导出' : '当前实际 errors.ts 经 esbuild 编译',
  sourcePath: path.relative(root, inputPath),
  sourceHash: hash(original),
  compiledHash: hash(compiled),
  originalTsSourceHash: phase === 'before' ? null : hash(original),
  checks: [],
};
const cases = [
  ['auth-403-otp-expired', 'auth', { status: 403, code: 'otp_expired' }, 'invalidOtp', false],
  ['auth-403-validation-failed', 'auth', { status: 403, code: 'validation_failed' }, 'invalidOtp', false],
  ['auth-403-otp-disabled', 'auth', { status: 403, code: 'otp_disabled' }, 'invalidOtp', false],
  ['auth-otp-expired-no-status', 'auth', { code: 'otp_expired' }, 'invalidOtp', false],
  ['auth-validation-422', 'auth', { status: 422, code: 'validation_failed' }, 'invalidOtp', false],
  ['auth-network-503', 'auth', { status: 503, message: 'Synthetic service unavailable' }, 'networkFailure', true],
  ['auth-network-typeerror', 'auth', new TypeError('Synthetic connection failure'), 'networkFailure', true],
  ['auth-network-status0', 'auth', { status: 0 }, 'networkFailure', true],
  ['auth-network-fetch-message', 'auth', { message: 'Failed to fetch' }, 'networkFailure', true],
  ['auth-429', 'auth', { status: 429 }, 'rateLimited', true],
  ['auth-over-request-rate-limit', 'auth', { code: 'over_request_rate_limit' }, 'rateLimited', true],
  ['auth-over-email-send-rate-limit', 'auth', { code: 'over_email_send_rate_limit' }, 'rateLimited', true],
  ['sync-403-42501', 'sync', { status: 403, code: '42501' }, 'permissionDenied', false],
  ['sync-403-no-code', 'sync', { status: 403 }, 'permissionDenied', false],
  ['sync-42501-no-status', 'sync', { code: '42501' }, 'permissionDenied', false],
  ['sync-403-with-auth-code', 'sync', { status: 403, code: 'otp_expired' }, 'permissionDenied', false],
  ['transfer-403', 'transfer', { status: 403 }, 'permissionDenied', false],
  ['sync-401', 'sync', { status: 401 }, 'sessionExpired', false],
  ['auth-401', 'auth', { status: 401 }, 'sessionExpired', false],
  ['sync-PGRST301', 'sync', { code: 'PGRST301' }, 'sessionExpired', false],
  ['auth-refresh-token-not-found', 'auth', { code: 'refresh_token_not_found' }, 'sessionExpired', false],
  ['auth-refresh-token-already-used', 'auth', { code: 'refresh_token_already_used' }, 'sessionExpired', false],
  ['auth-generic', 'auth', { status: 400, code: 'synthetic_unknown' }, 'authFailed', false],
  ['sync-generic', 'sync', { status: 400, code: 'synthetic_unknown' }, 'requestFailed', false],
  ['storage-corrupt', 'storage', { name: 'DataError' }, 'corruptCache', true],
  ['storage-unavailable', 'storage', { name: 'QuotaExceededError' }, 'storageUnavailable', true],
];
for (const [id, operation, input, code, retryable] of cases) {
  const expected = { operation, code, retryable };
  const failure = normalizeError(input, operation);
  const actual = failure.detail;
  let error;
  try { assert(failure instanceof AccountFailure); assert.deepEqual(actual, expected); }
  catch (e) { error = e.message; }
  evidence.checks.push({ id, operation, input: { ...input, ...(input instanceof Error ? { name: input.name, message: input.message } : {}) }, expected, actual, status: error ? 'fail' : 'pass', ...(error ? { error } : {}) });
  console.log(error ? 'FAIL' : 'PASS', id, JSON.stringify(actual));
}
const preserved = new AccountFailure({ operation: 'storage', code: 'syntheticSpecific', retryable: true });
const result = normalizeError(preserved, 'auth');
evidence.checks.push({
  id: 'existing-AccountFailure-preserved',
  expected: { sameInstance: true, detail: preserved.detail },
  actual: { sameInstance: result === preserved, detail: result.detail },
  status: result === preserved ? 'pass' : 'fail',
});
evidence.passed = evidence.checks.filter(c => c.status === 'pass').length;
evidence.failed = evidence.checks.filter(c => c.status === 'fail').length;
evidence.status = evidence.failed ? 'fail' : 'pass';
evidence.completedAt = new Date().toISOString();
await fs.writeFile(path.join(dir, `error-normalization-${phase}.json`), JSON.stringify(evidence, null, 2) + '\n');
console.log(`${phase}: ${evidence.passed} 通过 / ${evidence.failed} 失败；sourceHash ${evidence.sourceHash}`);
if (evidence.failed) process.exitCode = 1;

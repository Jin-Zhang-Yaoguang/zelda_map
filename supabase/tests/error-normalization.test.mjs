import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output='/private/tmp/zelda-error-normalization-test.mjs';
await build({entryPoints:['src/lib/cloud/errors.ts'],outfile:output,bundle:true,platform:'node',format:'esm'});
const {normalizeError}=await import(output+'?'+Date.now());
for(const status of [400,401,403]){
  assert.equal(normalizeError({status,code:'otp_expired'},'auth').detail.code,'invalidOtp');
}
assert.equal(normalizeError({status:403,code:'validation_failed'},'auth').detail.code,'invalidOtp');
assert.equal(normalizeError({status:403,code:'otp_expired'},'sync').detail.code,'permissionDenied');
assert.equal(normalizeError({status:403},'auth').detail.code,'permissionDenied');
assert.equal(normalizeError({code:'42501'},'sync').detail.code,'permissionDenied');
assert.equal(normalizeError({status:401},'sync').detail.code,'sessionExpired');
assert.equal(normalizeError({status:401,code:'refresh_token_not_found'},'auth').detail.code,'sessionExpired');
for(const operation of ['auth','sync']){
  assert.equal(normalizeError({status:429},operation).detail.code,'rateLimited');
  assert.equal(normalizeError({status:429},operation).detail.retryable,true);
  assert.equal(normalizeError({status:503},operation).detail.code,'networkFailure');
  assert.equal(normalizeError({status:503},operation).detail.retryable,true);
  assert.equal(normalizeError(new TypeError('synthetic fetch failure'),operation).detail.code,'networkFailure');
}
console.log('A03定向自测：Auth 403/401+otp_expired→invalidOtp；sync 403/42501、401及503/429分类保持。受控错误对象，非实云。');

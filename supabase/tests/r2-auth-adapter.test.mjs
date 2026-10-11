import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';
const output = '/private/tmp/zelda-r2-auth-adapter.mjs';
await build({ entryPoints: ['src/lib/cloud/auth.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm', define: { 'import.meta.env': '{"BASE_URL":"/zelda_map/"}' } });
const { createAccountAuth, identityFromSession, controlledHash } = await import(output + '?' + Date.now());
const storage = new Map([['zelda-map:oauth:return-hash', '#/shrine/Dungeon135']]);
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.location = { href: 'https://example.test/zelda_map/?code=synthetic&keep=1#/', origin: 'https://example.test', hash: '#/' };
globalThis.history = { replaceState: (_a, _b, url) => { const u = new URL(url); Object.assign(location, { href: u.href, hash: u.hash }); } };
globalThis.window = { dispatchEvent() {} };
globalThis.HashChangeEvent = class {};
const uid = randomUUID();
const session = { access_token: 'synthetic-token', user: { id: uid, email: 'account@example.test', app_metadata: { provider: 'email' }, user_metadata: {} } };
let result = { data: { session, user: session.user }, error: null }, signupCalls = 0, signinCalls = 0, exchanges = 0, callback, locked = false, outsideLock = false, github, signout;
// 合成密码仅存在内存；断言只输出布尔结果，不把凭据写入失败日志。
const password = ' ' + randomUUID() + ' ';
const client = { auth: {
  onAuthStateChange: fn => { callback = fn; return { data: { subscription: { unsubscribe() {} } } }; },
  exchangeCodeForSession: async () => { exchanges++; return { error: null }; },
  getSession: async () => ({ data: { session }, error: null }),
  signUp: async args => { signupCalls++; assert(args.email === 'account@example.test'); assert(args.password === password); assert(Object.keys(args).join(',') === 'email,password'); return result; },
  signInWithPassword: async args => { signinCalls++; assert(args.email === 'account@example.test'); assert(args.password === password || args.password === 'x' || args.password === ' '); return result; },
  signInWithOAuth: async args => { github = args; return { error: null }; },
  signOut: async args => { signout = args; return { error: null }; },
} };
const auth = createAccountAuth(client);
assert.equal((await auth.start(() => { outsideLock = !locked; })).uid, uid);
assert.equal(exchanges, 1); assert.equal(location.hash, '#/shrine/Dungeon135'); assert(!location.href.includes('code=')); assert(location.href.includes('keep=1'));
auth.stop(); await auth.start(() => { outsideLock = !locked; }); assert.equal(exchanges, 1);
locked = true; callback('TOKEN_REFRESHED', session); locked = false; await new Promise(resolve => setTimeout(resolve, 10)); assert(outsideLock);
assert.equal((await auth.signUpEmailPassword(' account@example.test ', password)).uid, uid);
assert.equal((await auth.signInEmailPassword(' account@example.test ', password)).uid, uid);
assert.equal((await auth.signInEmailPassword('account@example.test', 'x')).uid, uid);
assert.equal((await auth.signInEmailPassword('account@example.test', ' ')).uid, uid);
const count = signupCalls + signinCalls;
for (const action of [() => auth.signUpEmailPassword('bad', password), () => auth.signInEmailPassword('bad', password), () => auth.signUpEmailPassword('account@example.test', 'short'), () => auth.signInEmailPassword('account@example.test', '')]) await assert.rejects(action, error => ['invalidEmail', 'weakPassword', 'passwordRequired'].includes(error.detail.code));
assert.equal(signupCalls + signinCalls, count);
for (const bad of [null, { user: session.user }, { access_token: '', user: session.user }, { access_token: ' ', user: session.user }, { access_token: 'synthetic', user: {} }, { access_token: 'synthetic', user: { id: ' ' } }]) {
  assert.equal(identityFromSession(bad), null);
  result = { data: { session: bad, user: session.user }, error: null };
  for (const action of [() => auth.signUpEmailPassword('account@example.test', password), () => auth.signInEmailPassword('account@example.test', password)]) await assert.rejects(action, error => error.detail.code === 'sessionNotEstablished');
}
for (const [code, expected] of [['invalid_credentials', 'invalidCredentials'], ['email_not_confirmed', 'emailConfirmationRequired'], ['weak_password', 'weakPassword'], ['user_already_exists', 'accountExists'], ['email_exists', 'accountExists']]) {
  result = { data: { session, user: session.user }, error: { code, status: 401, message: '不得回显服务端错误' } };
  await assert.rejects(() => auth.signInEmailPassword('account@example.test', password), error => error.detail.code === expected && error.message === expected);
}
// SDK成功session附带weakPassword警告不是error，不误拒已有密码登录。
result = { data: { session, user: session.user, weakPassword: { reasons: ['length'], message: 'synthetic' } }, error: null };
assert.equal((await auth.signInEmailPassword('account@example.test', password)).uid, uid);
assert(!JSON.stringify([...storage]).includes(password));
await auth.signInGithub(); assert.equal(github.provider, 'github'); assert.equal(github.options.redirectTo, 'https://example.test/zelda_map/');
await auth.signOut(); assert.deepEqual(signout, { scope: 'local' });
assert.equal(controlledHash('https://invalid.test'), '#/settings'); assert.equal(controlledHash('#/shrine/Tower01'), '#/settings');
assert.equal('sendEmailOtp' in auth, false); assert.equal('verifyEmailOtp' in auth, false); auth.stop();
console.log('r2受控Auth适配器通过：原样密码、校验零请求、有效session、无session、明确code、PKCE/Pages、OAuth/local退出；非真实Auth。');

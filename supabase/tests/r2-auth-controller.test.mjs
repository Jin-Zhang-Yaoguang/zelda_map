import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { IDBFactory } from 'fake-indexeddb';
import { build } from 'esbuild';
const output = '/private/tmp/zelda-r2-auth-controller.mjs';
await build({ entryPoints: ['src/lib/sync/controller.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm' });
const { createAccountProgressController } = await import(output + '?' + Date.now());
const storageOutput = '/private/tmp/zelda-r2-auth-storage.mjs';
await build({ entryPoints: ['src/lib/sync/storage.ts'], outfile: storageOutput, bundle: true, platform: 'node', format: 'esm' });
const { createAccountStorage } = await import(storageOutput + '?' + Date.now());
const knownIds = new Set(Array.from({ length: 136 }, (_, i) => `Dungeon${String(i).padStart(3, '0')}`));
const config = { status: 'configured', url: 'https://synthetic.supabase.co', key: 'sb_publishable_synthetic', projectRef: 'r2-' + randomUUID() };
const A = randomUUID(), B = randomUUID(), password = ' ' + randomUUID() + ' ';
const identity = uid => ({ uid, email: 'account@example.test', provider: 'email', displayName: null });
const error = code => ({ code, status: 401, message: '不得回显内部错误' });
const wait = async check => { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 5)); } throw new Error('受控测试等待超时'); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const guestRaw = JSON.stringify({ schemaVersion: 1, game: 'botw', completedIds: ['Dungeon135'] });
const guest = new Map([['zelda-map:progress:v1', guestRaw]]);
globalThis.localStorage = { getItem: key => guest.get(key) ?? null, setItem: (key, value) => guest.set(key, value) };
function fixture() {
  const rawStorage = createAccountStorage(config.projectRef + randomUUID(), 'r2-synthetic', knownIds, new IDBFactory());
  const writes = []; let listener, signin = async () => identity(A), signup = async () => identity(A), signout = async () => {}, get = async () => [], online = false, reads = 0, applies = 0;
  const storage = { load: uid => rawStorage.load(uid), update: async (uid, change) => { const result = await rawStorage.update(uid, change); writes.push(JSON.stringify(result)); return result; } };
  const auth = {
    start: async fn => { listener = fn; return null; }, stop() {},
    signInEmailPassword: async (email, value) => { assert(email === 'account@example.test'); assert(value === password); return signin(); },
    signUpEmailPassword: async (email, value) => { assert(email === 'account@example.test'); assert(value === password); return signup(); },
    signInGithub: async () => {}, signOut: async () => { await signout(); listener?.(null, 'SIGNED_OUT'); },
  };
  const repository = { get: async (_signal, uid) => { reads++; return get(uid); }, apply: async () => { applies++; throw new Error('此用例不应写云'); } };
  const c = createAccountProgressController({ knownIds, dataVersion: 'r2-synthetic' }, { config, auth, storage, repository, online: () => online, uuid: randomUUID });
  return { c, rawStorage, writes, emit: (uid, event = 'SIGNED_IN') => listener(uid ? identity(uid) : null, event), setSignin: fn => signin = fn, setSignup: fn => signup = fn, setSignout: fn => signout = fn, setGet: fn => get = fn, setOnline: value => online = value, readCount: () => reads, applyCount: () => applies };
}
const fixtures = [];
try {
  const f = fixture(); fixtures.push(f); await f.c.start(); assert.equal(f.c.getSnapshot().authPhase, 'guest');
  for (const code of ['invalid_credentials', 'email_not_confirmed', 'session_not_found']) {
    f.setSignin(async () => { throw error(code); }); await assert.rejects(() => f.c.signInEmailPassword('account@example.test', password));
    assert.equal(f.c.getSnapshot().authPhase, 'guest'); assert.equal(f.c.getSnapshot().identity, null);
  }
  f.setSignup(async () => { const e = new Error('sessionNotEstablished'); e.code = 'unexpected'; throw e; });
  await assert.rejects(() => f.c.signUpEmailPassword('account@example.test', password)); assert.equal(f.readCount(), 0); assert.equal(f.applyCount(), 0);
  const initialRead = deferred(); f.setGet(() => initialRead.promise); f.setSignup(async () => identity(A));
  const registering = f.c.signUpEmailPassword('account@example.test', password); await wait(() => f.c.getSnapshot().identity?.uid === A);
  assert.equal(f.c.getSnapshot().ready, false); await assert.rejects(() => f.c.setComplete('Dungeon000', true));
  await assert.rejects(() => f.c.signInEmailPassword('account@example.test', password), e => e.detail.code === 'authBusy');
  initialRead.resolve([]); await registering; assert.equal(f.c.getSnapshot().ready, true);
  assert.deepEqual(f.c.getSnapshot().completedIds, []); assert.equal(f.applyCount(), 0);
  f.setGet(async () => []); await f.c.setComplete('Dungeon000', true); const before = await f.rawStorage.load(A); assert.equal(before.jobs.length, 1);
  f.emit(null, 'SIGNED_OUT'); assert.equal(f.c.getSnapshot().authPhase, 'expired'); assert.equal(f.c.getSnapshot().identity.uid, A);
  f.setSignin(async () => { throw error('invalid_credentials'); }); await assert.rejects(() => f.c.signInEmailPassword('account@example.test', password));
  assert.equal(f.c.getSnapshot().authPhase, 'expired'); assert.equal(f.c.getSnapshot().identity.uid, A); assert.equal(f.c.getSnapshot().ready, false);
  assert.equal((await f.rawStorage.load(A)).jobs[0].requestId, before.jobs[0].requestId);
  f.setSignin(async () => identity(B)); await f.c.signInEmailPassword('account@example.test', password);
  assert.equal(f.c.getSnapshot().identity.uid, B); assert.deepEqual(f.c.getSnapshot().completedIds, []); assert.equal((await f.rawStorage.load(A)).jobs.length, 1);
  f.setSignout(async () => { throw new TypeError('Failed to fetch'); }); await assert.rejects(() => f.c.signOut()); assert.equal(f.c.getSnapshot().identity.uid, B);
  f.setSignout(async () => {}); await f.c.signOut(); assert.equal(f.c.getSnapshot().authPhase, 'guest'); assert.equal(f.c.getSnapshot().identity, null);
  assert.equal(guest.get('zelda-map:progress:v1'), guestRaw); assert.equal(f.applyCount(), 0);
  assert(!JSON.stringify(f.c.getSnapshot()).includes(password)); assert(f.writes.every(value => !value.includes(password)));

  const stale = fixture(); fixtures.push(stale); await stale.c.start(); const late = deferred(); stale.setSignin(() => late.promise);
  const lateLogin = stale.c.signInEmailPassword('account@example.test', password); stale.emit(B); await wait(() => stale.c.getSnapshot().identity?.uid === B && stale.c.getSnapshot().ready);
  late.resolve(identity(A)); await lateLogin; assert.equal(stale.c.getSnapshot().identity.uid, B);
  const lateFailure = deferred(); stale.setSignin(() => lateFailure.promise); const failing = stale.c.signInEmailPassword('account@example.test', password);
  stale.emit(A); await wait(() => stale.c.getSnapshot().identity?.uid === A && stale.c.getSnapshot().ready); lateFailure.reject(error('invalid_credentials'));
  await assert.rejects(() => failing); assert.equal(stale.c.getSnapshot().identity.uid, A); assert.equal(stale.c.getSnapshot().error, null);

  const remount = fixture(); fixtures.push(remount); await remount.c.start(); const afterDispose = deferred(); remount.setSignin(() => afterDispose.promise);
  const obsolete = remount.c.signInEmailPassword('account@example.test', password); remount.c.dispose(); await remount.c.start(); afterDispose.resolve(identity(A)); await obsolete;
  assert.equal(remount.c.getSnapshot().identity, null); assert.equal(remount.c.getSnapshot().authPhase, 'guest');

  const eventFirst = fixture(); fixtures.push(eventFirst); await eventFirst.c.start(); eventFirst.setSignin(async () => { eventFirst.emit(A); return identity(A); });
  await eventFirst.c.signInEmailPassword('account@example.test', password); await wait(() => eventFirst.c.getSnapshot().ready); assert.equal(eventFirst.readCount(), 1);
  const same = await eventFirst.rawStorage.load(A); eventFirst.emit(A, 'TOKEN_REFRESHED'); assert.equal(eventFirst.c.getSnapshot().identity.uid, A); assert.equal((await eventFirst.rawStorage.load(A)).jobs.length, same.jobs.length);
  eventFirst.setGet(async () => { throw { status: 401 }; }); await assert.rejects(() => eventFirst.c.retry()); assert.equal(eventFirst.c.getSnapshot().authPhase, 'expired'); assert.equal(eventFirst.c.getSnapshot().identity.uid, A);
  console.log('r2受控controller通过：guest失败、加载屏障、认证互斥、expired原UID/队列、A/B隔离、退出失败、迟到/重挂载/事件交错、sync401与密码不持久；非真实Auth或云。');
} finally { for (const f of fixtures) f.c.dispose(); }

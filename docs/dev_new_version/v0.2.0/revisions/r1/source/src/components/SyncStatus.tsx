import type { Locale, MessageKey } from '../i18n';
import { translate } from '../i18n';
import type { StoreStatus } from '../lib/progress';
import type { AccountError, AccountIdentity, AccountSnapshot } from '../lib/sync/types';

export function identityLabel(identity: AccountIdentity | null, locale: Locale) {
  return identity ? identity.email || identity.displayName || translate(locale,'anonymousAccount') : translate(locale,'guestIdentity');
}
export function accountErrorMessage(error: AccountError | null): MessageKey {
  if (!error) return 'authFailed';
  const code=error.code.toLowerCase();
  if (code.includes('unconfigured') || code.includes('config') || code==='invalidpublickey' || code==='invalidcloudurl') return 'cloudUnconfigured';
  if (code==='invalidemail') return 'emailInvalid';
  if (code.includes('rate') || code.includes('429')) return 'authRateLimited';
  if (code.includes('otp') || code.includes('token_expired')) return 'otpInvalid';
  if (code.includes('network') || code.includes('fetch') || code.includes('offline')) return 'authNetworkError';
  if (code==='conflict_changed'||code==='conflictchanged') return 'conflictChanged';
  if (code.includes('pendingoperations')) return 'transferBlocked';
  if (code.includes('stale') || code.includes('preview') || code.includes('changed')) return 'transferChanged';
  if (error.operation==='storage') return 'accountStorageFailed';
  if (error.operation==='transfer') return 'transferFailed';
  if (error.operation==='sync') return 'syncDenied';
  return 'authFailed';
}
export function syncStatusKey(snapshot: AccountSnapshot, guestStatus: StoreStatus): MessageKey {
  if (snapshot.identity || snapshot.authPhase==='expired' || snapshot.authPhase==='account') {
    if (snapshot.saveState==='unsaved') return 'changesUnsaved';
    if (snapshot.authPhase==='expired') return 'sessionExpired';
    if (!snapshot.ready) return snapshot.error?'accountLoadFailed':'accountLoading';
    if (snapshot.conflicts.length) return 'conflictsCount';
    if (snapshot.saveState==='error') return 'syncFailedCount';
    if (snapshot.saveState==='offlineQueued') return 'offlineCount';
    if (snapshot.saveState==='syncing') return 'syncingCount';
    if (snapshot.saveState==='cloudSynced') return 'cloudSynced';
    return 'accountAwaitingSync';
  }
  if (snapshot.authPhase==='restoring') return 'authRestoring';
  if (guestStatus==='corrupt') return 'corruptStorage';
  if (guestStatus!=='ready') return 'changesUnsaved';
  return 'savedDevice';
}
export default function SyncStatus({snapshot,guestStatus,locale,onOpen}:{snapshot:AccountSnapshot;guestStatus:StoreStatus;locale:Locale;onOpen:()=>void}) {
  const key=syncStatusKey(snapshot,guestStatus);
  const name=!snapshot.identity&&['expired','account'].includes(snapshot.authPhase)?translate(locale,'accountIdentity'):identityLabel(snapshot.identity,locale);
  const count=key==='conflictsCount'?snapshot.conflicts.length:snapshot.pendingCount;
  const warning=['changesUnsaved','sessionExpired','accountLoadFailed','conflictsCount','syncFailedCount','corruptStorage'].includes(key);
  return <div className={`identity-status-bar ${warning?'warning':''}`}>
    <div className="identity-status-main"><span className="identity-name" title={name}>{snapshot.identity?translate(locale,'accountIdentity')+' · ':''}{name}</span><span id="progress-save-status" className="save-status" role="status" aria-live="polite">{translate(locale,key,{n:count})}</span></div>
    <button id="account-status-link" onClick={onOpen}>{translate(locale,'openAccount')} <span aria-hidden="true">›</span></button>
  </div>;
}

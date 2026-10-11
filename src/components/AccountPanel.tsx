import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Locale, MessageKey } from '../i18n';
import { translate } from '../i18n';
import type { AccountProgressController, AccountSnapshot, TransferBackup } from '../lib/sync/types';
import { accountErrorMessage, identityLabel, syncStatusKey } from './SyncStatus';

const MIN_PASSWORD_LENGTH = 8;
type AuthMode = 'login' | 'register';
type InvalidField = 'email' | 'password' | 'confirmPassword';
const FORM_ERROR_KEYS = new Set<MessageKey>(['emailInvalid','passwordRequired','confirmPasswordRequired','passwordTooShort','passwordMismatch','invalidCredentials','weakPassword','accountExists','authRateLimited','authNetworkError','authFailed','sessionNotEstablished','emailConfirmationRequired']);

export default function AccountPanel({snapshot,controller,locale,guestCount,guestUsable,onMigration,onConflicts}:{snapshot:AccountSnapshot;controller:AccountProgressController|null;locale:Locale;guestCount:number;guestUsable:boolean;onMigration:(trigger?:HTMLElement)=>Promise<void>;onConflicts:(trigger?:HTMLElement)=>void}) {
  const [mode,setMode]=useState<AuthMode>('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [busy,setBusy]=useState<string|null>(null);
  const [failure,setFailure]=useState<MessageKey|null>(null);
  const [invalidField,setInvalidField]=useState<InvalidField|null>(null);
  const [migrationHidden,setMigrationHidden]=useState(false);
  const [ignoredError,setIgnoredError]=useState<AccountSnapshot['error']>(snapshot.error);
  const emailInput=useRef<HTMLInputElement>(null);
  const passwordInput=useRef<HTMLInputElement>(null);
  const confirmInput=useRef<HTMLInputElement>(null);
  const busyRef=useRef(false);
  const requestEpoch=useRef(0);
  const mounted=useRef(true);
  const t=(key:MessageKey,values?:Record<string,string|number>)=>translate(locale,key,values);
  const unconfigured=snapshot.authPhase==='unconfigured'||!!snapshot.error&&accountErrorMessage(snapshot.error)==='cloudUnconfigured';
  const restoring=snapshot.authPhase==='restoring';
  const expired=snapshot.authPhase==='expired';
  const canTransfer=!!snapshot.identity&&snapshot.authPhase==='account'&&snapshot.ready&&snapshot.pendingCount===0&&snapshot.conflicts.length===0&&snapshot.saveState!=='unsaved';

  function clearCredentials(){setPassword('');setConfirmPassword('');setFailure(null);setInvalidField(null);setIgnoredError(snapshot.error);}
  function clearEditedError(field:InvalidField){
    if(failure&&FORM_ERROR_KEYS.has(failure)&&(!invalidField||invalidField===field||failure==='passwordMismatch'&&field==='password')){setFailure(null);setInvalidField(null);}
    if(snapshot.error?.operation==='auth'&&FORM_ERROR_KEYS.has(accountErrorMessage(snapshot.error)))setIgnoredError(snapshot.error);
  }
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;requestEpoch.current++;};},[]);
  useEffect(()=>{
    requestEpoch.current++;
    busyRef.current=false;
    setBusy(null);
    setPassword('');setConfirmPassword('');setFailure(null);setInvalidField(null);
    setIgnoredError(snapshot.error);
  },[snapshot.identity?.uid,expired]);

  function validate():boolean {
    let key:MessageKey|null=null;let field:InvalidField|null=null;
    if(!emailInput.current?.checkValidity()){key='emailInvalid';field='email';}
    else if(!password){key='passwordRequired';field='password';}
    else if(mode==='register'&&password.length<MIN_PASSWORD_LENGTH){key='passwordTooShort';field='password';}
    else if(mode==='register'&&!confirmPassword){key='confirmPasswordRequired';field='confirmPassword';}
    else if(mode==='register'&&password!==confirmPassword){key='passwordMismatch';field='confirmPassword';}
    if(!key)return true;
    setFailure(key);setInvalidField(field);setIgnoredError(snapshot.error);
    ({email:emailInput,password:passwordInput,confirmPassword:confirmInput}[field!]).current?.focus();
    return false;
  }
  async function authenticate(event:FormEvent){
    event.preventDefault();if(!controller||busyRef.current||!validate())return;
    busyRef.current=true;setBusy(mode);setFailure(null);setInvalidField(null);setIgnoredError(snapshot.error);
    const epoch=requestEpoch.current;
    try{
      if(mode==='register')await controller.signUpEmailPassword(email.trim(),password);
      else await controller.signInEmailPassword(email.trim(),password);
      if(mounted.current&&epoch===requestEpoch.current)clearCredentials();
    }catch{
      if(mounted.current&&epoch===requestEpoch.current){const next=controller.getSnapshot().error;setIgnoredError(next);setFailure(accountErrorMessage(next));}
    }finally{
      if(mounted.current&&epoch===requestEpoch.current){busyRef.current=false;setBusy(null);}
    }
  }
  async function action(name:string,operation:()=>Promise<void>){
    if(busyRef.current)return;busyRef.current=true;setBusy(name);setFailure(null);setInvalidField(null);setIgnoredError(snapshot.error);
    const epoch=requestEpoch.current;
    try{await operation();}catch{if(mounted.current&&epoch===requestEpoch.current)setFailure(name==='signout'?'signOutFailed':name==='migration'?'transferFailed':'authFailed');}
    finally{if(mounted.current&&epoch===requestEpoch.current){busyRef.current=false;setBusy(null);}}
  }
  function changeMode(next:AuthMode){if(busyRef.current||next===mode)return;setMode(next);clearCredentials();}
  function continueGuest(){
    if(busyRef.current)return;
    if(snapshot.identity&&controller){void action('signout',async()=>{await controller.signOut();if(mounted.current){clearCredentials();location.hash='#/';}});}
    else{clearCredentials();location.hash='#/';}
  }
  const error=failure||(snapshot.error&&snapshot.error!==ignoredError?accountErrorMessage(snapshot.error):null);
  const fieldDescription=(field:InvalidField)=>[field==='password'&&mode==='register'?'account-password-hint':null,error&&(invalidField===null||invalidField===field)?'account-error':null].filter(Boolean).join(' ')||undefined;
  return <section id="account-section" className="settings-section account-panel" tabIndex={-1}><h2>{t('accountSync')}</h2>
    {unconfigured?<p className="inline-notice">{t('cloudUnconfigured')}</p>:restoring?<p role="status">{t('authRestoring')}</p>:null}
    {snapshot.identity&&<><p className="account-full-identity"><strong>{identityLabel(snapshot.identity,locale)}</strong></p><details className="account-identifier"><summary>{t('identityDetails')}</summary><code>{snapshot.identity.uid}</code></details><p className="account-save-status" role="status">{t(syncStatusKey(snapshot,'ready'),{n:snapshot.conflicts.length||snapshot.pendingCount})}</p>
      {!snapshot.ready&&<p className="inline-notice">{t('accountReadOnly')}</p>}{snapshot.ready&&['offlineQueued','error'].includes(snapshot.saveState)&&<p className="muted small">{t('cacheUnconfirmed')}</p>}{expired&&<p className="inline-notice">{t('sessionExpired')}</p>}
      <div className="backup-actions"><button type="button" className="button secondary" disabled={!!busy||!controller} onClick={()=>controller&&void action('retry',()=>controller.retry())}>{t('retrySync')}</button>{snapshot.conflicts.length>0&&<button type="button" className="button secondary" id="conflicts-trigger" onClick={event=>onConflicts(event.currentTarget)}>{t('viewConflicts')} ({snapshot.conflicts.length})</button>}<button type="button" className="button secondary" disabled={!!busy||!controller} onClick={()=>controller&&void action('signout',()=>controller.signOut())}>{t(busy==='signout'?'signingOut':'signOut')}</button></div><p className="muted small">{t('signOutHint')}</p>
      {guestCount>0&&<div className="guest-migration-note">{!migrationHidden&&<p>{t('migrationHint',{n:guestCount})}</p>}<button id="migration-trigger" type="button" className="button secondary" onClick={event=>{const trigger=event.currentTarget;void action('migration',()=>onMigration(trigger));}} disabled={!canTransfer||!guestUsable||!!busy}>{t(busy==='migration'?'busyAction':'previewMigration')}</button>{!migrationHidden&&<button type="button" className="button quiet" onClick={()=>setMigrationHidden(true)}>{t('deferMigration')}</button>}{!canTransfer&&<p className="small muted">{t('transferBlocked')}</p>}{!guestUsable&&<p className="small muted">{t('guestIdentity')} · {t('corruptStorage')}</p>}</div>}
    </>}
    {!unconfigured&&!restoring&&(!snapshot.identity||expired)&&controller&&<div className="sign-in-panel">
      <p className="muted">{t('guestAccountHint')}</p>
      <div className="account-auth-modes" aria-label={t('authMode')}><button type="button" className="button secondary" aria-pressed={mode==='login'} disabled={!!busy} onClick={()=>changeMode('login')}>{t('passwordLogin')}</button><button type="button" className="button secondary" aria-pressed={mode==='register'} disabled={!!busy} onClick={()=>changeMode('register')}>{t('passwordRegister')}</button></div>
      <form onSubmit={event=>void authenticate(event)} noValidate aria-busy={!!busy}>
        <label htmlFor="account-email">{t('emailLabel')}</label><input ref={emailInput} id="account-email" name="username" type="email" required value={email} onChange={event=>{setEmail(event.target.value);clearEditedError('email');}} autoComplete="username" disabled={!!busy} aria-invalid={!!error&&(invalidField===null||invalidField==='email')} aria-describedby={fieldDescription('email')}/>
        <label htmlFor="account-password">{t('passwordLabel')}</label><input ref={passwordInput} id="account-password" name="password" type="password" required value={password} onChange={event=>{setPassword(event.target.value);clearEditedError('password');}} autoComplete={mode==='login'?'current-password':'new-password'} disabled={!!busy} aria-invalid={!!error&&(invalidField===null||invalidField==='password')} aria-describedby={fieldDescription('password')}/>
        {mode==='register'&&<><p id="account-password-hint" className="small muted">{t('passwordTooShort',{min:MIN_PASSWORD_LENGTH})}</p><label htmlFor="account-confirm-password">{t('confirmPasswordLabel')}</label><input ref={confirmInput} id="account-confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={event=>{setConfirmPassword(event.target.value);clearEditedError('confirmPassword');}} autoComplete="new-password" disabled={!!busy} aria-invalid={!!error&&(invalidField===null||invalidField==='confirmPassword')} aria-describedby={fieldDescription('confirmPassword')}/><p className="small muted account-password-notice">{t('emailPasswordHint')}</p></>}
        <div className="backup-actions"><button className="button primary" type="submit" disabled={!!busy}>{t(busy===mode?(mode==='login'?'passwordSigningIn':'passwordSigningUp'):(mode==='login'?'passwordLogin':'passwordRegister'))}</button><button className="button quiet" type="button" disabled={!!busy} onClick={continueGuest}>{t(busy==='signout'?'signingOut':'continueGuest')}</button></div>
      </form>
    </div>}
    {error&&<p id="account-error" className="inline-error" role="alert">{t(error,{min:MIN_PASSWORD_LENGTH})}</p>}
  </section>;
}
export function AccountBackups({snapshot,locale,onExport,onRestore}:{snapshot:AccountSnapshot;locale:Locale;onExport:(backup:TransferBackup)=>void;onRestore:(id:string,trigger?:HTMLElement)=>Promise<void>}) {
  const [busy,setBusy]=useState<string|null>(null);const [failure,setFailure]=useState(false);const t=(key:MessageKey)=>translate(locale,key);
  if(!snapshot.identity||!snapshot.backups.length)return null;
  async function restore(id:string,trigger:HTMLElement){setBusy(id);setFailure(false);try{await onRestore(id,trigger);}catch{setFailure(true);}finally{setBusy(null);}}
  const blocked=!snapshot.ready||snapshot.authPhase!=='account'||snapshot.pendingCount>0||snapshot.conflicts.length>0;
  return <div className="previous-backup account-backups"><h3>{t('accountBackups')}</h3><p>{t('accountBackupHint')}</p>{snapshot.backups.map(backup=><div className="account-backup-row" key={backup.id}><small>{backup.createdAt.replace('T',' ').slice(0,19)} · {translate(locale,'savedCount',{count:backup.accountCompletedIds.length})}</small><div className="backup-actions"><button className="button secondary" onClick={()=>onExport(backup)}>{t('exportAccountBefore')}</button><button className="button secondary" id={`restore-account-${backup.id}`} onClick={event=>void restore(backup.id,event.currentTarget)} disabled={blocked||!!busy||backup.uid!==snapshot.identity?.uid}>{t(busy===backup.id?'busyAction':'restoreAccountBackup')}</button></div>{backup.uid!==snapshot.identity?.uid&&<p className="small muted">{t('backupOtherAccount')}</p>}</div>)}{blocked&&<p className="small muted">{t('transferBlocked')}</p>}{failure&&<p className="inline-error" role="alert">{t('transferFailed')}</p>}</div>;
}

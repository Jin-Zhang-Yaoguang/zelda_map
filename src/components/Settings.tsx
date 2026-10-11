import type { ReactNode } from 'react';
import type { Locale } from '../i18n';
import { languages, translate } from '../i18n';
import type { ProgressBackup, StoreStatus } from '../lib/progress';
import { Icon } from './Icon';
interface SettingsProps {
  locale:Locale;showDlc:boolean;showShrines:boolean;onLocale:(locale:Locale)=>void;onDlc:(show:boolean)=>void;onShrines:(show:boolean)=>void;
  onExport:()=>void;onImport:()=>void;onPreviousExport:()=>void;onPreviousReview:(trigger?:HTMLElement)=>void;
  previous:ProgressBackup|null;storageStatus:StoreStatus;onRetry:()=>void;canImport:boolean;
  accountMode:boolean;backupIdentity:string;accountSlot:ReactNode;backupSlot:ReactNode;canExport:boolean;
}
export default function Settings(props:SettingsProps) {
  const {locale,showDlc,previous,storageStatus,accountMode}=props;const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
  return <main className="content-page settings-page"><a className="back-link" href="#/"><Icon name="arrow"/>{t('backToMap')}</a><div className="page-heading"><span className="eyebrow">{t('product')}</span><h1 id="page-title" tabIndex={-1}>{t('settings')}</h1></div>
    {props.accountSlot}
    <section className="settings-section"><h2>{t('display')}</h2><p className="muted">{t('displayHint')}</p><div className="setting-row"><label htmlFor="settings-language">{t('language')}</label><select id="settings-language" value={locale} onChange={event=>props.onLocale(event.target.value as Locale)}>{languages.map(language=><option key={language.id} value={language.id}>{language.label}</option>)}</select></div><div className="setting-row dlc-setting"><div><label htmlFor="settings-shrines">{t('showShrines')}</label><p>{t('shrineVisibilityHint')}</p></div><label className="switch"><input id="settings-shrines" type="checkbox" checked={props.showShrines} onChange={event=>props.onShrines(event.target.checked)}/><span aria-hidden="true"/></label></div><div className="setting-row dlc-setting"><div><label htmlFor="settings-dlc">{t('showDlc')}</label><p>{t('dlcSettingsHint')}</p></div><label className="switch"><input id="settings-dlc" type="checkbox" checked={showDlc} onChange={event=>props.onDlc(event.target.checked)}/><span aria-hidden="true"/></label></div></section>
    <section className="settings-section"><h2>{t('storage')}</h2><p className="backup-target">{translate(locale,'currentBackupTarget',{identity:accountMode?t('accountIdentity')+' · '+props.backupIdentity:t('guestIdentity')})}</p><p>{t(accountMode?'accountBackupFormatHint':'storageHint')}</p>
      {!accountMode&&<><p className={`storage-status ${storageStatus==='ready'?'ok':'warning'}`}><Icon name={storageStatus==='ready'?'check':'download'}/>{t(storageStatus==='ready'?'savedLocal':storageStatus==='corrupt'?'corruptStorage':'unsaved')}</p>{storageStatus!=='ready'&&<button className="button secondary" onClick={props.onRetry}>{t(storageStatus==='corrupt'?'repairStorage':'retrySave')}</button>}</>}
      <div className="backup-actions"><button className="button primary" onClick={props.onExport} disabled={!props.canExport}><Icon name="download"/>{t('exportBackup')}</button><button id="import-trigger" className="button secondary" onClick={props.onImport} disabled={!props.canImport}><Icon name="upload"/>{t('importBackup')}</button></div><p className="muted small">{t('backupHint')}</p>{accountMode&&!props.canImport&&<p className="muted small">{t('transferBlocked')}</p>}
      {previous&&<div className="previous-backup"><h3>{t('preImportBackup')}</h3><p>{t('preImportHint')} · {t('guestProgress')}</p><small>{previous.exportedAt.replace('T',' ').slice(0,19)} · {translate(locale,'savedCount',{count:previous.completedIds.length})}</small><div className="backup-actions"><button className="button secondary" onClick={props.onPreviousExport}>{t('exportPrevious')}</button><button className="button secondary" id="restore-guest-trigger" onClick={event=>props.onPreviousReview(event.currentTarget)} disabled={!props.canImport}>{t('restorePrevious')}</button></div></div>}
      {props.backupSlot}
    </section>
  </main>;
}

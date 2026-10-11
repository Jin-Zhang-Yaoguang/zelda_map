import { useState } from 'react';
import type { Locale } from '../i18n';
import { localize, translate } from '../i18n';
import type { AccountSnapshot, TransferPreview } from '../lib/sync/types';
import type { ShrineDataset } from '../types';
import AccountDialog from './AccountDialog';
import { identityLabel, accountErrorMessage } from './SyncStatus';
export default function TransferDialog({preview,snapshot,data,locale,onClose,onApply,onRefresh,onExport,duplicates=0,differentVersion=false,returnFocus}:{preview:TransferPreview;snapshot:AccountSnapshot;data:ShrineDataset;locale:Locale;onClose:()=>void;onApply:(mode:'merge'|'replace')=>Promise<void>;onRefresh:()=>Promise<void>;onExport:(source:boolean)=>void;duplicates?:number;differentVersion?:boolean;returnFocus?:()=>HTMLElement|null}) {
  const [mode,setMode]=useState<'merge'|'replace'|null>(null);const [busy,setBusy]=useState(false);const [failed,setFailed]=useState(false);
  const t=(key:Parameters<typeof translate>[1],values?:Record<string,string|number>)=>translate(locale,key,values);
  const blocked=!snapshot.ready||snapshot.authPhase!=='account'||snapshot.identity?.uid!==preview.uid||snapshot.pendingCount>0||snapshot.conflicts.length>0||snapshot.saveState==='unsaved';
  const ids=mode==='merge'?preview.mergeAddedIds:mode==='replace'?[...preview.replaceAddedIds,...preview.replaceRemovedIds]:[];
  const rows=data.shrines.filter(shrine=>ids.includes(shrine.id));const added=mode==='merge'?preview.mergeAddedIds:preview.replaceAddedIds;
  async function apply(){if(!mode||blocked||!preview.hasChanges[mode])return;setBusy(true);setFailed(false);try{await onApply(mode);}catch{setFailed(true);setMode(null);}finally{setBusy(false);}}
  async function refresh(){setBusy(true);try{await onRefresh();}catch{setFailed(true);}finally{setBusy(false);}}
  return <AccountDialog title={t(preview.sourceKind==='guest'?'migrateGuest':preview.sourceKind==='json'?'accountImport':'restoreAccountBackup')} locale={locale} onClose={onClose} returnFocus={returnFocus}>
    <p className="transfer-target">{t('targetAccount')} · <strong>{identityLabel(snapshot.identity,locale)}</strong></p>
    <div className="transfer-counts"><div><span>{t(preview.sourceKind==='guest'?'sourceGuest':preview.sourceKind==='json'?'sourceJson':'sourceRestore')}</span><strong>{preview.sourceCount}</strong></div><div><span>{t('accountProgress')}</span><strong>{preview.cloudCount}</strong></div><div><span>{t('resultProgress')}</span><strong>{mode?mode==='merge'?preview.mergeCount:preview.replaceCount:'—'}</strong></div></div>
    <p className="small muted">{t('overlapCount',{n:preview.overlapCount})} · {t('hiddenDlcIncluded')}</p>
    {duplicates>0&&<p className="inline-notice">{t('duplicateHint',{count:duplicates})}</p>}{differentVersion&&<p className="inline-notice">{t('versionHint')}</p>}<fieldset className="transfer-modes" disabled={busy}><legend>{t('chooseTransferMode')}</legend>{(['merge','replace'] as const).map(value=><label key={value}><input type="radio" name="transfer-mode" value={value} checked={mode===value} onChange={()=>setMode(value)}/><span><strong>{t(value==='merge'?'mergeProgress':'replaceProgress')}</strong><small>{t(value==='merge'?'mergeHint':'replaceHint')}</small><small>{t('transferDiff',{added:value==='merge'?preview.mergeAddedIds.length:preview.replaceAddedIds.length,removed:value==='merge'?0:preview.replaceRemovedIds.length,total:value==='merge'?preview.mergeCount:preview.replaceCount})}</small></span></label>)}</fieldset>
    {mode&&<div className="transfer-differences">{rows.length?rows.map(shrine=><div key={shrine.id}><span><strong>{localize(shrine.name,locale)}</strong><small>{localize(data.regions.find(region=>region.id===shrine.regionId)?.name,locale)} {shrine.dlc&&' · DLC'}</small></span><span>{t(added.includes(shrine.id)?'incomplete':'completed')} → {t(added.includes(shrine.id)?'completed':'incomplete')}</span></div>):<p>{t('transferNoChanges')}</p>}</div>}
    <p className="small muted">{t('transferBackupHint')}</p>{blocked&&<p className="inline-notice">{t('transferBlocked')}</p>}{failed&&<div className="inline-error" role="alert"><p>{t(snapshot.error?accountErrorMessage(snapshot.error):'transferChanged')}</p><button className="button secondary" onClick={()=>void refresh()} disabled={busy||blocked}>{t('refreshPreview')}</button></div>}
    <div className="backup-actions"><button className="button secondary" onClick={()=>onExport(false)}>{t('exportAccountBefore')}</button><button className="button secondary" onClick={()=>onExport(true)}>{t('exportSourceBefore')}</button></div>
    <div className="dialog-actions"><button className="button secondary" onClick={onClose}>{t('cancel')}</button><button className="button primary" onClick={()=>void apply()} disabled={!mode||blocked||busy||!preview.hasChanges[mode]} aria-busy={busy}>{t(busy?'transferApplying':mode==='replace'?'confirmReplace':'confirmMerge')}</button></div>
  </AccountDialog>;
}

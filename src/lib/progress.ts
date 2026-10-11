import type { Locale } from '../i18n';
import { isShrineId } from './data';
export const STORAGE = { progress:'zelda-map:botw:v1:progress', settings:'zelda-map:botw:v1:settings', previous:'zelda-map:botw:v1:pre-import' };
export type StoreStatus = 'ready' | 'corrupt' | 'unavailable' | 'pending';
export interface Preferences { schemaVersion:1; locale:Locale; showDlc:boolean; showShrines:boolean }
export interface ProgressBackup { format:'zelda-map-progress'; schemaVersion:1; game:'botw'; dataVersion:string; exportedAt:string; completedIds:string[] }
export type PreviewResult = {ok:true; backup:ProgressBackup; duplicates:number; differentVersion:boolean} | {ok:false; reason:'importInvalid'|'importUnknown'|'importTooLarge'; unknownIds?:string[]};
const object = (v:unknown):v is Record<string,unknown> => v!==null && typeof v==='object' && !Array.isArray(v);
const date = (v:unknown) => typeof v==='string' && Number.isFinite(Date.parse(v));
export function readPreferences(): {value:Preferences; status:StoreStatus; raw:string|null} {
  const fallback:Preferences={schemaVersion:1,locale:'zh',showDlc:true,showShrines:true};
  let raw:string|null=null;
  try {
    raw=localStorage.getItem(STORAGE.settings);
    if(raw===null)return {value:fallback,status:'ready',raw};
    const value=JSON.parse(raw);
    if(!object(value)||value.schemaVersion!==1||!['zh','en','ja'].includes(String(value.locale))||typeof value.showDlc!=='boolean'||value.showShrines!==undefined&&typeof value.showShrines!=='boolean')return {value:fallback,status:'corrupt',raw};
    return {value:{schemaVersion:1,locale:value.locale as Locale,showDlc:value.showDlc,showShrines:value.showShrines===undefined?true:value.showShrines},status:'ready',raw};
  }catch{return {value:fallback,status:raw===null?'unavailable':'corrupt',raw};}
}
export function readProgress(): {ids:Set<string>; status:StoreStatus; raw:string|null} { let raw:string|null=null; try {raw=localStorage.getItem(STORAGE.progress); if (raw===null) return {ids:new Set(),status:'ready',raw}; const v=JSON.parse(raw); if (!object(v) || v.schemaVersion!==1 || v.game!=='botw' || typeof v.dataVersion!=='string' || !date(v.updatedAt) || !Array.isArray(v.completedIds) || !v.completedIds.every(isShrineId)) return {ids:new Set(),status:'corrupt',raw}; return {ids:new Set(v.completedIds),status:'ready',raw};} catch {return {ids:new Set(),status:raw===null?'unavailable':'corrupt',raw};} }
export function saveVerified(key:string,value:unknown): boolean { try {const raw=JSON.stringify(value); localStorage.setItem(key,raw); return localStorage.getItem(key)===raw;} catch {return false;} }
export function progressRecord(ids:Set<string>,dataVersion:string) {return {schemaVersion:1,game:'botw',dataVersion,completedIds:[...ids].sort(),updatedAt:new Date().toISOString()};}
export function makeBackup(ids:Set<string>,dataVersion:string):ProgressBackup {return {format:'zelda-map-progress',schemaVersion:1,game:'botw',dataVersion,exportedAt:new Date().toISOString(),completedIds:[...ids].sort()};}
export function validateBackup(raw:string, known:Set<string>, dataVersion:string):PreviewResult {
  if (new Blob([raw]).size>1024*1024) return {ok:false,reason:'importTooLarge'};
  try {const v:unknown=JSON.parse(raw); if (!object(v) || v.format!=='zelda-map-progress' || v.schemaVersion!==1 || v.game!=='botw' || typeof v.dataVersion!=='string' || !v.dataVersion || !date(v.exportedAt) || !Array.isArray(v.completedIds) || !v.completedIds.every(id=>typeof id==='string')) return {ok:false,reason:'importInvalid'};
    const unknownIds=[...new Set((v.completedIds as string[]).filter(id=>!known.has(id)))]; if (unknownIds.length) return {ok:false,reason:'importUnknown',unknownIds}; const ids=[...new Set(v.completedIds as string[])].sort(); return {ok:true,backup:{format:'zelda-map-progress',schemaVersion:1,game:'botw',dataVersion:v.dataVersion,exportedAt:v.exportedAt as string,completedIds:ids},duplicates:v.completedIds.length-ids.length,differentVersion:v.dataVersion!==dataVersion};
  } catch {return {ok:false,reason:'importInvalid'};}
}
export function readPrevious():ProgressBackup|null {try {const raw=localStorage.getItem(STORAGE.previous); if (!raw) return null; const p=validateBackup(raw,new Set(Array.from({length:136},(_,i)=>`Dungeon${String(i).padStart(3,'0')}`)),''); return p.ok?p.backup:null;} catch {return null;} }
export function downloadJson(value:unknown,filename:string) {const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);}

import type { ShrineDataset, ShrineRecord } from '../types';
export const isShrineId = (id: unknown): id is ShrineRecord['id'] => typeof id==='string' && /^Dungeon\d{3}$/.test(id) && Number(id.slice(7))<136;
const record = (x: unknown): x is Record<string,unknown> => !!x && typeof x==='object' && !Array.isArray(x);
const text = (x: unknown) => record(x) && ['zh','en','ja'].every(k => typeof x[k]==='string' && (x[k] as string).trim().length>0);
export function validateDataset(value: unknown): ShrineDataset {
  if (!record(value) || value.schemaVersion!==1 || value.game!=='botw' || typeof value.dataVersion!=='string' || !Array.isArray(value.regions) || !Array.isArray(value.sources) || !Array.isArray(value.shrines) || value.shrines.length!==136 || !Array.isArray(value.towers) || value.towers.length!==15) throw new Error('Invalid dataset root');
  const regions = new Set<string>();
  for (const r of value.regions) { if (!record(r) || typeof r.id!=='string' || !text(r.name) || regions.has(r.id)) throw new Error('Invalid regions'); regions.add(r.id); }
  const sources = new Set<string>();
  for (const s of value.sources) { if (!record(s) || typeof s.id!=='string' || typeof s.title!=='string' || typeof s.url!=='string' || !safeUrl(s.url) || sources.has(s.id)) throw new Error('Invalid sources'); sources.add(s.id); }
  const ids = new Set<string>(); let dlc=0;
  for (const s of value.shrines) {
    if (!record(s) || !isShrineId(s.id) || ids.has(s.id) || !text(s.name) || !text(s.trial) || typeof s.regionId!=='string' || !regions.has(s.regionId) || typeof s.dlc!=='boolean' || !record(s.position) || !['x','y','z'].every(k=>typeof (s.position as Record<string,unknown>)[k]==='number' && Number.isFinite((s.position as Record<string,unknown>)[k])) || !record(s.safe) || !text(s.safe.summary) || !text(s.safe.prerequisite) || !record(s.detail) || !text(s.detail.intro)) throw new Error('Invalid shrine');
    for (const key of ['prerequisites','supplies','walkthrough']) if (!Array.isArray(s.detail[key]) || !(s.detail[key] as unknown[]).every(text)) throw new Error('Invalid detail');
    if (!record(s.verification)) throw new Error('Missing verification');
    for (const key of ['name','position','region','safe','intro','prerequisites','supplies','walkthrough']) { const v=s.verification[key]; if (!record(v) || !['verified','unverified','conflict'].includes(String(v.status)) || !Array.isArray(v.sourceIds) || !v.sourceIds.every(id=>typeof id==='string' && sources.has(id))) throw new Error('Invalid verification'); }
    ids.add(s.id); if (s.dlc) dlc++;
  }
  if (dlc!==16) throw new Error('Invalid DLC count');
  const towerIds = new Set<string>();
  for (const tower of value.towers) {
    if (!record(tower) || typeof tower.id!=='string' || !/^Tower(?:0[1-9]|1[0-5])$/.test(tower.id) || towerIds.has(tower.id) || !text(tower.name) || typeof tower.regionId!=='string' || !regions.has(tower.regionId) || typeof tower.sourceId!=='string' || !sources.has(tower.sourceId) || !record(tower.position) || !['x','y','z'].every(key=>typeof (tower.position as Record<string,unknown>)[key]==='number' && Number.isFinite((tower.position as Record<string,unknown>)[key])) || !record(tower.verification)) throw new Error('Invalid tower');
    for (const key of ['name','position','region']) { const evidence=tower.verification[key]; if (!record(evidence) || !['verified','unverified','conflict'].includes(String(evidence.status)) || !Array.isArray(evidence.sourceIds) || !evidence.sourceIds.length || !evidence.sourceIds.every(id=>typeof id==='string' && sources.has(id))) throw new Error('Invalid tower verification'); }
    towerIds.add(tower.id);
  }
  return value as unknown as ShrineDataset;
}
export function safeUrl(value: string): string | null { try { const url=new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
export const shrineLatLng = (s: Pick<ShrineRecord,'position'>): [number,number] => [-(s.position.z+5000)/4,(s.position.x+6000)/4];
export const normalizeSearch = (s: string) => s.normalize('NFKC').toLocaleLowerCase().replace(/[\s·・\-‐]/g,'');

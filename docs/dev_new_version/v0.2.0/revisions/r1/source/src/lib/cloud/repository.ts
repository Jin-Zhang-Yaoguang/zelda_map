import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudRow } from '../sync/types';
import { failure, normalizeError } from './errors';
export interface Mutation { shrineId: string; completed: boolean; expectedRevision: number }
export type ApplyResult = { status: 'applied'; requestId: string; rows: CloudRow[] } | { status: 'conflict'; requestId: string; conflicts: { shrineId: string; expectedRevision: number; current: CloudRow }[] };
export interface AccountRepository { get(signal?: AbortSignal, expectedUid?: string): Promise<CloudRow[]>; apply(requestId: string, mutations: readonly Mutation[], signal?: AbortSignal, expectedUid?: string): Promise<ApplyResult> }
function object(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function keys(v: Record<string,unknown>, expected: string[]): boolean { return Object.keys(v).sort().join('|') === expected.sort().join('|'); }
export function parseCloudRows(value: unknown, known: ReadonlySet<string>, absent = false): CloudRow[] {
  if (!Array.isArray(value) || value.length > 136) throw failure('sync','invalidCloudResponse');
  const seen = new Set<string>();
  return value.map(v => {
    if (!object(v) || !keys(v,['shrine_id','completed','revision','updated_at']) || typeof v.shrine_id !== 'string' || !known.has(v.shrine_id) || seen.has(v.shrine_id) || typeof v.completed !== 'boolean' || !Number.isInteger(v.revision) || Number(v.revision)<(absent?0:1) || Number(v.revision)>2147483647 || typeof v.updated_at !== 'string' || !(Number(v.revision)===0 && absent && v.completed===false && v.updated_at==='' || Number(v.revision)>0 && /^\d{4}-\d{2}-\d{2}T/.test(v.updated_at) && Number.isFinite(Date.parse(v.updated_at)))) throw failure('sync','invalidCloudResponse');
    seen.add(v.shrine_id); return { shrineId:v.shrine_id,completed:v.completed,revision:Number(v.revision),updatedAt:v.updated_at };
  });
}
export function createAccountRepository(client: SupabaseClient, known: ReadonlySet<string>): AccountRepository {
  async function token(expectedUid?: string):Promise<string>{const {data,error}=await client.auth.getSession();if(error)throw error;const session=data.session;if(!session||!expectedUid||session.user.id!==expectedUid)throw failure('sync','sessionExpired');return session.access_token;}
  return {
    async get(signal,expectedUid) {
      try { const bearer=await token(expectedUid);let call = client.rpc('get_shrine_progress',{p_game_id:'botw'}).setHeader('Authorization','Bearer '+bearer); if(signal)call=call.abortSignal(signal); const {data,error}=await call; if(error)throw error; if(!object(data)||!keys(data,['rows']))throw failure('sync','invalidCloudResponse'); return parseCloudRows(data.rows,known); } catch(e){throw normalizeError(e,'sync');}
    },
    async apply(requestId,mutations,signal,expectedUid) {
      try {
        const bearer=await token(expectedUid);let call=client.rpc('apply_shrine_progress',{p_game_id:'botw',p_request_id:requestId,p_mutations:mutations.map(m=>({shrine_id:m.shrineId,completed:m.completed,expected_revision:m.expectedRevision}))}).setHeader('Authorization','Bearer '+bearer); if(signal)call=call.abortSignal(signal);
        const {data,error}=await call; if(error)throw error;
        if(!object(data)||data.request_id!==requestId)throw failure('sync','invalidCloudResponse');
        if(data.status==='applied' && keys(data,['status','request_id','rows'])) {
          const rows=parseCloudRows(data.rows,known); if(rows.length!==mutations.length||rows.some(r=>!mutations.some(m=>m.shrineId===r.shrineId&&m.completed===r.completed&&r.revision===m.expectedRevision+1)))throw failure('sync','invalidCloudResponse');
          return {status:'applied',requestId,rows};
        }
        if(data.status==='conflict'&&keys(data,['status','request_id','conflicts'])&&Array.isArray(data.conflicts)&&data.conflicts.length>0&&data.conflicts.length<=mutations.length) {
          const seen=new Set<string>(); const conflicts=data.conflicts.map(c=>{
            if(!object(c)||!keys(c,['shrine_id','expected_revision','current'])||typeof c.shrine_id!=='string'||seen.has(c.shrine_id)||!mutations.some(m=>m.shrineId===c.shrine_id&&m.expectedRevision===c.expected_revision))throw failure('sync','invalidCloudResponse');
            seen.add(c.shrine_id);const current=parseCloudRows([c.current],known,true)[0]; if(current.shrineId!==c.shrine_id||current.revision===c.expected_revision)throw failure('sync','invalidCloudResponse');
            return {shrineId:c.shrine_id,expectedRevision:Number(c.expected_revision),current};
          }); return {status:'conflict',requestId,conflicts};
        }
        throw failure('sync','invalidCloudResponse');
      } catch(e){throw normalizeError(e,'sync');}
    },
  };
}

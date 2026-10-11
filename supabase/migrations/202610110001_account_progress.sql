-- Supabase托管角色/auth.uid由平台提供；测试stub仅存在隔离测试库。
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.shrine_progress (
  user_id uuid not null, game_id text not null check (game_id='botw'),
  shrine_id text not null check (shrine_id ~ '^Dungeon(0[0-9]{2}|1[0-2][0-9]|13[0-5])$'),
  completed boolean not null, revision integer not null check (revision>0),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key(user_id,game_id,shrine_id)
);
create table private.progress_receipts (
  user_id uuid not null, game_id text not null check(game_id='botw'), request_id uuid not null,
  payload jsonb not null, result jsonb not null, created_at timestamptz not null default pg_catalog.now(),
  primary key(user_id,game_id,request_id)
);
alter table private.shrine_progress enable row level security;
alter table private.progress_receipts enable row level security;
create policy owner_progress on private.shrine_progress to authenticated
  using ((select auth.uid()) is not null and (select auth.uid())=user_id)
  with check ((select auth.uid()) is not null and (select auth.uid())=user_id);
create policy owner_receipts on private.progress_receipts to authenticated
  using ((select auth.uid()) is not null and (select auth.uid())=user_id)
  with check ((select auth.uid()) is not null and (select auth.uid())=user_id);
revoke all on private.shrine_progress,private.progress_receipts from public,anon,authenticated;

create function public.get_shrine_progress(p_game_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid := auth.uid(); v_rows jsonb;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_game_id is distinct from 'botw' then raise exception 'invalid game' using errcode='22023'; end if;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('shrine_id',p.shrine_id,'completed',p.completed,'revision',p.revision,'updated_at',p.updated_at) order by p.shrine_id),'[]'::jsonb)
  into v_rows from private.shrine_progress p where p.user_id=v_uid and p.game_id=p_game_id;
  return pg_catalog.jsonb_build_object('rows',v_rows);
end $$;

create function public.apply_shrine_progress(p_game_id text,p_request_id uuid,p_mutations jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid := auth.uid(); v_old private.progress_receipts%rowtype;
  v_mut jsonb; v_current private.shrine_progress%rowtype; v_revision integer;
  v_conflicts jsonb := '[]'::jsonb; v_rows jsonb := '[]'::jsonb; v_result jsonb;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_game_id is distinct from 'botw' or p_request_id is null or pg_catalog.jsonb_typeof(p_mutations) is distinct from 'array' then
    raise exception 'invalid request' using errcode='22023';
  end if;
  if pg_catalog.jsonb_array_length(p_mutations)<1 or pg_catalog.jsonb_array_length(p_mutations)>136 or pg_catalog.octet_length(p_mutations::text)>65536 then
    raise exception 'invalid batch size' using errcode='22023';
  end if;
  for v_mut in select value from pg_catalog.jsonb_array_elements(p_mutations) loop
    if pg_catalog.jsonb_typeof(v_mut) is distinct from 'object' or
      (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(v_mut))<>3 or
      pg_catalog.jsonb_typeof(v_mut->'shrine_id') is distinct from 'string' or
      (v_mut->>'shrine_id') !~ '^Dungeon(0[0-9]{2}|1[0-2][0-9]|13[0-5])$' or
      pg_catalog.jsonb_typeof(v_mut->'completed') is distinct from 'boolean' or
      pg_catalog.jsonb_typeof(v_mut->'expected_revision') is distinct from 'number' or
      (v_mut->>'expected_revision') !~ '^(0|[1-9][0-9]*)$' then
      raise exception 'invalid mutation' using errcode='22023';
    end if;
    if (v_mut->>'expected_revision')::numeric>2147483647 then raise exception 'revision overflow' using errcode='22003'; end if;
  end loop;
  if (select pg_catalog.count(distinct value->>'shrine_id') from pg_catalog.jsonb_array_elements(p_mutations)) <> pg_catalog.jsonb_array_length(p_mutations) then
    raise exception 'duplicate shrine' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':' || p_game_id,0));
  select * into v_old from private.progress_receipts r where r.user_id=v_uid and r.game_id=p_game_id and r.request_id=p_request_id;
  if found then
    if v_old.payload<>p_mutations then raise exception 'idempotency payload mismatch' using errcode='22023'; end if;
    return v_old.result;
  end if;
  for v_mut in select value from pg_catalog.jsonb_array_elements(p_mutations) loop
    select * into v_current from private.shrine_progress p where p.user_id=v_uid and p.game_id=p_game_id and p.shrine_id=v_mut->>'shrine_id';
    v_revision := coalesce(v_current.revision,0);
    if v_revision<>(v_mut->>'expected_revision')::integer then
      v_conflicts := v_conflicts || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('shrine_id',v_mut->>'shrine_id','expected_revision',(v_mut->>'expected_revision')::integer,
        'current',pg_catalog.jsonb_build_object('shrine_id',v_mut->>'shrine_id','completed',coalesce(v_current.completed,false),'revision',v_revision,'updated_at',coalesce(pg_catalog.to_jsonb(v_current.updated_at),'""'::jsonb))));
    elsif v_revision=2147483647 then raise exception 'revision overflow' using errcode='22003'; end if;
  end loop;
  if pg_catalog.jsonb_array_length(v_conflicts)>0 then
    v_result := pg_catalog.jsonb_build_object('status','conflict','request_id',p_request_id,'conflicts',v_conflicts);
  else
    for v_mut in select value from pg_catalog.jsonb_array_elements(p_mutations) loop
      insert into private.shrine_progress as p(user_id,game_id,shrine_id,completed,revision,updated_at)
      values(v_uid,p_game_id,v_mut->>'shrine_id',(v_mut->>'completed')::boolean,1,pg_catalog.now())
      on conflict(user_id,game_id,shrine_id) do update set completed=excluded.completed,revision=p.revision+1,updated_at=excluded.updated_at
      where p.user_id=v_uid and p.game_id=p_game_id
      returning * into v_current;
      v_rows := v_rows || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('shrine_id',v_current.shrine_id,'completed',v_current.completed,'revision',v_current.revision,'updated_at',v_current.updated_at));
    end loop;
    v_result := pg_catalog.jsonb_build_object('status','applied','request_id',p_request_id,'rows',v_rows);
  end if;
  insert into private.progress_receipts(user_id,game_id,request_id,payload,result) values(v_uid,p_game_id,p_request_id,p_mutations,v_result);
  return v_result;
end $$;
revoke all on function public.get_shrine_progress(text) from public,anon,authenticated;
revoke all on function public.apply_shrine_progress(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.get_shrine_progress(text) to authenticated;
grant execute on function public.apply_shrine_progress(text,uuid,jsonb) to authenticated;

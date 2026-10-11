-- Read-only deployment check. Run in the project's SQL Editor.
-- This query does not read user IDs, shrine records, authentication users, or secrets.
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_read,
       has_table_privilege('authenticated', c.oid, 'select') as authenticated_read,
       has_table_privilege('authenticated', c.oid, 'insert') as authenticated_insert,
       has_table_privilege('authenticated', c.oid, 'update') as authenticated_update,
       has_table_privilege('authenticated', c.oid, 'delete') as authenticated_delete
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'private' and c.relname in ('shrine_progress', 'progress_receipts')
order by c.relname;

select p.proname,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig,
       has_function_privilege('anon', p.oid, 'execute') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('get_shrine_progress', 'apply_shrine_progress')
order by p.proname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'private' and tablename in ('shrine_progress', 'progress_receipts')
order by tablename, policyname;

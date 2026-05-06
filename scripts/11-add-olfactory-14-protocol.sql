-- Migration: Add sat_v3_14 protocol support
-- Run this after 10-olfactory-runtime-toggle.sql

-- 1. Drop the old check constraint and replace it with one that includes sat_v3_14
alter table public.olfactory_runtime_settings
  drop constraint if exists olfactory_runtime_protocol_check;

alter table public.olfactory_runtime_settings
  add constraint olfactory_runtime_protocol_check
  check (active_protocol in ('temp_v1', 'sat_v2', 'sat_v3_14'));

-- 2. Ensure the singleton row exists (idempotent)
insert into public.olfactory_runtime_settings (active_protocol)
select 'sat_v3_14'
where not exists (select 1 from public.olfactory_runtime_settings);

-- 3. Activate 14-item protocol (comment out if you want to keep current setting)
update public.olfactory_runtime_settings
  set active_protocol = 'sat_v3_14', updated_at = now();

-- Switch commands (no redeploy required):
-- update public.olfactory_runtime_settings set active_protocol = 'sat_v3_14', updated_at = now();
-- update public.olfactory_runtime_settings set active_protocol = 'sat_v2',    updated_at = now();
-- update public.olfactory_runtime_settings set active_protocol = 'temp_v1',   updated_at = now();

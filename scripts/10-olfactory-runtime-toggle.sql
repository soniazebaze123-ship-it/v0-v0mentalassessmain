-- Runtime toggle for temporary olfactory protocol (no redeploy switch)

alter table if exists public.olfactory_temp_tests
  add column if not exists protocol_version text not null default 'temp_v1',
  add column if not exists item_set_version text not null default 'temp_v1_items_8',
  add column if not exists scoring_version text not null default 'temp_v1_scoring';

create table if not exists public.olfactory_runtime_settings (
  id uuid primary key default gen_random_uuid(),
  active_protocol text not null default 'temp_v1',
  updated_at timestamptz not null default now(),
  constraint olfactory_runtime_protocol_check check (active_protocol in ('temp_v1', 'sat_v2'))
);

create unique index if not exists idx_olfactory_runtime_singleton on public.olfactory_runtime_settings ((true));

insert into public.olfactory_runtime_settings (active_protocol)
select 'temp_v1'
where not exists (select 1 from public.olfactory_runtime_settings);

-- Saturday switch command (no redeploy required):
-- update public.olfactory_runtime_settings set active_protocol = 'sat_v2', updated_at = now();

-- Rollback command:
-- update public.olfactory_runtime_settings set active_protocol = 'temp_v1', updated_at = now();

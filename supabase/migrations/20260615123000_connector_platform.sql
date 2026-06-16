create table if not exists public.tenant_connectors (
  tenant_id text not null,
  connector_id text not null,
  status text not null,
  account_label text not null,
  scopes jsonb not null default '[]'::jsonb,
  last_sync_at timestamptz,
  freshness_minutes integer,
  sync_cursor text,
  setup_instructions jsonb not null default '[]'::jsonb,
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, connector_id)
);

create table if not exists public.connector_auth_sessions (
  id uuid primary key,
  tenant_id text not null,
  connector_id text not null,
  auth_url text not null,
  redirect_uri text not null,
  state text not null,
  code_verifier text,
  created_at timestamptz not null,
  expires_at timestamptz not null
);

create table if not exists public.connector_credentials (
  tenant_id text not null,
  connector_id text not null,
  access_token text not null,
  refresh_token text,
  instance_url text,
  scopes jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, connector_id)
);

create table if not exists public.connector_sync_jobs (
  id uuid primary key,
  tenant_id text not null,
  connector_id text not null,
  mode text not null,
  status text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  records_processed integer,
  checkpoint text,
  message text
);

create table if not exists public.agent_mcp_registrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  server_name text not null,
  base_url text not null,
  transport text not null default 'streamable_http',
  bearer_token_hint text,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenant_connectors_touch_updated_at on public.tenant_connectors;
create trigger tenant_connectors_touch_updated_at
before update on public.tenant_connectors
for each row execute function public.touch_updated_at();

drop trigger if exists connector_credentials_touch_updated_at on public.connector_credentials;
create trigger connector_credentials_touch_updated_at
before update on public.connector_credentials
for each row execute function public.touch_updated_at();

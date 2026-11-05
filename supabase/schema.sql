-- Quote Rescue: initial secure multi-tenant schema (Supabase PostgreSQL)
-- Run in Supabase SQL Editor after creating a project.
-- No public anonymous access. Every row is owned by auth.uid().
create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  contact_email text,
  created_at timestamptz not null default now(),
  unique(owner_id),
  unique(id, owner_id)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  company text not null default '',
  customer_email text not null default '',
  phone text not null default '',
  description text not null check (char_length(description) between 1 and 240),
  amount numeric(12,2) not null default 0 check(amount >= 0 and amount <= 100000000),
  status text not null default 'draft' check(status in ('draft','sent','discussion','won','lost')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  followups_sent integer not null default 0 check(followups_sent >= 0),
  note text not null default '',
  constraint quotes_business_owner_fk foreign key (business_id,owner_id)
    references public.businesses(id,owner_id) on delete cascade
);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null,
  event_type text not null check(event_type in ('created','updated','followup_drafted','followup_sent','reply_recorded','won','lost','snoozed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint quote_events_quote_owner_fk foreign key (quote_id,owner_id)
    references public.quotes(id,owner_id) on delete cascade
);

-- Needed for composite ownership FK.
create unique index if not exists quotes_id_owner_unique on public.quotes(id,owner_id);
create index if not exists quotes_owner_due_idx on public.quotes(owner_id,next_followup_at);
create index if not exists quote_events_owner_quote_idx on public.quote_events(owner_id,quote_id,created_at);

alter table public.businesses enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_events enable row level security;
alter table public.businesses force row level security;
alter table public.quotes force row level security;
alter table public.quote_events force row level security;

-- RLS ownership checks apply to SELECT/INSERT/UPDATE/DELETE.
drop policy if exists business_owner_all on public.businesses;
create policy business_owner_all on public.businesses for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists quotes_owner_all on public.quotes;
create policy quotes_owner_all on public.quotes for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists events_owner_all on public.quote_events;
create policy events_owner_all on public.quote_events for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

revoke all on public.businesses,public.quotes,public.quote_events from anon;
grant select,insert,update,delete on public.businesses,public.quotes,public.quote_events to authenticated;
-- Note: service_role bypasses RLS. Never expose service_role keys to browsers.

-- Shapeless PWA — real backend for the previously in-memory state.
-- No auth yet (see HANDOFF.md item 3), so RLS here is intentionally open:
-- anyone can read/insert/update, matching the current "anyone can act as
-- if they're the Captain" reality of the prototype. Tighten these once
-- Supabase Auth is wired in.

create table if not exists shapeless_seeds (
  id text primary key,
  text text not null,
  theme text not null,
  step text default '',
  doers int default 0,
  threshold int default 8,
  promoted boolean default false,
  energy int default 1,
  created_at timestamptz default now()
);

create table if not exists shapeless_voyages (
  id text primary key,
  name text not null,
  scale text default 'hub',
  size_note text default '',
  pitch text not null,
  theme text,
  captain text default 'You',
  co_captains jsonb default '[]',
  from_seed boolean default false,
  roles jsonb default '[]',
  timeline jsonb default '[]',
  comments jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists shapeless_messages (
  id bigint generated always as identity primary key,
  channel text not null,
  who text default 'You',
  init text default 'Y',
  text text not null,
  created_at timestamptz default now()
);

create table if not exists shapeless_retreat_rsvps (
  id bigint generated always as identity primary key,
  date_iso text not null,
  name text default 'You',
  created_at timestamptz default now()
);

create table if not exists shapeless_join_submissions (
  id bigint generated always as identity primary key,
  door text not null,
  name text not null,
  contact text default '',
  message text default '',
  created_at timestamptz default now()
);

alter table shapeless_seeds enable row level security;
alter table shapeless_voyages enable row level security;
alter table shapeless_messages enable row level security;
alter table shapeless_retreat_rsvps enable row level security;
alter table shapeless_join_submissions enable row level security;

create policy shapeless_seeds_all on shapeless_seeds for all using (true) with check (true);
create policy shapeless_voyages_all on shapeless_voyages for all using (true) with check (true);
create policy shapeless_messages_all on shapeless_messages for all using (true) with check (true);
create policy shapeless_rsvps_all on shapeless_retreat_rsvps for all using (true) with check (true);
create policy shapeless_join_all on shapeless_join_submissions for all using (true) with check (true);

-- Shapeless v2 — real Google auth (same Supabase project/provider as world/1973)
-- and per-row author identity, replacing the hardcoded "You".

create table if not exists shapeless_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  picture text,
  created_at timestamptz default now()
);
alter table shapeless_profiles enable row level security;
drop policy if exists shapeless_profiles_read on shapeless_profiles;
drop policy if exists shapeless_profiles_own on shapeless_profiles;
create policy shapeless_profiles_read on shapeless_profiles for select using (true);
create policy shapeless_profiles_own on shapeless_profiles for insert with check (auth.uid() = id);
create policy shapeless_profiles_own_update on shapeless_profiles for update using (auth.uid() = id);

alter table shapeless_seeds add column if not exists author_id uuid references auth.users(id);
alter table shapeless_voyages add column if not exists author_id uuid references auth.users(id);
alter table shapeless_messages add column if not exists author_id uuid references auth.users(id);
alter table shapeless_retreat_rsvps add column if not exists author_id uuid references auth.users(id);
alter table shapeless_join_submissions add column if not exists author_id uuid references auth.users(id);

-- Tighten: reads stay public (browsing the movement needs no login), but
-- every write now requires a signed-in user. Existing bootstrapped rows keep
-- author_id = null, which is fine — they just aren't attributable.
drop policy if exists shapeless_seeds_all on shapeless_seeds;
create policy shapeless_seeds_read on shapeless_seeds for select using (true);
create policy shapeless_seeds_write on shapeless_seeds for insert with check (auth.role() = 'authenticated');
create policy shapeless_seeds_update on shapeless_seeds for update using (auth.role() = 'authenticated');

drop policy if exists shapeless_voyages_all on shapeless_voyages;
create policy shapeless_voyages_read on shapeless_voyages for select using (true);
create policy shapeless_voyages_write on shapeless_voyages for insert with check (auth.role() = 'authenticated');
create policy shapeless_voyages_update on shapeless_voyages for update using (auth.role() = 'authenticated');

drop policy if exists shapeless_messages_all on shapeless_messages;
create policy shapeless_messages_read on shapeless_messages for select using (true);
create policy shapeless_messages_write on shapeless_messages for insert with check (auth.role() = 'authenticated');

drop policy if exists shapeless_rsvps_all on shapeless_retreat_rsvps;
create policy shapeless_rsvps_read on shapeless_retreat_rsvps for select using (true);
create policy shapeless_rsvps_write on shapeless_retreat_rsvps for insert with check (auth.role() = 'authenticated');

drop policy if exists shapeless_join_all on shapeless_join_submissions;
create policy shapeless_join_read on shapeless_join_submissions for select using (auth.role() = 'authenticated');
create policy shapeless_join_write on shapeless_join_submissions for insert with check (auth.role() = 'authenticated');

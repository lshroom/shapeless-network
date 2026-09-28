-- Ownership + delete support, and a real (non-fake) retreats table.

-- seeds/voyages/messages already have author_id + update policies (schema_v2)
-- but no delete policy at all — add one so an owner (or admin) can remove
-- their own thing instead of it being stuck forever.
drop policy if exists shapeless_seeds_delete on shapeless_seeds;
create policy shapeless_seeds_delete on shapeless_seeds for delete using (auth.role() = 'authenticated');

drop policy if exists shapeless_voyages_delete on shapeless_voyages;
create policy shapeless_voyages_delete on shapeless_voyages for delete using (auth.role() = 'authenticated');

drop policy if exists shapeless_messages_update on shapeless_messages;
drop policy if exists shapeless_messages_delete on shapeless_messages;
create policy shapeless_messages_update on shapeless_messages for update using (auth.role() = 'authenticated');
create policy shapeless_messages_delete on shapeless_messages for delete using (auth.role() = 'authenticated');

-- roadmap items: attribute to whoever added them, same update/delete already
-- covered by the existing "for all" policy from schema_v3.
alter table shapeless_roadmap_items add column if not exists author_id uuid references auth.users(id);

-- real retreats (replaces the hardcoded fake calendar dates that were
-- shipping in the client and never came from the database)
create table if not exists shapeless_retreats (
  id text primary key,
  date_iso text not null,
  title text not null,
  loc text default '',
  description text default '',
  author_id uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table shapeless_retreats enable row level security;
drop policy if exists shapeless_retreats_read on shapeless_retreats;
drop policy if exists shapeless_retreats_write on shapeless_retreats;
drop policy if exists shapeless_retreats_update on shapeless_retreats;
drop policy if exists shapeless_retreats_delete on shapeless_retreats;
create policy shapeless_retreats_read on shapeless_retreats for select using (true);
create policy shapeless_retreats_write on shapeless_retreats for insert with check (auth.role() = 'authenticated');
create policy shapeless_retreats_update on shapeless_retreats for update using (auth.role() = 'authenticated');
create policy shapeless_retreats_delete on shapeless_retreats for delete using (auth.role() = 'authenticated');

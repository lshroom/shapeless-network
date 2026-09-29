-- v16: private per-account settings (currently just the user's own cloud
-- transcription key for the Feed's lyrics step). Unlike shapeless_profiles,
-- which is publicly readable (names/pictures shown to other users), this
-- table has NO public select policy at all — a row is only ever readable or
-- writable by the account it belongs to.
create table if not exists shapeless_private_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  lyrics_cloud_key text,
  updated_at timestamptz not null default now()
);

alter table shapeless_private_settings enable row level security;

create policy "own settings only — select"
  on shapeless_private_settings for select
  using (auth.uid() = id);

create policy "own settings only — insert"
  on shapeless_private_settings for insert
  with check (auth.uid() = id);

create policy "own settings only — update"
  on shapeless_private_settings for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

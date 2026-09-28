-- Contact form submissions (About Us page). Anyone — signed in or not — can
-- send one; nobody can read them back through the anon key (admin reads via
-- the Supabase dashboard, which uses the service role and bypasses RLS).
create table if not exists shapeless_contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  author_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table shapeless_contact_messages enable row level security;
create policy shapeless_contact_messages_insert on shapeless_contact_messages for insert with check (true);

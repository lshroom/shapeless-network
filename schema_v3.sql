-- Shapeless v3 — real backend for the in-place content editor and the
-- Roadmap board (both were still just JS variables in index.html).

create table if not exists shapeless_page_content (
  key text primary key,
  text text,
  color text,
  font_size int,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);
alter table shapeless_page_content enable row level security;
drop policy if exists shapeless_page_content_read on shapeless_page_content;
drop policy if exists shapeless_page_content_write on shapeless_page_content;
create policy shapeless_page_content_read on shapeless_page_content for select using (true);
create policy shapeless_page_content_write on shapeless_page_content for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists shapeless_roadmap_items (
  id text primary key,
  col text not null,
  title text not null,
  description text default '',
  tags jsonb default '[]',
  sort_order int default 0
);
alter table shapeless_roadmap_items enable row level security;
drop policy if exists shapeless_roadmap_read on shapeless_roadmap_items;
drop policy if exists shapeless_roadmap_write on shapeless_roadmap_items;
create policy shapeless_roadmap_read on shapeless_roadmap_items for select using (true);
create policy shapeless_roadmap_write on shapeless_roadmap_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

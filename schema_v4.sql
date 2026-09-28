create table if not exists shapeless_box_layout (
  key text primary key,
  width int,
  min_height int,
  parent_key text,
  sort_order int default 0,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);
alter table shapeless_box_layout enable row level security;
drop policy if exists shapeless_box_layout_read on shapeless_box_layout;
drop policy if exists shapeless_box_layout_write on shapeless_box_layout;
create policy shapeless_box_layout_read on shapeless_box_layout for select using (true);
create policy shapeless_box_layout_write on shapeless_box_layout for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

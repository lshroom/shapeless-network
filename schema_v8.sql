-- v8: seed lifecycle redesign (3=seed, 6=voyage, 9=on the calendar)
alter table shapeless_seeds add column if not exists description text;
alter table shapeless_seeds add column if not exists roles jsonb default '[]'::jsonb;
alter table shapeless_seeds add column if not exists comments jsonb default '[]'::jsonb;

-- hub (in-person at the house) vs virtual (online) calendar entries
alter table shapeless_retreats add column if not exists is_virtual boolean default false;

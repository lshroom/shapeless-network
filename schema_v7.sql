-- Links a real Calendar entry to the voyage it's for, so Build and Calendar
-- are one continuous thread instead of two disconnected lists.
alter table shapeless_retreats add column if not exists voyage_id text references shapeless_voyages(id) on delete set null;

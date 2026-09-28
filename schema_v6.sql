-- Calendar can now span multiple days and optionally name which room/track
-- an entry belongs to (a single day can branch into several rooms/projects
-- running in parallel; a retreat can run 1-3+ days).
alter table shapeless_retreats add column if not exists end_date_iso text;
alter table shapeless_retreats add column if not exists room text;

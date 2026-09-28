-- v13: seeds/voyages become classifieds for any kind of collaborative work
-- (music, visual art, film, writing, other), not just generic ideas — plus a
-- reference media attachment (a demo recording, a reference image, etc.)
-- carried from seed into voyage on promotion. Also gives voyages a shared
-- music studio: a loop-based timeline of tracks the crew builds together.
alter table shapeless_seeds add column if not exists kind text default 'general';
alter table shapeless_seeds add column if not exists media jsonb default null;

alter table shapeless_voyages add column if not exists kind text default 'general';
alter table shapeless_voyages add column if not exists media jsonb default null;
-- studio shape: { bars: 16, tracks: [{ id, owner, name, role, url, kind, color, muted, solo, effects: [] }] }
alter table shapeless_voyages add column if not exists studio jsonb default null;

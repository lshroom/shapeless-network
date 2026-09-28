-- v11: public profile — bio, links, showcase media.
alter table shapeless_profiles add column if not exists bio text default null;
alter table shapeless_profiles add column if not exists links jsonb default '[]'::jsonb;
-- links shape: [{ label, url }]
alter table shapeless_profiles add column if not exists showcase jsonb default '[]'::jsonb;
-- showcase shape: [{ url, kind, name }]

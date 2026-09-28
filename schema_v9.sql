-- v9: location type (hub / virtual / outdoors) replaces scale on voyages,
-- and is_virtual boolean on retreats, with the same three values on seeds too.
alter table shapeless_seeds add column if not exists location_type text default 'hub';
alter table shapeless_voyages add column if not exists location_type text default 'hub';

alter table shapeless_retreats add column if not exists location_type text default 'hub';
update shapeless_retreats set location_type = case when is_virtual then 'virtual' else 'hub' end where location_type is null or location_type = 'hub';
alter table shapeless_retreats drop column if exists is_virtual;

alter table shapeless_voyages drop column if exists scale;

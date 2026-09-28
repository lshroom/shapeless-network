-- v10: date polls on voyages, media attachments on comments.
alter table shapeless_voyages add column if not exists date_poll jsonb default null;
-- date_poll shape: { options: [{ id, date_iso, label }], votes: { [voterId]: optionId }, closed: bool }

-- v12: Join submissions become a browsable directory — split contact into
-- email + phone, and open read access so anyone (signed in or not) can browse
-- who's available to collaborate, without going through the founder first.
alter table shapeless_join_submissions add column if not exists email text default '';
alter table shapeless_join_submissions add column if not exists phone text default '';

drop policy if exists shapeless_join_read on shapeless_join_submissions;
create policy shapeless_join_read on shapeless_join_submissions for select using (true);

alter table shapeless_join_submissions add column if not exists listed boolean default true;

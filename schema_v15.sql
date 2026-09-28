-- Stem-splitter tunnel config, per account — lets someone's own PC (running
-- tools/stem_server.py + a Cloudflare Tunnel) be reachable from any device
-- they're signed into, not just localhost on that same machine.
--
-- stem_server_url already exists live in Supabase (added directly, without a
-- tracked migration — this file formalizes it so a fresh project can be set
-- up from schema files alone). stem_server_token is new: the access token
-- stem_server.py prints on startup, required for any request that isn't
-- from 127.0.0.1 once the server is reachable through a tunnel.
alter table shapeless_profiles add column if not exists stem_server_url text;
alter table shapeless_profiles add column if not exists stem_server_token text;

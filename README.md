# Shapeless

A human mycelium network — people who've decided the future isn't something politicians
deliver, it's something we build, in the open, together.

Shapeless is a PWA: plant a future you want to see (Imagine), back the ideas that matter to
you, watch backed ideas turn into real projects you can crew on (Build), and gather in person
or online (Retreats). Real Google sign-in, real persistence, real-time sync — see
[`HANDOFF.md`](./HANDOFF.md) for the full technical writeup.

## Running it locally

No build step — it's one `index.html` plus a couple of static assets.

```
node server.cjs
# then open http://localhost:1974
```

(Don't just double-click `index.html` — the service worker and `<video>` tags need `http://`,
not `file://`.)

## Backend

Supabase (Postgres + Auth + Realtime). Schema lives in `schema.sql` / `schema_v2.sql` /
`schema_v3.sql` (applied in that order). `data.js` is the whole client — a thin fetch-based
REST layer plus `supabase-js` for auth/session/realtime, no build tooling required.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Issues are tagged by skill (`coders`, `musicians`,
`experts`) — grab whatever fits.

## License

MIT — see [`LICENSE`](./LICENSE).

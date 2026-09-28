# Working on Shapeless

Context for any AI assistant (Claude or otherwise) helping with this repo.

## What this is

A single-page PWA, no build step. `index.html` is the entire app (HTML/CSS/JS inline).
`data.js` is the backend client — fetch-based REST + `supabase-js`, talking to Supabase
(Postgres + Auth + Realtime). `server.cjs` is a tiny local static server for dev, nothing more.

Deployment to shapelessworld.org happens separately, outside this repo, by a maintainer.
Merging a PR here never pushes anything live by itself — see `CONTRIBUTING.md`.

## Do-not-touch, without discussing it first in the PR

- Don't introduce a build step (bundler, transpiler, framework migration). If that's ever worth
  doing it's a deliberate, coordinated move (see `HANDOFF.md`), not a drive-by change.
- Don't edit `schema.sql` or any existing `schema_vN.sql` — they're applied history. A new
  migration is a new `schema_v(N+1).sql` file.
- Don't rename or restructure `data.js`'s public shape (`window.SB.*`) without flagging it —
  `index.html` calls it by name all over the place.
- Don't touch the Supabase URL/anon key in `data.js` — the anon key is meant to be public
  (protected by row-level security), it's not a secret to "fix".

## Before opening a PR

- Run the app locally (`node server.cjs`) and click through whatever you changed — there's no
  test suite, so this is the check.
- If you touched `index.html`'s inline `<script>`, syntax-check it (see `.githooks/` — the
  pre-commit hook does this automatically once you run `git config core.hooksPath .githooks`).
- Small, focused diffs. One concern per PR.

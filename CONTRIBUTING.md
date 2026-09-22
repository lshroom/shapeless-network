# Contributing to Shapeless

Thanks for wanting to help build this. A few ground rules before you dive in.

## Getting set up

1. Clone the repo.
2. `node server.cjs` and open `http://localhost:1974`.
3. That's it — no build step, no npm install. `index.html` is the whole app; `data.js` is the
   backend client. See `HANDOFF.md` for the full architecture writeup before making structural
   changes.

## Finding something to work on

Issues are tagged by skill:
- `coders` — app/backend work
- `musicians` — the retreats/community music side
- `experts` — content, panels, outreach

Grab anything untagged-as-claimed and comment that you're on it.

## Making a change

- Keep the "no build step" property unless you're doing the framework migration tracked in
  `HANDOFF.md` #1 — that's a deliberate, coordinated move, not a drive-by PR.
- If you touch `index.html`'s inline `<script>`, run it through `node --check` before opening a
  PR (extract it, no linter/build wired up yet).
- If you touch `data.js` or add a new Supabase table, add the DDL to a new `schema_vN.sql` file
  (don't edit the old ones — they're the applied history) and mention it in your PR description
  so it gets run against the project.
- Small, focused PRs over big ones — this is a volunteer project, small diffs get reviewed
  faster.

## Code of conduct

Be kind. This project exists because people decided to build the future together instead of
waiting for someone else to hand it to them — that spirit extends to how we treat each other in
issues and PRs.

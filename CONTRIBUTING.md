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

## How this connects to the live site

This repo is the source of truth for the code, but it does **not** auto-deploy to
shapelessworld.org. Nothing you push or merge here reaches real users by itself — changes get
pulled into a separate working copy, tested, and deployed by a maintainer. That's deliberate: it
means a bad PR can be merged and reverted here without ever touching production, and the live
site only moves when someone with deploy access decides it should.

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

## Opening and merging a PR

- `master` is protected — nobody, including maintainers, can push straight to it. Every change
  goes through a pull request.
- Every PR needs at least one approving review before it can merge, and pushing new commits to
  a PR clears any existing approval (so a review always reflects what's actually about to merge).
- Force-pushes and branch deletion are blocked on `master` — history there is permanent.
- If you don't have write access yet, fork the repo, push your branch there, and open the PR
  from your fork — same process either way.

## Code of conduct

Be kind. This project exists because people decided to build the future together instead of
waiting for someone else to hand it to them — that spirit extends to how we treat each other in
issues and PRs.

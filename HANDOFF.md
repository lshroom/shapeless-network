# Shapeless — handoff to Claude Code

Read this whole file before touching code. It's the single source of truth for what this
project currently is, how it's built, what's fake vs. real, and what's left to do. It replaces
an older, now-stale version of this same file.

## 30-second summary

Shapeless is a pirate/neon-themed PWA for a social movement — "imagine a shared future, then
build it together." It is currently a **single self-contained `index.html`** (vanilla JS, no
build step, no framework) plus a handful of static assets. Every feature you can click through
is real UI, but **all state lives in in-memory JavaScript variables** — nothing persists, nothing
syncs between users or devices, there is no auth and no backend. Refreshing the page resets
everything to the hardcoded seed data.

The prototype was built and iterated entirely inside a claude.ai Artifact (a sandboxed published
web page), which is why some of the file layout and code choices below look the way they do —
those constraints mostly go away once this lives in a normal repo, but a few (noted below) matter
for how the code is written and should stay in mind if you keep working this way.

## How to run it locally

There's no build step. The only wrinkle: **do not just double-click `index.html`** — the service
worker registration and the `<video>` tags behave better over `http://`, not `file://`. From this
folder:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

All five files/folders must sit next to each other exactly as shipped in this bundle:
`index.html`, `manifest.json`, `sw.js`, `icon.svg`, `three.min.js`, `logo-mark.mp4`,
`hero-loop.mp4`. `index.html` references the video and script files by bare relative filename
(`<script src="three.min.js">`, `<video src="hero-loop.mp4">`, etc.) — if you reorganize into an
`assets/` subfolder or similar, update those `src`/`href` attributes to match, and update
`sw.js`'s `SHELL` array too.

## Architecture

- **One HTML file** (`index.html`, ~120KB) containing all markup, a large `<style>` block, and a
  single `<script>` IIFE with all app logic. No React/Vue, no npm, no bundler. This was a
  deliberate choice for the prototype phase (fast iteration inside the Artifact tool) — not
  necessarily the right call for the next phase (see "What needs to become real" below).
- **Three.js r128** is vendored locally as `three.min.js` (loaded via `<script src="three.min.js">`
  in `<head>`, so `THREE` is a global). It is **not** loaded from a CDN. This was a hard
  requirement discovered the hard way: a published claude.ai Artifact silently refuses to load
  scripts from `cdnjs.cloudflare.com` or any other CDN — only a same-origin/relative script tag
  works. If you move this to a real host you are free to load Three.js from a CDN or npm instead,
  but there's no strong reason to — the vendored copy works fine and avoids a dependency on
  network availability.
- **PWA shell**: `manifest.json` + `sw.js` + `icon.svg`. The service worker is deliberately
  **network-first** (tries the network, falls back to cache only when offline) — see "Gotchas"
  below for why that matters and what breaks if you change it back to cache-first.
- **No routing** — the five "pages" (Home / Imagine / Build / Retreats / Join) are `<section>`
  elements toggled with a `.active` class and an `app.goto(view)` call; there's no URL/history
  integration at all (no back button support, no deep links, no `#imagine` in the address bar).

## What's on each screen (current, accurate as of this handoff)

### Home
Hero with a looping background video (`hero-loop.mp4`, pirate-skeleton-DJ footage,
`brightness(0.735) saturate(1.3) contrast(1.08)` filter tuned for text legibility — see git-blame-
style notes in "Gotchas" if you're tempted to bump the brightness again), manifesto copy, live
stat counters (seed count / voyage count / retreat count, all computed from in-memory arrays), and
three "asks" cards (coders / musicians / experts).

### Imagine — the centerpiece
A **real 3D scene** (not a 2D canvas) built with Three.js:
- 7 theme anchors (Technology, Economy, Security, Wellbeing, Community, Ecology, Bridges) placed
  on a Fibonacci sphere around a pulsing core, connected by spokes.
- Each planted "seed" (a short future-statement) is an icosahedron mesh + additive-blended glow
  sprite, positioned near its theme's anchor, sized/brightened by how much "energy" (✦ backing)
  it has.
- **Free-fly camera**: drag (mouse or one finger) to look around; scroll wheel (desktop) or
  two-finger pinch (touch) flies forward/backward along the view direction; on-screen ▲/▼/⟲
  buttons as a fallback; WASD/arrow keys also work on desktop. Tapping a seed node backs it
  (+1 energy) — implemented via raycasting, not DOM hit-testing.
- **Plant a seed**: a form (left column on desktop, top of the stack on mobile) where anyone can
  write a future-statement, an optional first concrete step, pick a theme, and — new — **set their
  own "backing needed to become a project" threshold** (a number input, default 8, user's choice,
  can be anywhere from ~3 to the hundreds/thousands). This reflects the intended governance model:
  whoever plants an idea is the one who judges how big a lift it actually is. There is **no** more
  global fixed threshold constant.
- **From idea to action**: a list of the top seeds by energy, each with an "I'll do this" commit
  button and (once its energy reaches its own threshold) a "Make it a project →" button that
  promotes it into a real Voyage (see Build) and jumps you there.
- **Theme chart**: a horizontal bar per theme showing total energy in that theme. Clicking a theme
  row (a) dims everything else in the 3D scene and seed list to just that theme, and (b) opens a
  panel right below the chart listing the actual Voyages tagged with that theme (or an empty-state
  message inviting you to back an idea or chart one directly). Clicking a project in that panel
  opens its full Voyage detail overlay.
- **Layout**: on desktop (≥900px), a two-column grid — the seed-planting form + seed list is the
  **left/primary** column, the theme chart + theme-projects panel + 3D canvas is the **right**
  column, explicitly treated as secondary/visual-aid, per the current design direction. On mobile
  it's a single stacked column in that same priority order (action content first).

### Build
Three sub-tabs:
- **Roadmap** — static Now/Next/Later kanban, hardcoded cards, no interactivity beyond display.
- **Voyages** (the "Projects" tab) — cards for real projects. Each Voyage has a Captain, a scale
  (`hub` = small crew, `humanity` = unbounded/global), a pitch, a set of roles (each either `open`
  — join instantly — or `approval` — Captain approves requests), a timeline of milestones you can
  add/toggle, and a comment thread. There's a "Chart a new voyage →" form to create one from
  scratch (you become Captain), and Voyages can also arrive automatically from a promoted seed
  (tagged "from Imagine"). Captain tools let you transfer captaincy or add a co-captain to anyone
  who's been approved into a role — currently unguarded (anyone can act as if they're the Captain
  from this browser tab; real access control needs auth, see below).
- **Community** — a Slack-style channel feed (#general/#coders/#musicians/#experts) with a
  composer. Posts only exist in this browser's memory; nothing syncs.
- Plus a static GitHub repo card (placeholder link).

### Retreats
A monthly calendar (click a date with a retreat to see its detail + RSVP), a weekly-call banner,
and an agenda list of all upcoming dates. RSVP just increments a local counter.

### Join
Three expandable "door" forms (Coder/Musician/Expert) that show a success toast but submit
nowhere (no backend), plus a generic weekly Zoom-call CTA.

## In-place content editing (the pencil icon, top right)

This is a content-editing layer bolted onto the prototype so the non-technical owner can tweak
copy, colors, and font sizes directly on the published page without asking Claude to redo it every
time. It is **not** meant to survive a real CMS/backend migration as-is, but it's worth
understanding before you touch anything, since a lot of the DOM has extra attributes because of it:

- Any element that should be editable has a `data-ck="someKey"` attribute. Its default text lives
  in the `#content-data` `<script type="application/json">` blob (`CONTENT` object, keyed by that
  same string); a `#color-data` and `#size-data` blob work the same way for per-field color (hex)
  and font-size (px) overrides.
- Clicking the pencil icon flips `editMode` on: every `[data-ck]` element becomes
  `contentEditable`, a bottom bar appears (Cancel / Save), and focusing any editable field pops up
  a small floating color-picker + A−/A+/Reset control positioned next to it.
- **Save** re-serializes `CONTENT`/`COLORS`/`SIZES` back into those three `<script>` blobs (so a
  reload of the *same saved page* keeps the edits) and, if running inside a claude.ai Artifact,
  calls `window.claude.use('artifact').publish(...)` to push the whole edited page back up as a
  new version. **That publish call will simply fail silently (falls back to a toast) once this is
  a normal static site** — if you want to keep "edit in place" as a real feature after migration,
  you need to build a real save endpoint (e.g. a Supabase table + an authenticated PATCH) instead
  of relying on that Artifact-specific API.
- Buttons that are also `[data-ck]` targets (nav labels, "Grow it →", etc.) have their `onclick`
  suppressed while `editMode` is true via a capture-phase click listener — otherwise clicking into
  the button to position a text cursor would also fire its normal navigation.

## Gotchas / non-obvious things (read before "fixing" something that looks like a bug)

1. **`[hidden]` vs. `display:` CSS conflicts.** Several toggleable elements (`.edit-bar`,
   `.ck-color-popover`, and now `.theme-voyages`) are shown/hidden via the `hidden` HTML attribute.
   If you give the base class rule an unconditional `display: flex` (or similar), it overrides the
   browser's built-in `[hidden] { display: none }` rule at equal specificity, and the element never
   actually hides. The fix pattern used throughout: remove `display` from the base rule, and add
   `.foo[hidden]{ display:none; } .foo:not([hidden]){ display:flex; }`. This bug has bitten this
   codebase twice already — check for it before adding any new hide/show toggle.
2. **Service worker is network-first on purpose.** `sw.js` tries the network first and only falls
   back to the cache when offline. It used to be cache-first, which meant once a phone had cached
   `index.html` once, **every future edit was invisible to that phone forever** (this is exactly
   what happened to the project owner mid-development). If you ever "fix" this back to cache-first
   for performance reasons, you need a real versioning/update-prompt strategy instead, or updates
   will silently stop reaching installed users again. `CACHE` is bumped (`v1` → `v2`) whenever the
   shell files change shape, which triggers `activate`'s cleanup of the old cache — bump it again
   if you change what's in `SHELL`.
3. **Video brightness has been tuned back and forth several times** (`brightness(0.5)` →
   `0.62` → `0.81` → `1.05` → the current `0.735`) chasing "brighter" vs. "I can't read the text
   anymore" feedback in different lighting/device conditions. If asked to touch this again, change
   it by a small delta and actually check hero text legibility against the video, don't just crank
   it.
4. **Three.js must stay same-origin/relative**, not a CDN URL — see Architecture above. This is an
   Artifact-tool-specific constraint; if you're now serving this from a normal static host or CDN,
   you're free to change this, but there's no need to.
5. **`extractEditableText()` exists because of `<br>` tags.** The hero `<h1>` has manual `<br>`
   line breaks; naive `.textContent` on save would merge adjacent lines with no space
   ("waiting"+"for" → "waitingfor"). If you add more multi-line editable headings, route their
   save-time text extraction through this helper too.
6. Random placeholder/example data (seed texts, Voyage names like "Revolution Cover Song",
   RSVP counts, "early adopters: 37 + n" pill) is all made up for demo purposes — replace with real
   content before anyone but the project owner sees this.

## What needs to become real (the actual work ahead)

### 1. Pick a real framework
This is currently one big HTML file because that's what iterating inside an Artifact allowed.
Moving to Next.js (App Router) on Vercel is a reasonable default — port each `<section>` to a
route or client component, keep the design tokens/CSS custom properties and the 3D scene as-is
(the Three.js code doesn't care what framework wraps it). This is the highest-leverage next step:
everything below is much easier once state isn't just JS variables in one file.

### 2. Supabase — data model
Suggested tables (add RLS policies before anything is public):

- `profiles` — id (auth uid), name, role_interest, created_at
- `seeds` — id, author_id, text, theme, step, energy, **threshold** (per-seed, user-set — this is
  new since the last version of this doc), promoted (bool), created_at
- `seed_energy` — seed_id, user_id, created_at (unique per seed+user, this is what "backing" an
  idea actually records — currently just an unguarded `energy += 1`)
- `voyages` — id, name, pitch, scale (hub/humanity), size_note, **theme** (new — used to link a
  Voyage back to the Imagine theme chart), captain_id, from_seed_id (nullable), created_at
- `voyage_roles` — id, voyage_id, name, slots (nullable = unlimited), mode (open/approval)
- `voyage_crew` — role_id, user_id, status (pending/approved)
- `voyage_milestones` — id, voyage_id, date, label, done
- `voyage_comments` — id, voyage_id, author_id, text, created_at
- `roadmap_items` — id, column, title, description, tags[], sort_order
- `channels` — id, slug, label
- `messages` — id, channel_id, author_id, text, created_at (wire to Supabase Realtime — this is
  what makes Community and, ideally, the Imagine seed list, update live across devices)
- `retreats` — id, date, title, location, description
- `retreat_rsvps` — retreat_id, user_id, created_at
- `join_submissions` — id, door, name, contact, message, created_at
- `page_content` — key, text, color, font_size (this replaces the `#content-data`/`#color-data`/
  `#size-data` JSON blobs — the in-place editor should write here instead of trying to re-publish
  the whole HTML file)

### 3. Auth
Supabase Auth (magic link or Google OAuth to start). Required before: seeds/energy/comments/RSVPs/
join-submissions are tied to a real identity instead of a hardcoded `"You"`, and before Captain
tools (transfer captaincy, approve crew) can actually be access-controlled — right now anyone
looking at a Voyage can act as its Captain.

### 4. Real-time
Supabase Realtime on `messages`, `seeds`/`seed_energy`, and `voyage_*` tables so Community, the
Imagine network, and Voyage detail pages actually update live across people/devices — right now
two browser tabs looking at this see two completely independent worlds.

### 5. PWA — finish the install experience
`manifest.json`/`sw.js`/`icon.svg` are functionally correct but were never provable end-to-end
inside a sandboxed Artifact. Once on a real HTTPS domain: verify installability in Chrome DevTools
→ Application → Manifest; add real PNG icons (192×192, 512×512, maskable) alongside the SVG; add
Web Push if the owner wants notifications for new retreat dates/replies (needs a push key +
Supabase Edge Function or similar — not built).

### 6. GitHub
Create the real public repo (`shapeless-network/core` is currently just a placeholder name/link in
the Build tab's GitHub card), push this codebase, add `CONTRIBUTING.md`, tag a few
good-first-issues. Update the in-app card to point at the real URL.

### 7. Known open decisions / gaps
- No moderation on Community channels or Imagine seeds (report/mute/delete, rate limiting) —
  needed before any public launch.
- No Hebrew/RTL yet — explicitly deferred by the project owner, but worth revisiting since the
  manifesto's authentic voice is Hebrew.
- Retreat RSVP has no capacity limit or waitlist.
- Join-form submissions currently go nowhere (just a toast) — decide whether they become an email
  notification, a Supabase table an admin reviews, or both.
- No admin/moderation UI for Roadmap or Voyages content (still hardcoded arrays in the JS) — once
  on Supabase this probably wants a lightweight internal admin view.
- The in-place visual editor (pencil icon) needs a real save path once the Artifact-specific
  `window.claude.use('artifact').publish()` call is gone — see the editing section above.

## Files in this handoff

- `index.html` — the whole app (open via a local server, see "How to run it locally")
- `manifest.json`, `sw.js`, `icon.svg` — PWA scaffolding, reusable as-is
- `three.min.js` — vendored Three.js r128, referenced by a relative `<script>` tag
- `logo-mark.mp4`, `hero-loop.mp4` — the two video assets (topbar logo loop, hero background)
- this file

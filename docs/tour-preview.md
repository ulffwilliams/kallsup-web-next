# Unannounced tour dates on a preview deploy

> **Status: the embargo is over.** The dates are announced and `git main` now
> reads the `tour-preview` Neon branch — see [Current wiring](#current-wiring).
> Everything from [What is already done](#what-is-already-done) down to
> [Safety](#safety) describes how the embargoed setup was built and is kept as
> history.

Winter 2026 tour dates needed to be visible to a handful of people without
reaching the live site. Approach: a **Neon database branch** holding the dates,
wired to a **single Vercel preview git branch**. Production database and
production deploy were never touched.

```
git main          ──►  Vercel Production  ──►  Neon `production`   (3 past gigs)
git tour-preview  ──►  Vercel Preview     ──►  Neon `tour-preview` (+ 6 new)
                       via a branch-scoped DATABASE_URL
```

The wiring was one Vercel environment variable scoped to one git branch.

## Current wiring

Rather than copying the six rows into the `production` branch, going live moved
the *pointer*: `git main` now reads `tour-preview`. The live site therefore
serves the branch that was built for the embargo.

```
git main  ──►  Vercel Production  ──►  Neon `tour-preview` (ep-purple-forest-agvtr1he)
                                       9 events, 6 upcoming — THE LIVE DATA

               Neon `production`  ──►  (ep-misty-dew-ag2gxjpf)
                                       3 past gigs, 0 upcoming — dormant
```

Consequences worth remembering:

- **`ep-purple-forest` is production data now.** The name says preview; the rows
  are what fans see. Treat any script pointed at it accordingly.
- **`ep-misty-dew` is dormant, not deleted.** It is still what
  `POSTGRES_URL`/`PGHOST` in a Vercel-pulled `.env.local` resolve to, and it is
  still the fallback for any deploy that does not get the branch-scoped
  override. Schema changes must land on **both** branches until one is retired
  — see [Schema changes](#schema-changes).
- `scripts/seed-tour-preview.mjs` still aborts on `ep-misty-dew-ag2gxjpf`. That
  guard now protects the *dormant* branch, which is the opposite of its original
  intent but harmless: the seed has already run where it was needed.

### Schema changes

A Neon branch inherits the schema it forks from, so the old rule was
"production first, then branch". With the pointer moved, neither branch is
upstream of the other in practice — both are live-ish and must be migrated
explicitly:

```sh
node scripts/<migration>.mjs                                   # DATABASE_URL -> tour-preview
TARGET_DATABASE_URL="$POSTGRES_URL" node scripts/<migration>.mjs  # -> production
```

`scripts/add-ticket-clicks-table.mjs` has been applied to both.

## What is already done

- `events.freeentry` added to the **production** Neon branch — additive,
  `NOT NULL DEFAULT false`, applied via `scripts/add-freeentry-column.mjs`.
  This had to land on production first: a Neon branch inherits the schema it
  forks from, and the app selects `freeentry` in every environment.
  **Superseded** — see `ticketreleasedate` below.
- `events.ticketreleasedate` (`DATE`, nullable) replaces it, applied via
  `scripts/add-ticketreleasedate-column.mjs`. Same production-first ordering,
  same reason. NULL means no on-sale date announced. The script does not drop
  `freeentry` unless run with `DROP_FREEENTRY=1`.
- `Gig` type and `SELECT_GIG` in `app/_lib/gigs.ts` carry `ticketreleasedate`
  plus a `ticketsreleased` boolean computed in SQL against
  `now() AT TIME ZONE 'Europe/Stockholm'`, so the on-sale cutoff does not drift
  by an hour on Vercel's UTC clock.
- `GigRow` CTA is three-way: released ticket link → `Biljetter`, else a future
  `ticketreleasedate` → `Biljetter släpps 12 sep`, else → `Biljetter snart`.
- `scripts/seed-tour-preview.mjs` holds the six dates and refuses to run
  against production (see Safety below). **Already run** against Neon branch
  `tour-preview` (endpoint `ep-purple-forest-agvtr1he`): 6 upcoming rows there,
  0 upcoming on production.

## Remaining steps

These need Neon and Vercel access, so they are manual.

### 1. Create the Neon branch

Neon console → project **`kallsup-web-db`** (Frankfurt) → Branches → New branch.

The console lists projects by display name; `fragrant-bird-30319122` is that
project's *ID*, visible under its Settings.

- Name: `tour-preview`
- Parent: the production branch (the one with endpoint `ep-misty-dew-ag2gxjpf`)

Branches are copy-on-write, so this is instant and costs almost nothing. Copy
the new branch's **pooled** connection string.

### 2. Seed the dates into the branch

```sh
TOUR_PREVIEW_DATABASE_URL="postgres://...tour-preview-pooler..." \
  node scripts/seed-tour-preview.mjs
```

It prints every row it wrote plus the resulting upcoming list — six rows, from
`2026-11-26 Stockholm` to `2026-12-31 Örebro`. Re-running is safe.

### 3. Push the git branch

```sh
git switch -c tour-preview
git push -u origin tour-preview
```

Vercel builds a preview deploy automatically. On this first build it still
reads the **production** database, so the new dates will not appear yet —
step 4 is what redirects it.

### 4. Scope a second `DATABASE_URL` to the branch

Vercel → project `kallsup-web-next` → Settings → Environment Variables → add:

- Key: `DATABASE_URL`
- Value: the `tour-preview` pooled connection string
- Environment: **Preview** only
- Git branch: **`tour-preview`** ← the important field. Without it the override
  applies to *every* preview branch.

Vercel permits the repeated key because the scopes differ, and the
branch-scoped value wins for builds of that branch. Leave the existing
unscoped `DATABASE_URL` alone — production keeps reading it.

Then redeploy the branch so the new value is picked up — env vars are read at
build/runtime of a given deployment, not applied retroactively.

### 5. Confirm the isolation

Load the preview URL: six upcoming shows, each showing `Biljetter snart`,
Örebro reading `TBA — Datum TBA`. Load the production URL: Kommande still
empty. If production shows the tour dates, the env var was not branch-scoped —
fix step 4 before sharing any link.

## Safety

`scripts/seed-tour-preview.mjs` will not touch production:

- it reads `TOUR_PREVIEW_DATABASE_URL` only, never falling back to
  `DATABASE_URL`;
- it aborts if the host contains `ep-misty-dew-ag2gxjpf`.

Both paths are verified to exit non-zero.

**The preview URL itself is not password protected** — this was a deliberate
choice. It relies on the URL staying unshared. Vercel does send
`X-Robots-Tag: noindex` on preview deployments, so crawlers should skip it, but
anyone who receives the link can open it. If the dates need to stay embargoed,
add Vercel Authentication (team members only, free) or a Basic Auth
`middleware.ts` gated on a preview-only env var.

## Going live — what actually happened

The plan below was *not* the route taken. It is left here because it is still
the route to a clean single-database setup.

> ~~When the tour is announced, run the same six inserts against production —
> easiest by pointing `TARGET`-style usage at prod deliberately, or by copying
> the `tourGigs` array into a one-off script without the guard. Set
> `ticketlink` at that point so rows render the `Biljetter` button instead of
> `Biljetter snart`, and give Örebro its real date. Then delete the Neon branch
> and the branch-scoped Vercel env var.~~

Instead, `git main` was pointed at the `tour-preview` branch and the rows were
given their real `ticketlink` values there. Faster, and it kept the six rows'
ids stable — which matters now that `ticket_clicks.gig_id` references them.

### Consolidating later

Two branches for one site is a standing cost: every migration runs twice, and
`.env.local` reads as though `POSTGRES_URL` were authoritative when it is not.
To collapse them, either:

- **Promote the data.** Copy `events` (and `ticket_clicks`) from
  `tour-preview` into `production`, repoint `main` at the unscoped
  `DATABASE_URL`, delete the branch. Preserve `events.id` — the click rows
  reference it.
- **Promote the branch.** Use Neon's "set as default" on `tour-preview` so it
  becomes the project's primary branch, then retire `ep-misty-dew`. Less data
  movement; the endpoint hostname in every `POSTGRES_*` var changes.

Either way, remove the branch-scoped Vercel env var last, once the unscoped
`DATABASE_URL` already points at the surviving branch.

## Unrelated finding

`.env.local` also defines a `KALLSUP_GIGS_*` set pointing at a different Neon
project (`lucky-hill-00076632`, endpoint `ep-shy-lake-agjyby1b`). It is not one
of the three projects in the Neon org, and its password no longer
authenticates. No code reads those variables. Dead integration — worth
removing from Vercel and `.env.local` so it stops looking like a second source
of truth for gigs.

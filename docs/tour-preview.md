# Unannounced tour dates on a preview deploy

Winter 2026 tour dates need to be visible to a handful of people without
reaching the live site. Approach: a **Neon database branch** holding the dates,
wired to a **single Vercel preview git branch**. Production database and
production deploy are never touched.

```
git main          ──►  Vercel Production  ──►  Neon `production`   (3 past gigs)
git tour-preview  ──►  Vercel Preview     ──►  Neon `tour-preview` (+ 6 new)
```

The wiring is one Vercel environment variable scoped to one git branch.

## What is already done

- `events.freeentry` added to the **production** Neon branch — additive,
  `NOT NULL DEFAULT false`, applied via `scripts/add-freeentry-column.mjs`.
  This had to land on production first: a Neon branch inherits the schema it
  forks from, and the app selects `freeentry` in every environment.
- `Gig` type and `SELECT_GIG` in `app/_lib/gigs.ts` carry `freeentry`.
- `GigRow` CTA is now three-way: ticket link → `Biljetter`, else `freeentry` →
  `Fritt inträde`, else → `Biljetter snart`. Previously a missing ticket link
  asserted free entry, which would have been wrong for all six tour rows.
- `scripts/seed-tour-preview.mjs` holds the six dates and refuses to run
  against production (see Safety below).

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

### 4. Point that branch's `DATABASE_URL` at the Neon branch

Vercel → project `kallsup-web-next` → Settings → Environment Variables → add:

- Key: `DATABASE_URL`
- Value: the `tour-preview` pooled connection string
- Environment: **Preview** only
- Git branch: **`tour-preview`** ← the important field. Without it the override
  applies to *every* preview branch.

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

## Going live

When the tour is announced, run the same six inserts against production —
easiest by pointing `TARGET`-style usage at prod deliberately, or by copying
the `tourGigs` array into a one-off script without the guard. Set
`ticketlink` at that point so rows render the `Biljetter` button instead of
`Biljetter snart`, and give Örebro its real date. Then delete the Neon branch
and the branch-scoped Vercel env var.

## Unrelated finding

`.env.local` also defines a `KALLSUP_GIGS_*` set pointing at a different Neon
project (`lucky-hill-00076632`, endpoint `ep-shy-lake-agjyby1b`). It is not one
of the three projects in the Neon org, and its password no longer
authenticates. No code reads those variables. Dead integration — worth
removing from Vercel and `.env.local` so it stops looking like a second source
of truth for gigs.

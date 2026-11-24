# Neon compute: cache gig reads, resolve dates in JS

Date: 2026-11-24
Status: approved design, awaiting spec review

## Problem

Neon reported 91.3 % of the monthly compute allowance used. Neon bills compute
by CU-hours: a compute wakes on the first query and stays up ~5 minutes after
the last one. The front page (`app/page.tsx`, `revalidate = 300`) queries
`events` on every ISR regeneration, i.e. up to every 5 minutes whenever anyone
(or any bot) visits. With steady traffic the compute never suspends:
24 h × 30 d × 0.25 CU ≈ 180 CU-h/month, above the free allowance.

The comment in `app/page.tsx` claims admin actions revalidate the page on
write. There are none: gigs are edited directly in the Neon console with SQL,
so the 5-minute window is the only freshness mechanism today.

## Requirements

- `publishdate` and `ticketreleasedate` take effect within ≤ 5 minutes after
  Stockholm midnight, as today.
- Edits made in SQL become visible immediately on demand, and within ≤ 1 hour
  without any action.
- No schema change, no data change, no writes to any Neon branch as part of
  this work. `tour-preview` is the live branch production reads.
- `Gig` shape returned to `GigList` / `GigRow` is unchanged.
- Ticket click tracking keeps working (the INSERT still hits the DB).

## Non-goals

- `/apps/biljettstatistik` and `/apps/latordnaren` stay as they are (rare,
  human-triggered reads).
- No admin UI, no external KV/Edge Config.

## Design

### Gig catalog (`app/_lib/gigs.ts`)

- `getGigCatalog()` — one `SELECT` of every gig with
  `date >= (now() AT TIME ZONE 'Europe/Stockholm')::date - 1`, returning raw
  `id, date, location, venue, note, ticketlink, publishdate,
  ticketreleasedate, soldout`. All DATE columns go through
  `to_char(..., 'YYYY-MM-DD')` as today. The one-day margin keeps a gig in the
  catalog across the midnight boundary until the next refresh.
- Wrapped in `unstable_cache(fn, ["gig-catalog"], { revalidate: 3600, tags: ["gigs"] })`.
- No publish/release filtering in SQL: that moves to JS so it can change at
  midnight without a query.

### Date resolution (new `app/_lib/gigDates.ts`, pure, no Next/DB imports)

- `stockholmToday(now = new Date()): string` — `Intl.DateTimeFormat("sv-SE",
  { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" })`
  → `"YYYY-MM-DD"`. Timezone-aware, so the UTC off-by-one the old comment warns
  about does not apply.
- `toUpcomingGigs(catalog, today): Gig[]` — keeps `date >= today` and
  `publishdate === null || publishdate <= today`; sets
  `ticketsreleased = ticketreleasedate === null || ticketreleasedate <= today`;
  sorted by `date` ascending. String comparison on `YYYY-MM-DD` is correct.
- `isTicketLinkLive(entry, today): boolean` — same publish + release rules plus
  `ticketlink !== null`.

### Callers

- `getUpcomingGigs()` = `toUpcomingGigs(await getGigCatalog(), stockholmToday())`.
- `getTicketLink(gigId)` in `app/_lib/ticketClicks.ts` reads the catalog
  instead of querying; keeps the `http:`/`https:` URL check.
- `recordClick` and `getTicketClickStats` unchanged.
- `app/page.tsx` keeps `revalidate = 300` (regeneration now reads the cache,
  not the DB). Fix the stale comment.
- `formatTicketRelease` / `formatGigDate` unchanged.

### On-demand refresh (new `app/api/revalidate/route.ts`)

- `GET /api/revalidate?secret=<REVALIDATE_SECRET>`, `dynamic = "force-dynamic"`.
- Secret compared with `timingSafeEqual` over SHA-256 digests (same pattern as
  `app/apps/biljettstatistik/auth.ts`).
- On match: `revalidateTag("gigs", { expire: 0 })` then `revalidatePath("/")`;
  respond `200` with a short plain-text confirmation.
- `REVALIDATE_SECRET` unset → `503` (never accept an empty secret). Wrong
  secret → `401`.
- GET so it can be opened from a phone browser bookmark. It only invalidates
  cache, so a leaked URL can at most cause extra DB wakes.

### Expected compute

Catalog refresh at most once per hour → ≤ 24 wakes/day × ~5 min ×
0.25 CU ≈ 15 CU-h/month, plus ticket clicks and statistics visits.

## Error handling

- Catalog query throws → `unstable_cache` does not store the failure; the page
  regeneration errors. ISR keeps serving the last good page (same behaviour as
  today); the next regeneration retries.
- `getTicketLink` on unknown id / not live → `null` → existing fallback to
  `/#live`.
- A gig edited or added after the last catalog refresh is invisible to both the
  page and `/go/biljett` until refresh or TTL — consistent, never half-updated.

## Testing

- Unit tests for `gigDates.ts` with `node:test` (type stripping, no new deps):
  `stockholmToday` around UTC midnight (22:30 UTC in summer → next day),
  winter/summer offsets, `toUpcomingGigs` publish/release boundaries
  (date == today counts as released/published), past gigs dropped, sort order.
  If the local Node cannot strip types, fall back to a dev dependency decided in
  the plan.
- `npm run build` + `npm run lint` pass.
- Manual: `npm run dev`, front page renders gigs; `/go/biljett/<id>` redirects;
  `/api/revalidate` returns 401 / 503 / 200 as specified.

## Manual ops (user, Neon console — not part of the code change)

- Optionally cap autoscaling on the `tour-preview` compute to 0.25 CU.
- Set `REVALIDATE_SECRET` in Vercel (Production + Preview) and `.env.local`.
- Do not delete or modify any branch.

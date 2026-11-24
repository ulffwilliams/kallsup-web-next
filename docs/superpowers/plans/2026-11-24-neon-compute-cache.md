# Neon Compute Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the front page and `/go/biljett` from waking the Neon compute every 5 minutes, while keeping midnight `publishdate`/`ticketreleasedate` flips within ≤ 5 minutes.

**Architecture:** One cached `SELECT` (`unstable_cache`, tag `gigs`, 1 h TTL) returns the raw upcoming-gig catalog. A pure module resolves "today in Stockholm" with `Intl` and applies publish/release rules in JS on every ISR regeneration. A secret-protected route invalidates the cache on demand after SQL edits.

**Tech Stack:** Next.js 16.1.1 (App Router), `@neondatabase/serverless`, TypeScript, `node:test` with `--experimental-strip-types` (Node 22.14, no new dependencies).

**Spec:** `docs/superpowers/specs/2026-11-24-neon-compute-cache-design.md`

**Hard rule:** No writes, migrations or schema changes against any Neon branch. `tour-preview` is the live production branch. `npm run build` reads (SELECT only) from it via `.env.local` — that is fine.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/_lib/gigDates.ts` | Create | Pure: `Gig` + `GigCatalogEntry` types, `stockholmToday`, `toUpcomingGigs`, `isTicketLinkLive`. No Next/DB imports. |
| `app/_lib/gigDates.test.mjs` | Create | Unit tests for the above. `.mjs` keeps it out of `tsconfig` `include`, so `next build` never type-checks a `.ts`-extension import. |
| `app/_lib/gigs.ts` | Modify | `getGigCatalog` (cached SELECT), `getUpcomingGigs` via `toUpcomingGigs`; re-exports `Gig` type. Formatters unchanged. |
| `app/_lib/ticketClicks.ts` | Modify | `getTicketLink` reads catalog instead of querying. |
| `app/api/revalidate/route.ts` | Create | Secret-checked on-demand invalidation. |
| `app/page.tsx` | Modify | Fix stale comment only. |
| `package.json` | Modify | Add `test` script. |
| `docs/gig-cache.md` | Create | Operator note: how to make SQL edits show up. |

---

### Task 1: Pure date module (TDD)

**Files:**
- Create: `app/_lib/gigDates.test.mjs`
- Create: `app/_lib/gigDates.ts`
- Modify: `package.json` (`scripts`)

- [ ] **Step 1: Add test script to `package.json`**

In `"scripts"`, after `"lint": "eslint"`, add a comma and:

```json
    "test": "node --experimental-strip-types --test app/_lib/gigDates.test.mjs"
```

Resulting block:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "node --experimental-strip-types --test app/_lib/gigDates.test.mjs"
  },
```

- [ ] **Step 2: Write the failing tests**

Create `app/_lib/gigDates.test.mjs`:

```js
/*
 * Run with `npm test`. Plain .mjs on purpose: tsconfig only includes .ts/.tsx/
 * .mts, so `next build` never type-checks this file's `./gigDates.ts` import
 * (which tsc would reject without allowImportingTsExtensions).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { isTicketLinkLive, stockholmToday, toUpcomingGigs } from "./gigDates.ts";

function entry(overrides = {}) {
  return {
    id: 1,
    date: "2026-12-01",
    location: "Örebro",
    venue: "Frimis",
    note: null,
    ticketlink: "https://tickets.example/1",
    publishdate: null,
    ticketreleasedate: null,
    soldout: false,
    ...overrides,
  };
}

test("stockholmToday: summer (UTC+2), 22:30 UTC is already the next day", () => {
  assert.equal(stockholmToday(new Date("2026-07-24T22:30:00Z")), "2026-07-25");
});

test("stockholmToday: summer (UTC+2), 21:59 UTC is still the same day", () => {
  assert.equal(stockholmToday(new Date("2026-07-24T21:59:00Z")), "2026-07-24");
});

test("stockholmToday: winter (UTC+1), 23:00 UTC is already the next day", () => {
  assert.equal(stockholmToday(new Date("2026-01-14T23:00:00Z")), "2026-01-15");
});

test("stockholmToday: winter (UTC+1), 22:59 UTC is still the same day", () => {
  assert.equal(stockholmToday(new Date("2026-01-14T22:59:00Z")), "2026-01-14");
});

test("toUpcomingGigs: drops past gigs, keeps a gig dated today", () => {
  const result = toUpcomingGigs(
    [entry({ id: 1, date: "2026-11-23" }), entry({ id: 2, date: "2026-11-24" })],
    "2026-11-24",
  );
  assert.deepEqual(result.map((g) => g.id), [2]);
});

test("toUpcomingGigs: hides a gig until its publishdate, shows it on that day", () => {
  const catalog = [entry({ publishdate: "2026-11-25" })];
  assert.equal(toUpcomingGigs(catalog, "2026-11-24").length, 0);
  assert.equal(toUpcomingGigs(catalog, "2026-11-25").length, 1);
});

test("toUpcomingGigs: ticketsreleased flips on the release day", () => {
  const catalog = [entry({ ticketreleasedate: "2026-11-25" })];
  assert.equal(toUpcomingGigs(catalog, "2026-11-24")[0].ticketsreleased, false);
  assert.equal(toUpcomingGigs(catalog, "2026-11-25")[0].ticketsreleased, true);
});

test("toUpcomingGigs: no release date means released", () => {
  assert.equal(toUpcomingGigs([entry()], "2026-11-24")[0].ticketsreleased, true);
});

test("toUpcomingGigs: sorts by date, then id", () => {
  const result = toUpcomingGigs(
    [
      entry({ id: 3, date: "2026-12-05" }),
      entry({ id: 2, date: "2026-12-01" }),
      entry({ id: 1, date: "2026-12-01" }),
    ],
    "2026-11-24",
  );
  assert.deepEqual(result.map((g) => g.id), [1, 2, 3]);
});

test("toUpcomingGigs: returns the Gig shape without publishdate", () => {
  const [gig] = toUpcomingGigs(
    [entry({ note: "Släpp", ticketreleasedate: "2026-11-01", soldout: true })],
    "2026-11-24",
  );
  assert.deepEqual(gig, {
    id: 1,
    date: "2026-12-01",
    location: "Örebro",
    venue: "Frimis",
    note: "Släpp",
    ticketlink: "https://tickets.example/1",
    ticketreleasedate: "2026-11-01",
    ticketsreleased: true,
    soldout: true,
  });
});

test("isTicketLinkLive: false without a link", () => {
  assert.equal(isTicketLinkLive(entry({ ticketlink: null }), "2026-11-24"), false);
});

test("isTicketLinkLive: false before publishdate, true on it", () => {
  const e = entry({ publishdate: "2026-11-25" });
  assert.equal(isTicketLinkLive(e, "2026-11-24"), false);
  assert.equal(isTicketLinkLive(e, "2026-11-25"), true);
});

test("isTicketLinkLive: false before ticketreleasedate, true on it", () => {
  const e = entry({ ticketreleasedate: "2026-11-25" });
  assert.equal(isTicketLinkLive(e, "2026-11-24"), false);
  assert.equal(isTicketLinkLive(e, "2026-11-25"), true);
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `./gigDates.ts`.

- [ ] **Step 4: Implement `app/_lib/gigDates.ts`**

```ts
/*
 * Gig visibility rules, resolved in JS so they can change at Stockholm
 * midnight without a database query (each query keeps the Neon compute awake
 * for ~5 minutes, which is what this module exists to avoid).
 *
 * Pure on purpose: no Next or database imports, so `npm test` can load it
 * under plain `node --experimental-strip-types`. Keep it that way.
 *
 * Dates are "YYYY-MM-DD" strings throughout. Lexicographic comparison of that
 * format is chronological, so no Date parsing is needed — and none of the
 * UTC-midnight bugs that come with it.
 */

/** One row of the cached catalog (`getGigCatalog`). */
export type GigCatalogEntry = {
  id: number;
  date: string;
  location: string;
  venue: string;
  note: string | null;
  ticketlink: string | null;
  /** Gig hidden until this Stockholm day. null = visible immediately. */
  publishdate: string | null;
  /** Ticket link held back until this Stockholm day. null = on sale. */
  ticketreleasedate: string | null;
  soldout: boolean;
};

export type Gig = {
  id: number;
  /** Always "YYYY-MM-DD". */
  date: string;
  location: string;
  venue: string;
  note: string | null;
  ticketlink: string | null;
  /** "YYYY-MM-DD", or null when no on-sale date has been announced. */
  ticketreleasedate: string | null;
  /**
   * Whether `ticketreleasedate` has arrived in Stockholm. True when there is
   * no release date at all, so a gig that just has a ticketlink renders one.
   */
  ticketsreleased: boolean;
  /** True when the gig is sold out — the ticket CTA is replaced by an indicator. */
  soldout: boolean;
};

const STOCKHOLM_DAY = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Today's calendar date in Stockholm as "YYYY-MM-DD". Vercel runs in UTC, so a
 * bare `new Date()` would report yesterday for the first hour or two of a
 * Stockholm day; the explicit timeZone handles DST too.
 */
export function stockholmToday(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    STOCKHOLM_DAY.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isPublished(entry: GigCatalogEntry, today: string) {
  return entry.publishdate === null || entry.publishdate <= today;
}

function isReleased(entry: GigCatalogEntry, today: string) {
  return entry.ticketreleasedate === null || entry.ticketreleasedate <= today;
}

/** Published gigs from `today` on, earliest first, in the shape the page renders. */
export function toUpcomingGigs(catalog: GigCatalogEntry[], today: string): Gig[] {
  return catalog
    .filter((entry) => entry.date >= today && isPublished(entry, today))
    .sort((a, b) =>
      a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1,
    )
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      location: entry.location,
      venue: entry.venue,
      note: entry.note,
      ticketlink: entry.ticketlink,
      ticketreleasedate: entry.ticketreleasedate,
      ticketsreleased: isReleased(entry, today),
      soldout: entry.soldout,
    }));
}

/** Whether `/go/biljett/<id>` may redirect to this gig's vendor today. */
export function isTicketLinkLive(entry: GigCatalogEntry, today: string): boolean {
  return (
    entry.ticketlink !== null &&
    isPublished(entry, today) &&
    isReleased(entry, today)
  );
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npm test`
Expected: `# pass 13`, `# fail 0`. (An `ExperimentalWarning` about type stripping on stderr is expected.)

- [ ] **Step 6: Commit**

```bash
git add package.json app/_lib/gigDates.ts app/_lib/gigDates.test.mjs
git commit -m "feat: pure Stockholm-date gig visibility rules with tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cached catalog in `gigs.ts`

**Files:**
- Modify: `app/_lib/gigs.ts` (everything above `const MONTHS_SV`; formatters below it stay untouched)

- [ ] **Step 1: Replace the top of `app/_lib/gigs.ts`**

Replace everything from line 1 through the end of `getUpcomingGigs` (the line `return rows as Gig[];` and its closing `}`) with:

```ts
import { unstable_cache } from "next/cache";

import { db } from "./db";
import {
  stockholmToday,
  toUpcomingGigs,
  type Gig,
  type GigCatalogEntry,
} from "./gigDates";

export type { Gig } from "./gigDates";

/** Cache tag for the gig catalog. `/api/revalidate` invalidates it. */
export const GIGS_TAG = "gigs";

/*
 * Why a cached catalog instead of querying per render: every Neon query keeps
 * the compute awake for ~5 minutes, and the front page regenerates every 5
 * minutes under traffic — that alone kept the compute up around the clock.
 *
 * So the database is read at most once an hour (or right after someone opens
 * /api/revalidate), and the date rules — `publishdate`, `ticketreleasedate`,
 * "is it in the past" — run in JS against Stockholm's date on every
 * regeneration. Midnight flips still land within the page's 5-minute window
 * with no query at all. See docs/gig-cache.md.
 *
 * `date >= today - 1` rather than `>= today`: if the cache was filled late in
 * the evening, the margin keeps tonight's gig in it past midnight; the JS
 * filter drops it once its date is gone.
 *
 * DATE columns go through to_char(...): the serverless driver would otherwise
 * parse them into a JS Date at local midnight, which serialises as the
 * *previous* day in UTC (2026-07-25 -> 2026-07-24T22:00:00.000Z).
 */
export const getGigCatalog = unstable_cache(
  async (): Promise<GigCatalogEntry[]> => {
    const sql = db();
    const rows = await sql.query(
      `SELECT
         id,
         to_char(date, 'YYYY-MM-DD') AS date,
         location,
         venue,
         note,
         ticketlink,
         to_char(publishdate, 'YYYY-MM-DD') AS publishdate,
         to_char(ticketreleasedate, 'YYYY-MM-DD') AS ticketreleasedate,
         soldout
       FROM events
       WHERE date >= (now() AT TIME ZONE 'Europe/Stockholm')::date - 1
       ORDER BY date ASC`,
    );
    return rows as GigCatalogEntry[];
  },
  ["gig-catalog"],
  { revalidate: 3600, tags: [GIGS_TAG] },
);

export async function getUpcomingGigs(): Promise<Gig[]> {
  return toUpcomingGigs(await getGigCatalog(), stockholmToday());
}
```

Note: the `Gig` type now lives in `gigDates.ts`; `GigList.tsx` / `GigRow.tsx` keep importing it from `../_lib/gigs` via the re-export — no change needed there.

- [ ] **Step 2: Fix the stale comment in `app/page.tsx`**

Replace lines 13–15:

```ts
/* Gigs change weekly, not per request. The admin actions revalidate this path
   on write, so edits still show up immediately. */
export const revalidate = 300;
```

with:

```ts
/* Regenerates every 5 minutes so publishdate/ticketreleasedate flip within
   5 minutes of Stockholm midnight. Regeneration reads the cached gig catalog,
   not the database — see app/_lib/gigs.ts and docs/gig-cache.md. */
export const revalidate = 300;
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/_lib/gigs.ts app/page.tsx
git commit -m "perf: serve front-page gigs from an hourly cached catalog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `getTicketLink` from the catalog

**Files:**
- Modify: `app/_lib/ticketClicks.ts` (imports at line 1; `getTicketLink` doc comment + function, currently ~lines 21–55)

Behaviour note: a gig dated before yesterday is no longer in the catalog, so its `/go/biljett/<id>` falls back to `/#live` instead of the vendor. Intended — past gigs are not shown on the site.

- [ ] **Step 1: Update imports**

Replace line 1:

```ts
import { db } from "./db";
```

with:

```ts
import { db } from "./db";
import { isTicketLinkLive, stockholmToday } from "./gigDates";
import { getGigCatalog } from "./gigs";
```

(`db` stays: `recordClick` and `getTicketClickStats` still use it.)

- [ ] **Step 2: Replace `getTicketLink` and its doc comment**

Replace the block from `/**` above `export async function getTicketLink` through the function's closing `}` with:

```ts
/**
 * Resolves a gig's ticket URL. Returns null when the gig is unknown (or past),
 * has no link yet, is not published yet, or is not on sale — the route sends
 * those back to the site rather than to a dead vendor page.
 *
 * Reads the cached gig catalog, not the database, so a click only wakes Neon
 * for the INSERT in `recordClick`. A link edited in SQL takes effect after
 * /api/revalidate (or within the hour) — same as the front page.
 *
 * The URL is re-checked here even though it comes from our own database:
 * `Response.redirect` throws on anything that is not absolute, and a stray
 * javascript:/data: value must never be handed to a browser as a destination.
 */
export async function getTicketLink(gigId: number): Promise<string | null> {
  const catalog = await getGigCatalog();
  const entry = catalog.find((gig) => gig.id === gigId);
  if (!entry || !isTicketLinkLive(entry, stockholmToday())) return null;

  const ticketlink = entry.ticketlink as string;
  try {
    const url = new URL(ticketlink);
    return url.protocol === "https:" || url.protocol === "http:"
      ? ticketlink
      : null;
  } catch {
    console.error(`events.ticketlink for gig ${gigId} is not a URL:`, ticketlink);
    return null;
  }
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/_lib/ticketClicks.ts
git commit -m "perf: resolve ticket links from the cached gig catalog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: On-demand refresh route

**Files:**
- Create: `app/api/revalidate/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { createHash, timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { GIGS_TAG } from "../../_lib/gigs";

/*
 * After editing `events` in the Neon console, open
 *   /api/revalidate?secret=<REVALIDATE_SECRET>
 * to make the change show up now instead of within the hour. GET so it works
 * as a phone bookmark. It only drops cache, so a leaked URL can at worst cost
 * a few extra database wakes. See docs/gig-cache.md.
 */
export const dynamic = "force-dynamic";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function GET(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return new Response("REVALIDATE_SECRET is not set.\n", { status: 503 });
  }

  const given = request.nextUrl.searchParams.get("secret") ?? "";
  if (!timingSafeEqual(digest(given), digest(expected))) {
    return new Response("Wrong secret.\n", { status: 401 });
  }

  /* { expire: 0 }: drop the entry now. The "max" profile would serve the old
     catalog to the next visitor while refreshing in the background. */
  revalidateTag(GIGS_TAG, { expire: 0 });
  revalidatePath("/");

  return new Response("Gigs refreshed.\n", {
    headers: { "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. If tsc rejects `{ expire: 0 }`, check `CacheLifeConfig` in `node_modules/next/dist/server/use-cache/cache-life.d.ts` (or grep `CacheLifeConfig` under `node_modules/next/dist`) and use the field name it defines for expiry.

- [ ] **Step 3: Commit**

```bash
git add app/api/revalidate/route.ts
git commit -m "feat: secret-protected route to refresh the gig cache

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Operator doc

**Files:**
- Create: `docs/gig-cache.md`

- [ ] **Step 1: Write the doc**

```markdown
# Gig cache

The site reads `events` from Neon at most once an hour. Every query keeps the
Neon compute awake ~5 minutes, and querying on each 5-minute page regeneration
used up the monthly compute allowance.

## After editing gigs in SQL

Open:

    https://<site>/api/revalidate?secret=<REVALIDATE_SECRET>

Expect `Gigs refreshed.` The front page and `/go/biljett/<id>` show the edit
immediately. Without this step the edit appears within an hour.

## Midnight changes need nothing

`publishdate` and `ticketreleasedate` are evaluated in code against today's
date in Stockholm on every page regeneration (every 5 minutes). A gig or ticket
link scheduled for a day goes live within 5 minutes after midnight, no refresh
needed — as long as the row was already in the database before the last
refresh.

## Setup

`REVALIDATE_SECRET` must be set in Vercel (Production and Preview) and in
`.env.local`. Unset → the route answers 503. Generate one with:

    node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"

## What still wakes the database

- A ticket click (`INSERT INTO ticket_clicks`).
- `/apps/biljettstatistik` and `/apps/latordnaren`.
- The hourly catalog refresh, and `/api/revalidate`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/gig-cache.md
git commit -m "docs: how the gig cache works and how to refresh it

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verify end to end

No code changes unless a step fails. Reads only — no writes to Neon.

- [ ] **Step 1: Unit tests**

Run: `npm test`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 2: Lint and production build**

Run: `npm run lint && npm run build`
Expected: both succeed. Build output lists `/` as ISR (`Revalidate 5m`) and `/api/revalidate` as dynamic (`ƒ`).

- [ ] **Step 3: Add a local secret**

Append to `.env.local` (do not commit; file is gitignored — confirm with `git check-ignore .env.local`, expected output `.env.local`):

```
REVALIDATE_SECRET=local-dev-secret
```

- [ ] **Step 4: Manual checks against `npm run dev`**

Start: `npm run dev` (background). Then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
# expect 200; open in browser: gig list renders same as on the live site

curl -s -w "%{http_code}\n" "http://localhost:3000/api/revalidate?secret=wrong"
# expect: Wrong secret.  401

curl -s -w "%{http_code}\n" "http://localhost:3000/api/revalidate?secret=local-dev-secret"
# expect: Gigs refreshed.  200

curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/go/biljett/999999
# expect: 307 http://localhost:3000/#live
```

For a live gig id (from a rendered ticket link `href="/go/biljett/<id>"`). Keep curl's default user agent: `isBot` matches `curl`, so no click row is written to `ticket_clicks`. Never use a browser-like `-A`.

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/go/biljett/<id>
# expect: 307 <vendor URL>  (curl UA = bot → no click recorded)
```

Stop the dev server afterwards.

- [ ] **Step 5: Report**

Summarize results to the user, and list the manual ops left for them:
1. Set `REVALIDATE_SECRET` in Vercel (Production + Preview), then redeploy.
2. Optionally cap the `tour-preview` compute's autoscaling max at 0.25 CU in the Neon console.
3. Bookmark the refresh URL.

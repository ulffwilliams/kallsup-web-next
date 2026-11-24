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

const MONTHS_SV = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
];

/**
 * "2026-09-12" -> "12 sep". Lowercased because the label styles stopped
 * uppercasing; splits the string rather than parsing it, for the reason above.
 */
export function formatTicketRelease(date: string) {
  const [, month, day] = date.split("-");
  const name = MONTHS_SV[Number(month) - 1]?.toLowerCase() ?? month;
  return `${Number(day)} ${name}`;
}

/** Splits "YYYY-MM-DD" without constructing a Date. */
export function formatGigDate(date: string) {
  const [year, month, day] = date.split("-");
  return {
    year,
    day,
    month: MONTHS_SV[Number(month) - 1] ?? month,
    numeric: `${day}.${month}`,
  };
}

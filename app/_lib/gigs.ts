import { neon } from "@neondatabase/serverless";

export type Gig = {
  id: number;
  /** Always "YYYY-MM-DD" — see note below on why this is a string. */
  date: string;
  location: string;
  venue: string;
  note: string | null;
  ticketlink: string | null;
  /** "YYYY-MM-DD", or null when no on-sale date has been announced. */
  ticketreleasedate: string | null;
  /**
   * Whether `ticketreleasedate` has arrived — resolved by Postgres, not here.
   * Vercel runs in UTC, so a JS `new Date()` would still report yesterday for
   * the first one or two hours of a Stockholm day and hold the ticket link
   * back. True when there is no release date at all, so a gig that just has a
   * ticketlink still renders one.
   */
  ticketsreleased: boolean;
};

/*
 * `events.date` is a DATE column. The serverless driver parses it into a JS
 * Date at local midnight, which serialises as the *previous* day in UTC
 * (2026-07-25 -> 2026-07-24T22:00:00.000Z). Selecting to_char(...) keeps the
 * calendar day intact and out of Date's hands entirely; the formatters below
 * split the string rather than re-parsing it.
 */

/** Today in Stockholm, resolved by Postgres so the cutoff matches the band. */
const TODAY = `(now() AT TIME ZONE 'Europe/Stockholm')::date`;

const SELECT_GIG = `
  id,
  to_char(date, 'YYYY-MM-DD') AS date,
  location,
  venue,
  note,
  ticketlink,
  to_char(ticketreleasedate, 'YYYY-MM-DD') AS ticketreleasedate,
  (ticketreleasedate IS NULL OR ticketreleasedate <= ${TODAY}) AS ticketsreleased
`;

/*
 * Preview deploys read a Neon *branch* so unannounced shows never reach the
 * live site. The wiring is entirely in Vercel: a second DATABASE_URL scoped to
 * one Preview git branch, which takes precedence over the unscoped value for
 * builds of that branch. Nothing to special-case here.
 */
function db() {
  const url = process.env.DATABASE_URL;

  /*
   * Interpolating straight into neon() turns a missing var into the string
   * "undefined", and the driver then reports an invalid URL with the value
   * redacted — which says nothing about which env var is at fault or how. The
   * checks below name the variable and the actual problem instead.
   */
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. On Vercel, check that the variable covers the " +
        "environment being built (and the git branch, if it is branch-scoped).",
    );
  }

  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      "DATABASE_URL is not a postgres:// URL. A likely cause is pasting " +
        "Neon's full `psql '...'` command instead of just the connection " +
        "string — the value must start with postgresql:// and carry no quotes.",
    );
  }

  return neon(url);
}

export async function getUpcomingGigs(): Promise<Gig[]> {
  const sql = db();
  const rows = await sql.query(
    `SELECT ${SELECT_GIG} FROM events WHERE date >= ${TODAY} ORDER BY date ASC`,
  );
  return rows as Gig[];
}

export async function getPastGigs(limit = 24): Promise<Gig[]> {
  const sql = db();
  const rows = await sql.query(
    `SELECT ${SELECT_GIG} FROM events WHERE date < ${TODAY} ORDER BY date DESC LIMIT $1`,
    [limit],
  );
  return rows as Gig[];
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

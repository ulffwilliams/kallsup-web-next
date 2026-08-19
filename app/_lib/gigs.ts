import { neon } from "@neondatabase/serverless";

export type Gig = {
  id: number;
  /** Always "YYYY-MM-DD" — see note below on why this is a string. */
  date: string;
  location: string;
  venue: string;
  note: string | null;
  ticketlink: string | null;
  /** Only true for shows we know are free. Drives the CTA fallback in GigRow:
   *  a missing ticketlink means "not on sale yet", not "free entry". */
  freeentry: boolean;
};

/*
 * `events.date` is a DATE column. The serverless driver parses it into a JS
 * Date at local midnight, which serialises as the *previous* day in UTC
 * (2026-07-25 -> 2026-07-24T22:00:00.000Z). Selecting to_char(...) keeps the
 * calendar day intact and out of Date's hands entirely; the formatters below
 * split the string rather than re-parsing it.
 */
const SELECT_GIG = `
  id,
  to_char(date, 'YYYY-MM-DD') AS date,
  location,
  venue,
  note,
  ticketlink,
  freeentry
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

/** Today in Stockholm, resolved by Postgres so the cutoff matches the band. */
const TODAY = `(now() AT TIME ZONE 'Europe/Stockholm')::date`;

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

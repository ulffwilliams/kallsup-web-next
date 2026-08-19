/**
 * Seeds the unannounced winter 2026 tour into a NON-PRODUCTION database.
 *
 * These dates are not public yet, so this script is deliberately awkward to
 * point at production:
 *   - it reads TOUR_PREVIEW_DATABASE_URL only, and never falls back to
 *     DATABASE_URL;
 *   - it aborts if the host is the known production endpoint.
 *
 * Usage, against a Neon branch connection string:
 *   TOUR_PREVIEW_DATABASE_URL="postgres://..." node scripts/seed-tour-preview.mjs
 *
 * Idempotent: each (date, venue) pair is deleted before insert, so re-running
 * after an edit here converges rather than duplicating rows.
 */

import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./_env.mjs";

loadEnvLocal();

/** Production compute endpoint — Neon project fragrant-bird-30319122. */
const PRODUCTION_ENDPOINT = "ep-misty-dew-ag2gxjpf";

/*
 * Örebro is "??.12" on the band's list — day still unknown. `events.date` is
 * NOT NULL, so it parks on the last day of December (sorting it after every
 * known December show) and carries the real state in `note`.
 */
const tourGigs = [
  { date: "2026-11-26", location: "Stockholm", venue: "Hus 7", note: null },
  { date: "2026-11-27", location: "Växjö", venue: "Kafé de Luxe", note: null },
  { date: "2026-11-28", location: "Kalmar", venue: "Söderport", note: null },
  { date: "2026-12-11", location: "Malmö", venue: "Plan B", note: null },
  { date: "2026-12-12", location: "Göteborg", venue: "Monument", note: null },
  { date: "2026-12-31", location: "Örebro", venue: "TBA", note: "Datum TBA" },
];

const url = process.env.TOUR_PREVIEW_DATABASE_URL;
if (!url) {
  console.error(
    "TOUR_PREVIEW_DATABASE_URL is not set.\n" +
      "Pass the Neon *branch* connection string explicitly — this script will\n" +
      "not fall back to DATABASE_URL, because these dates are unannounced.",
  );
  process.exit(1);
}

const host = url.match(/@([^/]+)/)?.[1] ?? "";
if (host.includes(PRODUCTION_ENDPOINT)) {
  console.error(
    `Refusing to run: ${host} is the production endpoint.\n` +
      "Create a Neon branch and use its connection string instead.",
  );
  process.exit(1);
}

const sql = neon(url);

const [{ current_database: database }] = await sql`SELECT current_database()`;
console.log(`Target: ${host} / ${database}`);

let inserted = 0;
for (const gig of tourGigs) {
  await sql`DELETE FROM events WHERE date = ${gig.date}::date AND venue = ${gig.venue}`;
  await sql`
    INSERT INTO events (date, location, venue, note, ticketlink, freeentry)
    VALUES (${gig.date}::date, ${gig.location}, ${gig.venue}, ${gig.note}, NULL, false)
  `;
  inserted += 1;
  console.log(`  + ${gig.date}  ${gig.location} — ${gig.venue}`);
}

const upcoming = await sql`
  SELECT to_char(date, 'YYYY-MM-DD') AS date, location, venue
  FROM events
  WHERE date >= (now() AT TIME ZONE 'Europe/Stockholm')::date
  ORDER BY date ASC
`;

console.log(`\nSeeded ${inserted} rows. Upcoming on this branch:`);
for (const row of upcoming) {
  console.log(`  ${row.date}  ${row.location} — ${row.venue}`);
}

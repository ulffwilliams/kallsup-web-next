/**
 * Creates `ticket_clicks` — one row per click on a "Biljetter" button.
 *
 * The site links to /go/biljett/<gig id> instead of the ticket vendor
 * directly; that route records the click and then 307s onward. Counting
 * server-side rather than with a client analytics event means ad blockers
 * cannot drop the number and the data stays in our own database.
 *
 * Purely additive and idempotent, so it is safe to run on production. Same
 * ordering rule as the earlier migrations: a Neon branch inherits the schema it
 * forks from, so this runs on `main` FIRST and you branch afterwards.
 *
 *   node scripts/add-ticket-clicks-table.mjs
 *   TARGET_DATABASE_URL=postgres://... node scripts/add-ticket-clicks-table.mjs
 */

import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./_env.mjs";

loadEnvLocal();

const url = process.env.TARGET_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("No TARGET_DATABASE_URL or DATABASE_URL set.");
  process.exit(1);
}

const sql = neon(url);
const host = url.match(/@([^/]+)/)?.[1] ?? "unknown";

console.log(`Target: ${host}`);

/*
 * ON DELETE CASCADE: a deleted gig takes its clicks with it. The counts are
 * only ever read joined back to the gig, so orphans would be unreachable
 * anyway.
 *
 * No IP column, and no cookie — the row says a click happened and roughly
 * where it came from, which is all the band needs and keeps this outside
 * personal-data territory.
 */
await sql`
  CREATE TABLE IF NOT EXISTS ticket_clicks (
    id         BIGSERIAL PRIMARY KEY,
    gig_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    referrer   TEXT,
    user_agent TEXT
  )
`;

/* Every read is "clicks for this gig", newest first. */
await sql`
  CREATE INDEX IF NOT EXISTS ticket_clicks_gig_id_clicked_at_idx
  ON ticket_clicks (gig_id, clicked_at DESC)
`;

const cols = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'ticket_clicks'
  ORDER BY ordinal_position
`;

if (cols.length === 0) {
  console.error("ticket_clicks missing after CREATE — bailing.");
  process.exit(1);
}

console.log(
  `ticket_clicks ready: ${cols.map((c) => `${c.column_name} (${c.data_type})`).join(", ")}`,
);

const [{ count }] = await sql`SELECT count(*)::int AS count FROM ticket_clicks`;
console.log(`${count} click(s) recorded so far.`);

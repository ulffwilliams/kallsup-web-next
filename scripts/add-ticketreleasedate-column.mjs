/**
 * Adds `events.ticketreleasedate` and retires `events.freeentry`.
 *
 * The ADD is additive, idempotent, and safe to run on production. Same ordering
 * rule as the freeentry migration: a Neon branch inherits the schema it forks
 * from, and the app selects `ticketreleasedate` in every environment, so this
 * runs on `main` FIRST and you branch afterwards.
 *
 * The column is nullable with no default. NULL means "no on-sale date
 * announced", which the app treats as released-if-a-ticketlink-exists — so
 * every existing row keeps rendering exactly as it does today.
 *
 * Dropping `freeentry` is NOT part of the default run: it destroys data and
 * cannot be undone. Once the new code is deployed everywhere and you are happy,
 * opt in explicitly:
 *
 *   node scripts/add-ticketreleasedate-column.mjs                  # add only
 *   TARGET_DATABASE_URL=postgres://... node scripts/add-ticketreleasedate-column.mjs
 *   DROP_FREEENTRY=1 node scripts/add-ticketreleasedate-column.mjs  # also drops
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

await sql`
  ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ticketreleasedate DATE
`;

const [col] = await sql`
  SELECT data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'events' AND column_name = 'ticketreleasedate'
`;

if (!col) {
  console.error("ticketreleasedate missing after ALTER — bailing.");
  process.exit(1);
}

console.log(
  `events.ticketreleasedate ready (${col.data_type}, nullable ${col.is_nullable}).`,
);

if (process.env.DROP_FREEENTRY === "1") {
  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM events WHERE freeentry = true
  `;
  console.log(`Dropping freeentry — ${count} row(s) currently have it set.`);
  await sql`ALTER TABLE events DROP COLUMN IF EXISTS freeentry`;
  console.log("events.freeentry dropped.");
} else {
  console.log("freeentry left in place. Re-run with DROP_FREEENTRY=1 to remove.");
}

/**
 * Adds `events.publishdate` — additive, idempotent, safe to run on production.
 *
 * A gig with a publishdate stays off the site (and its /go/biljett redirect
 * stays closed) until that day in Stockholm. NULL means "visible immediately",
 * so every existing row keeps rendering exactly as it does today.
 *
 * The app selects against this column in every environment, so run it on
 * every Neon branch the site reads BEFORE deploying the code — see
 * docs/tour-preview.md for why both branches need it:
 *
 *   node scripts/add-publishdate-column.mjs                       # uses DATABASE_URL
 *   TARGET_DATABASE_URL="$POSTGRES_URL" node scripts/add-publishdate-column.mjs
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
  ADD COLUMN IF NOT EXISTS publishdate DATE
`;

const [col] = await sql`
  SELECT data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'events' AND column_name = 'publishdate'
`;

if (!col) {
  console.error("publishdate missing after ALTER — bailing.");
  process.exit(1);
}

console.log(`events.publishdate ready (${col.data_type}, nullable ${col.is_nullable}).`);

/**
 * Adds `events.freeentry` — additive, idempotent, safe to run on production.
 *
 * Why production and not just the preview branch: a Neon branch inherits the
 * schema it was forked from, and the app code selects `freeentry` on every
 * environment. If the column existed only on the branch, production would
 * throw on the first gig query. So this runs on `main` FIRST, then you branch.
 *
 * Default is false, and past gigs never render a CTA, so production output is
 * unchanged by this migration.
 *
 *   node scripts/add-freeentry-column.mjs                  # uses DATABASE_URL
 *   TARGET_DATABASE_URL=postgres://... node scripts/add-freeentry-column.mjs
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
  ADD COLUMN IF NOT EXISTS freeentry BOOLEAN NOT NULL DEFAULT false
`;

const [col] = await sql`
  SELECT data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'events' AND column_name = 'freeentry'
`;

if (!col) {
  console.error("freeentry missing after ALTER — bailing.");
  process.exit(1);
}

console.log(`events.freeentry ready (${col.data_type}, default ${col.column_default}).`);

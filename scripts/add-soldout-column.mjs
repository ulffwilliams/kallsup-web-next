/**
 * Adds `events.soldout` — additive, idempotent, safe to run on production.
 *
 * Why production and not just a preview branch: a Neon branch inherits the
 * schema it was forked from, and the app code selects `soldout` on every
 * environment. If the column existed only on a branch, the other branch would
 * throw on the first gig query. See docs/tour-preview.md — as of that doc,
 * neither `tour-preview` nor `production` is upstream of the other, so both
 * need this run explicitly:
 *
 *   node scripts/add-soldout-column.mjs                       # uses DATABASE_URL
 *   TARGET_DATABASE_URL="$POSTGRES_URL" node scripts/add-soldout-column.mjs
 *
 * Default is false, so existing rows keep rendering their ticket CTA exactly
 * as they do today.
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
  ADD COLUMN IF NOT EXISTS soldout BOOLEAN NOT NULL DEFAULT false
`;

const [col] = await sql`
  SELECT data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'events' AND column_name = 'soldout'
`;

if (!col) {
  console.error("soldout missing after ALTER — bailing.");
  process.exit(1);
}

console.log(`events.soldout ready (${col.data_type}, default ${col.column_default}).`);

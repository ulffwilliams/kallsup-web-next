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

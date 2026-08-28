# Counting clicks on the Biljetter buttons

The band wants to know which shows people are actually trying to buy tickets
for. Vercel Web Analytics is already on the site but does not count outbound
clicks, and its custom events are client-side — ad blockers drop a meaningful
share of them, and the data lives at Vercel on Vercel's retention.

Instead the gig row links to our own route, which records the click and then
redirects to the vendor:

```
GigRow  ──►  /go/biljett/<gig id>  ──►  307  ──►  events.ticketlink
                   │
                   └─ after() ──► INSERT INTO ticket_clicks
```

Server-side, so nothing can block the count. Ordinary navigation, so `GigRow`
stays a server component.

## Pieces

| File | Role |
| --- | --- |
| `scripts/add-ticket-clicks-table.mjs` | Migration. Additive, idempotent |
| `app/_lib/db.ts` | Shared `db()`, lifted out of `gigs.ts` |
| `app/_lib/ticketClicks.ts` | `ticketHref`, `getTicketLink`, `recordClick`, `getTicketClickStats` |
| `app/go/biljett/[gigId]/route.ts` | The counted hop |
| `app/apps/biljettstatistik/page.tsx` | The read view, behind the existing next-auth gate |

The stats page appears in the toolbox on its own — `app/apps/Applist.tsx`
enumerates directories.

## Decisions

**The destination is never taken from the request.** The route reads an id and
looks the URL up in `events`; there is no `?url=` to abuse, so this cannot serve
as an open redirect. The looked-up value is still checked for an `http(s):`
scheme before being handed to `Response.redirect`, which throws on anything
non-absolute and must never emit a `javascript:` destination.

**The INSERT runs in `after()`**, once the 307 is already on the wire, so
database latency never sits between a fan and the vendor. Nothing upstream can
catch a throw from there, hence the `try/catch` in `recordClick`: a failed write
loses one count and logs, it does not break the click.

**Bots and prefetches are not counted.** A Discord or Slack unfurl of a tour
post would otherwise register a click on every gig at once. Prefetch hints are
skipped for the same reason — a hover is not an intent to buy. Both still get
their redirect; only the row is skipped.

**No IP, no cookie.** A row says a click happened and roughly what browser did
it. That is enough for the question being asked and keeps the table out of
personal-data territory.

**`referrer` is usually null.** The gig row carries `rel="noreferrer"`, so the
browser sends no `Referer` even to our own route. Weakening the `rel` to
recover it was not worth it — the value would be `https://kallsup.se/` for
nearly every row anyway. The column stays for links that point straight at
`/go/biljett/...` from elsewhere.

**A gig we cannot sell for falls back to `/#live`** — unknown id, no link, not
on sale yet. The fan pressed a button and should land somewhere useful.

## What the numbers are not

Clicks, not sales. Only the vendor knows how many converted. A single person
pressing the button three times is three rows.

## Deploying a schema change

`ticket_clicks` exists on both Neon branches. Any future migration touching it
has to run twice — see [Schema changes](tour-preview.md#schema-changes).

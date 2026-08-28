import { db } from "./db";

/** The link a gig row points at. Never the vendor URL — see `recordClick`. */
export function ticketHref(gigId: number) {
  return `/go/biljett/${gigId}`;
}

/**
 * Obvious non-humans: link unfurlers, uptime pings, crawlers. They are not
 * blocked from the redirect, their click is simply not counted — a Discord
 * preview of a tour post would otherwise land as a click on every gig at once.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|monitor|curl|wget|headless|facebookexternalhit|whatsapp|discord|telegram|slack|twitterbot|embedly|vercel-screenshot|lighthouse/i;

export function isBot(userAgent: string | null) {
  return userAgent === null || BOT_UA.test(userAgent);
}

/**
 * Resolves a gig's ticket URL. Returns null when the gig is unknown, has no
 * link yet, or is not on sale — the route sends those back to the site rather
 * than to a dead vendor page.
 *
 * The URL is re-checked here even though it comes from our own database:
 * `Response.redirect` throws on anything that is not absolute, and a stray
 * javascript:/data: value must never be handed to a browser as a destination.
 */
export async function getTicketLink(gigId: number): Promise<string | null> {
  const sql = db();
  const rows = await sql.query(
    `SELECT ticketlink
     FROM events
     WHERE id = $1
       AND ticketlink IS NOT NULL
       AND (ticketreleasedate IS NULL
            OR ticketreleasedate <= (now() AT TIME ZONE 'Europe/Stockholm')::date)`,
    [gigId],
  );
  const ticketlink = rows[0]?.ticketlink as string | undefined;
  if (!ticketlink) return null;

  try {
    const url = new URL(ticketlink);
    return url.protocol === "https:" || url.protocol === "http:"
      ? ticketlink
      : null;
  } catch {
    console.error(`events.ticketlink for gig ${gigId} is not a URL:`, ticketlink);
    return null;
  }
}

/**
 * Writes one click. Called from `after()`, i.e. once the redirect is already on
 * its way to the browser, so a slow or unhappy database costs the fan nothing.
 * That also means nothing upstream can catch a throw — hence the try/catch.
 *
 * `referrer` is usually null: the gig row carries rel="noreferrer", so the
 * browser sends no Referer to our own route either. It is stored anyway for the
 * cases that do carry one — a link pasted somewhere that points straight here.
 */
export async function recordClick(
  gigId: number,
  referrer: string | null,
  userAgent: string | null,
) {
  try {
    const sql = db();
    await sql.query(
      `INSERT INTO ticket_clicks (gig_id, referrer, user_agent) VALUES ($1, $2, $3)`,
      [gigId, referrer?.slice(0, 500) ?? null, userAgent?.slice(0, 500) ?? null],
    );
  } catch (error) {
    console.error(`ticket click for gig ${gigId} not recorded:`, error);
  }
}

export type TicketClickStats = {
  id: number;
  /** "YYYY-MM-DD", same string treatment as `Gig.date`. */
  date: string;
  location: string;
  venue: string;
  hasLink: boolean;
  clicks: number;
  /** Clicks in the last seven days — the "is it moving right now" number. */
  clicks7d: number;
  /** ISO timestamp of the most recent click, or null if there is none. */
  lastClick: string | null;
  upcoming: boolean;
};

/**
 * Every gig with its click count, upcoming first and then the archive, each
 * block newest-relevant-first. LEFT JOIN so a gig with zero clicks still shows
 * up — a link nobody presses is the interesting case.
 */
export async function getTicketClickStats(): Promise<TicketClickStats[]> {
  const sql = db();
  const today = `(now() AT TIME ZONE 'Europe/Stockholm')::date`;
  const rows = await sql.query(
    `SELECT
       e.id,
       to_char(e.date, 'YYYY-MM-DD') AS date,
       e.location,
       e.venue,
       (e.ticketlink IS NOT NULL) AS "hasLink",
       (e.date >= ${today}) AS upcoming,
       count(c.id)::int AS clicks,
       (count(c.id) FILTER (WHERE c.clicked_at >= now() - interval '7 days'))::int AS "clicks7d",
       max(c.clicked_at) AS "lastClick"
     FROM events e
     LEFT JOIN ticket_clicks c ON c.gig_id = e.id
     GROUP BY e.id
     ORDER BY (e.date >= ${today}) DESC,
              CASE WHEN e.date >= ${today} THEN e.date END ASC,
              e.date DESC`,
  );

  return rows.map((row) => ({
    ...row,
    lastClick: row.lastClick ? new Date(row.lastClick).toISOString() : null,
  })) as TicketClickStats[];
}

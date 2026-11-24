/*
 * Gig visibility rules, resolved in JS so they can change at Stockholm
 * midnight without a database query (each query keeps the Neon compute awake
 * for ~5 minutes, which is what this module exists to avoid).
 *
 * Pure on purpose: no Next or database imports, so `npm test` can load it
 * under plain `node --experimental-strip-types`. Keep it that way.
 *
 * Dates are "YYYY-MM-DD" strings throughout. Lexicographic comparison of that
 * format is chronological, so no Date parsing is needed — and none of the
 * UTC-midnight bugs that come with it.
 */

/** One row of the cached catalog (`getGigCatalog`). */
export type GigCatalogEntry = {
  id: number;
  date: string;
  location: string;
  venue: string;
  note: string | null;
  ticketlink: string | null;
  /** Gig hidden until this Stockholm day. null = visible immediately. */
  publishdate: string | null;
  /** Ticket link held back until this Stockholm day. null = on sale. */
  ticketreleasedate: string | null;
  soldout: boolean;
};

export type Gig = {
  id: number;
  /** Always "YYYY-MM-DD". */
  date: string;
  location: string;
  venue: string;
  note: string | null;
  ticketlink: string | null;
  /** "YYYY-MM-DD", or null when no on-sale date has been announced. */
  ticketreleasedate: string | null;
  /**
   * Whether `ticketreleasedate` has arrived in Stockholm. True when there is
   * no release date at all, so a gig that just has a ticketlink renders one.
   */
  ticketsreleased: boolean;
  /** True when the gig is sold out — the ticket CTA is replaced by an indicator. */
  soldout: boolean;
};

const STOCKHOLM_DAY = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Today's calendar date in Stockholm as "YYYY-MM-DD". Vercel runs in UTC, so a
 * bare `new Date()` would report yesterday for the first hour or two of a
 * Stockholm day; the explicit timeZone handles DST too.
 */
export function stockholmToday(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    STOCKHOLM_DAY.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isPublished(entry: GigCatalogEntry, today: string) {
  return entry.publishdate === null || entry.publishdate <= today;
}

function isReleased(entry: GigCatalogEntry, today: string) {
  return entry.ticketreleasedate === null || entry.ticketreleasedate <= today;
}

/** Published gigs from `today` on, earliest first, in the shape the page renders. */
export function toUpcomingGigs(catalog: GigCatalogEntry[], today: string): Gig[] {
  return catalog
    .filter((entry) => entry.date >= today && isPublished(entry, today))
    .sort((a, b) =>
      a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1,
    )
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      location: entry.location,
      venue: entry.venue,
      note: entry.note,
      ticketlink: entry.ticketlink,
      ticketreleasedate: entry.ticketreleasedate,
      ticketsreleased: isReleased(entry, today),
      soldout: entry.soldout,
    }));
}

/** Whether `/go/biljett/<id>` may redirect to this gig's vendor today. */
export function isTicketLinkLive(entry: GigCatalogEntry, today: string): boolean {
  return (
    entry.ticketlink !== null &&
    isPublished(entry, today) &&
    isReleased(entry, today)
  );
}

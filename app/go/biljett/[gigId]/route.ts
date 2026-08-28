import { after, type NextRequest } from "next/server";

import { getTicketLink, isBot, recordClick } from "../../../_lib/ticketClicks";

/*
 * Reads headers and the database on every request; there is nothing here to
 * cache and a cached redirect would count one click for everybody.
 */
export const dynamic = "force-dynamic";

/**
 * Counted hop to a ticket vendor: /go/biljett/12 records the click, then 307s
 * to whatever `events.ticketlink` holds for gig 12.
 *
 * The destination is never taken from the request, only ever looked up by id,
 * so this cannot be pointed at an arbitrary URL and used as an open redirect.
 *
 * A gig we cannot sell tickets for — unknown id, no link, not on sale yet —
 * falls back to the live section on the front page rather than erroring; the
 * fan clicked "Biljetter" and should end up somewhere useful.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gigId: string }> },
) {
  const { gigId: raw } = await params;
  const gigId = Number(raw);

  const fallback = new URL("/#live", request.nextUrl.origin);

  if (!Number.isInteger(gigId) || gigId <= 0) {
    return Response.redirect(fallback, 307);
  }

  const ticketlink = await getTicketLink(gigId);

  if (!ticketlink) {
    return Response.redirect(fallback, 307);
  }

  const userAgent = request.headers.get("user-agent");

  /*
   * `after` runs once the response is on the wire, so the INSERT never sits
   * between the fan and the vendor. Browser prefetch/prerender hints are
   * skipped alongside bots — a hover is not a click.
   */
  const prefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose")?.includes("prefetch") ||
    request.headers.get("next-router-prefetch") !== null;

  if (!isBot(userAgent) && !prefetch) {
    after(() => recordClick(gigId, request.headers.get("referer"), userAgent));
  }

  return Response.redirect(ticketlink, 307);
}

import { formatGigDate, formatTicketRelease, type Gig } from "../_lib/gigs";
import { ticketHref } from "../_lib/ticketClicks";

type GigRowProps = {
  gig: Gig;
  /** Already played: the row drops its ticket action entirely. */
  past?: boolean;
};

/**
 * One show as a grid row: date block, city, venue, action. Collapses to a
 * two-column stack on narrow screens. Motion is deliberately rationed so the
 * list stays scannable: only the gold bar wipes in on row hover.
 *
 * Past rows are dimmed and inert — no hover bar, no background — so they read
 * as history rather than as something to act on.
 */
function GigRow({ gig, past = false }: GigRowProps) {
  const date = formatGigDate(gig.date);

  return (
    <li
      className={`pl-2 group relative grid grid-cols-[4.5rem_1fr] items-center gap-x-6 gap-y-1 border-b border-kall-800 py-5 md:grid-cols-[7rem_11rem_1fr_auto] md:gap-x-8 ${
        past ? "opacity-40" : "transition-colors hover:bg-white/[0.02]"
      }`}
    >
      {!past && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-kall-gold transition-transform duration-300 group-hover:scale-y-100"
        />
      )}

      <div className="row-span-2 md:row-span-1">
        <span className="type-label block text-kall-cream">{date.month}</span>
        <span className="font-display text-3xl leading-none font-bold tracking-tight text-kall-cream">
          {date.day}
        </span>
        <span className="type-label block text-kall-cream">{date.year}</span>
      </div>

      <p className="text-sm tracking-[0.04em] text-kall-cream">
        {gig.location}
      </p>

      <p className="col-start-2 text-sm tracking-[0.02em] text-kall-cream md:col-start-3">
        {gig.venue}
        {gig.note && (
          <span className="gig-note font-mono text-kall-cream/70">
            {" "}
            {gig.note}
          </span>
        )}
      </p>

      {!past && (
        <div className="col-start-2 mt-2 md:col-start-4 md:mt-0">
          {gig.soldout ? (
            <span className="type-label">Slutsålt</span>
          ) : gig.ticketlink && gig.ticketsreleased ? (
            /* Counted hop, not the vendor URL — see app/go/biljett. */
            <a
              href={ticketHref(gig.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-solid"
            >
              Biljetter
            </a>
          ) : gig.ticketreleasedate && !gig.ticketsreleased ? (
            <span className="type-label">
              Biljettsläpp: {formatTicketRelease(gig.ticketreleasedate)}
            </span>
          ) : (
            <span className="type-label">Biljetter snart</span>
          )}
        </div>
      )}
    </li>
  );
}

export default GigRow;

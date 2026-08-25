import { formatGigDate, formatTicketRelease, type Gig } from "../_lib/gigs";

type GigRowProps = {
  gig: Gig;
  /** Past gigs drop the CTA and sit dimmer. */
  past?: boolean;
};

/**
 * One show as a grid row: date block, city, venue, action. Collapses to a
 * two-column stack on narrow screens. The gold bar on the left wipes in on
 * hover — the only motion, so the row stays scannable.
 */
function GigRow({ gig, past = false }: GigRowProps) {
  const date = formatGigDate(gig.date);

  return (
    <li
      className={`pl-2 group relative grid grid-cols-[4.5rem_1fr] items-center gap-x-6 gap-y-1 border-b border-kall-800 py-5 transition-colors hover:bg-white/[0.02] md:grid-cols-[7rem_11rem_1fr_auto] md:gap-x-8 ${
        past ? "opacity-60" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-kall-gold transition-transform duration-300 group-hover:scale-y-100"
      />

      <div className="row-span-2 md:row-span-1">
        <span className="type-label block text-kall-cream">{date.month}</span>
        <span className="font-display text-3xl leading-none font-bold tracking-tight text-kall-cream italic">
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
          {gig.ticketlink && gig.ticketsreleased ? (
            <a
              href={gig.ticketlink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn font-sans tracking-[0.1em]"
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

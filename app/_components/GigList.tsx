import GigRow from "./GigRow";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import type { Gig } from "../_lib/gigs";

type GigListProps = {
  upcoming: Gig[];
  past: Gig[];
};

function GigList({ upcoming, past }: GigListProps) {
  return (
    <section id="live" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader
          title="Live"
        />

        {upcoming.length === 0 ? (
          <Reveal className="type-meta max-w-xl">
            Inga spelningar inbokade för tillfället. Det kommer!
          </Reveal>
        ) : (
          /* One observer for the list; rows stagger via .gig-stagger in CSS,
             which keeps the <ul>/<li> nesting valid. */
          <Reveal>
            <ul className="gig-stagger">
              {upcoming.map((gig) => (
                <GigRow key={gig.id} gig={gig} />
              ))}
            </ul>
          </Reveal>
        )}

        {past.length > 0 && (
          /* Collapsed by default: a native <details> needs no client JS and
             keeps the upcoming list as the first thing on the section. */
          /* Named group: a bare `group` here would also fire GigRow's
             group-hover bar on every row when the section is hovered. */
          <details className="group/past mt-10">
            <summary className="type-label inline-flex cursor-pointer list-none items-center gap-2 text-kall-cream transition-colors hover:text-kall-gold [&::-webkit-details-marker]:hidden">
              {/* Drawn, not a ▸ glyph: the mono face has no arrow glyphs. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
                className="size-[0.7em] transition-transform duration-200 group-open/past:rotate-90 motion-reduce:transition-none"
              >
                <path d="M3.5 1.5 7 5 3.5 8.5" />
              </svg>
              Tidigare spelningar
            </summary>
            <ul className="mt-6">
              {past.map((gig) => (
                <GigRow key={gig.id} gig={gig} past />
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}

export default GigList;

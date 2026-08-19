import GigRow from "./GigRow";
import PastGigs from "./PastGigs";
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
          aside={
            upcoming.length > 0
              ? `${String(upcoming.length).padStart(2, "0")} datum`
              : undefined
          }
        />

        {upcoming.length === 0 ? (
          <Reveal className="type-meta max-w-xl">
            Inga spelningar inbokade för tillfället.. Det kommer!
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

        <PastGigs gigs={past} />
      </div>
    </section>
  );
}

export default GigList;

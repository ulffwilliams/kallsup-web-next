import GigRow from "./GigRow";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import type { Gig } from "../_lib/gigs";

type GigListProps = {
  upcoming: Gig[];
};

function GigList({ upcoming }: GigListProps) {
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
      </div>
    </section>
  );
}

export default GigList;

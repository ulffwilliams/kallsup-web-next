"use client";

import { useState } from "react";
import GigRow from "./GigRow";
import type { Gig } from "../_lib/gigs";

type PastGigsProps = {
  gigs: Gig[];
};

/** Progressive disclosure for the archive — collapsed by default. */
function PastGigs({ gigs }: PastGigsProps) {
  const [open, setOpen] = useState(false);

  if (gigs.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <ul id="past-gigs" hidden={!open} className="mt-6">
        {gigs.map((gig) => (
          <GigRow key={gig.id} gig={gig} past />
        ))}
      </ul>
    </div>
  );
}

export default PastGigs;

import Image from "next/image";
import { nav, socials, site, bandcampAlbum } from "../_lib/site";

/** Closing slab: mega wordmark with the full glow treatment, then columns. */
function SiteFooter() {
  return (
    <footer className="relative z-10 bg-kall-black pt-8 pb-5">
      <div className="shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="type-label">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

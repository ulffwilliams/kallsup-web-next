import Image from "next/image";
import { nav, socials, site} from "../_lib/site";

/** Closing slab: mega wordmark with the full glow treatment, then columns. */
function SiteFooter() {
  return (
    <footer className="relative z-10 bg-kall-black pt-8 pb-5">
      <div className="shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Image
            src="/images/skarrad-vit.png"
            alt={site.name}
            width={396}
            height={100}
            className="h-4 w-auto md:h-5 [filter:brightness(0.47)_sepia(0.35)_saturate(1.6)]"
          />
          <p className="type-label">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

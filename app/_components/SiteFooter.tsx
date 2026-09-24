import Image from "next/image";
import Link from "next/link";

import { site } from "../_lib/site";

/**
 * Closing slab: wordmark, year, and one way through to the terms.
 *
 * The seller's identity, which e-handelslagen requires to be easy, direct and
 * permanently available, lives on /villkor — one link away from every page,
 * next to the policies it belongs with rather than repeated in the chrome.
 */
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

          <div className="type-label flex items-center gap-5">
            <Link href="/villkor" className="hover:text-kall-cream">
              Butiksvillkor
            </Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

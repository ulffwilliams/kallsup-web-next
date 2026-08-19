import Image from "next/image";
import { formatGigDate, type Gig } from "../_lib/gigs";
import { site, bandcampAlbum } from "../_lib/site";

type HeroProps = {
  nextGig?: Gig;
};

/**
 * Full-bleed press photo under the existing warm gradient and grain, with the
 * tagline set as the page's only mega-type statement. The logo lives in the
 * header now, so the hero carries type rather than the lockup.
 */
function Hero({ nextGig }: HeroProps) {
  const next = nextGig ? formatGigDate(nextGig.date) : null;

  return (
    <section
      id="hero"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-14 pt-32"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/press-horizontal.jpg"
          alt="Kallsup live"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-55 [filter:grayscale(0.55)_sepia(0.18)_contrast(1.05)]"
        />
        {/* Legibility ramp: dark at the bottom where the type sits. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-kall-void via-kall-void/55 to-kall-void/25"
        />
        <div className="grain-overlay" aria-hidden="true" />
      </div>

      <div className="shell">
        <h1 className="type-mega text-kall-cream/80">
          Alldeles för
          <span className="block pl-6 text-kall-gold italic sm:pl-12 md:pl-20">
            nära
          </span>
        </h1>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={bandcampAlbum}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-solid"
          >
            Förhandsbeställ skivan
          </a>
          <a href="#live" className="btn">
            Live
          </a>
        </div>
      </div>

      <p className="type-label shell mt-14 opacity-70">
        Foto: {site.photoCredit}
      </p>
    </section>
  );
}

export default Hero;

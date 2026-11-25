import Image from "next/image";
import Parallax from "./Parallax";
import { site } from "../_lib/site";

/**
 * Full-bleed press photo under the existing warm gradient and grain, with the
 * logo lockup as the hero statement. The logo carries its own signal static
 * (noise, RGB split, slice glitch), all masked to the letterforms — see
 * .hero-logo in globals.css.
 *
 * The logo drifts up on scroll at three different rates, headline fastest, so
 * the hero reads as layered depth instead of one flat slab sliding away. Rates
 * get smaller top to bottom so every layer pulls away from the one under it —
 * see Parallax for why that ordering matters.
 */
function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-10 pt-28 md:pb-14 md:pt-32"
    >
      {/* On phones the photo stops short of the bottom: a portrait viewport
          scales it by height, so at full height the faces sit mid-screen and
          the logo can only go under them by sinking to the bottom edge. Cutting
          the photo at 78% lifts the faces; the ramp fades it into the void
          backing below, which hides the page background under the cut. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 top-[60%] -z-20 bg-gradient-to-b from-transparent via-kall-void via-[45%] to-kall-void md:hidden"
      />
      <div className="absolute inset-x-0 top-0 bottom-[22%] -z-10 overflow-hidden md:bottom-0">
        <Image
          src="/images/press-horizontal.jpg"
          alt="Kallsup live"
          fill
          priority
          sizes="100vw"
          className="hero-pulse object-cover object-center opacity-55 [filter:grayscale(0.55)_sepia(0.18)_contrast(1.05)]"
        />
        <div className="hero-static" aria-hidden="true" />
        <div className="hero-scanlines" aria-hidden="true" />

        {/* Legibility ramp: dark at the bottom where the type sits. Also damps
            the static and scanlines above, which sit under it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-kall-void via-kall-void/55 to-kall-void/25"
        />
        <div className="grain-overlay" aria-hidden="true" />
      </div>

      <div className="shell">
        <Parallax speed={-0.26} fade>
          <h1 className="hero-logo w-full max-w-[min(92vw,60rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- vector, no optimisation to gain */}
            <img
              src="/images/logga-vit.svg"
              alt={site.name}
              width={1478}
              height={560}
              className="hero-logo-mark block h-auto w-full"
            />
            <span className="hero-logo-layer hero-logo-split-r" aria-hidden="true" />
            <span className="hero-logo-layer hero-logo-split-c" aria-hidden="true" />
            <span className="hero-logo-layer hero-logo-slice" aria-hidden="true" />
            <span className="hero-logo-layer hero-logo-noise" aria-hidden="true" />
            <span className="hero-logo-layer hero-logo-scan" aria-hidden="true" />
          </h1>
        </Parallax>

        <Parallax
          speed={-0.11}
          fade
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <a href="#musik" className="btn btn-solid">
            Alldeles för nära
          </a>
          <a href="#live" className="btn uppercase">
            Live
          </a>
        </Parallax>
      </div>

      <Parallax as="p" speed={-0.03} className="type-label shell mt-14 opacity-70">
        Foto: {site.photoCredit}
      </Parallax>
    </section>
  );
}

export default Hero;

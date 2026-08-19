import Image from "next/image";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { releases } from "../_lib/releases";

/**
 * Musik. Mirrored slab: the featured release runs wide with the meta left and
 * the cover right, and the cover-art grid below it fills right-to-left. Reads
 * as the reverse of Spelningar so the two sections don't stack identically.
 */
function Releases() {
  const [featured, ...rest] = releases;

  return (
    <section id="musik" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader
          title="Musik"
          mirrored
        />

        {featured && (
          <Reveal className="grid items-center gap-8 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-14">
            <div className="order-2 md:order-1 md:text-right">
              <p className="type-label mb-4">
                {featured.year} — {featured.format}
              </p>
              <h3 className="type-huge mb-6 text-kall-cream">
                {featured.title}
              </h3>

              <div className="flex flex-wrap gap-3 md:justify-end">
                {featured.spotify && (
                  <a
                    href={featured.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-solid"
                  >
                    Spotify
                  </a>
                )}
                {featured.bandcamp && (
                  <a
                    href={featured.bandcamp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                  >
                    Bandcamp
                  </a>
                )}
                {featured.ctaLink && featured.ctaTitle && (
                  <a
                    href={featured.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-solid"
                  >
                    {featured.ctaTitle}
                  </a>
                )}
                {featured.status && !featured.spotify && !featured.ctaLink && (
                  <span className="type-label border border-kall-600 px-5 py-3 text-kall-gold">
                    {featured.status}
                  </span>
                )}
              </div>
            </div>

            <div className="relative aspect-square w-full overflow-hidden order-1 md:order-2">
              <Image
                src={featured.cover}
                alt={`${featured.title} — omslag`}
                fill
                sizes="(max-width: 768px) 90vw, 26rem"
                className="object-cover"
              />
              <div className="grain-overlay" aria-hidden="true" />
            </div>
          </Reveal>
        )}

        {rest.length > 0 && (
          <Reveal className="mt-16">
            <ul dir="rtl" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((release) => (
                <li key={release.slug} dir="ltr" className="group md:text-right">
                  <a
                    href={release.bandcamp ?? release.spotify ?? "#musik"}
                    target={
                      release.bandcamp || release.spotify ? "_blank" : undefined
                    }
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative aspect-square w-full overflow-hidden">
                      <Image
                        src={release.coverThumb ?? release.cover}
                        alt={`${release.title} — omslag`}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                        className="cover-muted object-cover transition-[transform,filter] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                      <div className="grain-overlay" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-sm tracking-[0.04em] text-kall-cream uppercase">
                      {release.title}
                    </p>
                    <p className="type-label mt-1">
                      {release.year} — {release.format}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}

export default Releases;

import Image from "next/image";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { merchItems } from "../_lib/merch";

/**
 * Merch. Cards link straight out to Bandcamp — see `_lib/merch.ts`. Items
 * without a product shot fall back to a dashed tile so the grid stays even.
 * An item with `imageAlt` crossfades to that second shot on hover.
 */
const IMAGE_SIZES =
  "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw";

function Merch() {
  return (
    <section id="merch" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader title="Merch" />

        <Reveal>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {merchItems.map((item) => (
              <li key={item.slug} className="group">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {item.image ? (
                    <div className="relative aspect-square w-full overflow-hidden bg-kall-900/40">
                      <Image
                        src={item.image}
                        alt={`${item.name} — ${item.variant ?? "merch"}`}
                        fill
                        sizes={IMAGE_SIZES}
                        className={`object-cover transition-[transform,opacity] duration-500 group-hover:scale-[1.03] ${
                          item.imageAlt ? "group-hover:opacity-0" : ""
                        }`}
                      />
                      {item.imageAlt && (
                        <Image
                          src={item.imageAlt}
                          alt=""
                          aria-hidden="true"
                          fill
                          sizes={IMAGE_SIZES}
                          className="object-cover opacity-0 transition-[transform,opacity] duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                        />
                      )}
                      <div className="grain-overlay" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="relative flex aspect-square w-full items-center justify-center border border-dashed border-kall-700 bg-kall-900/40">
                      <span className="type-label">{item.name}</span>
                      <div className="grain-overlay" aria-hidden="true" />
                    </div>
                  )}

                  <p className="mt-4 text-sm tracking-[0.04em] text-kall-cream uppercase">
                    {item.name}
                  </p>
                  <p className="type-label mt-1 flex items-center gap-2">
                    {item.price ?? item.variant ?? "Bandcamp"}
                    <span className="text-kall-500 transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

export default Merch;

import Link from "next/link";

import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import MerchGrid from "./MerchGrid";
import { getMerchProducts } from "../_lib/shopify";

/**
 * Merch on the front page: the eight best sellers, with the full catalogue a
 * click away. Products come from the Shopify Storefront API — see
 * `_lib/shopify.ts`.
 */
async function Merch() {
  const products = await getMerchProducts();

  return (
    <section id="merch" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader title="Merch" />

        <Reveal>
          <MerchGrid products={products} />

          {products && products.length > 0 && (
            <p className="mt-10">
              <Link href="/merch" className="btn btn-bare">
                Se all merch
                {/* An SVG, not a "→" glyph: .btn-arrow sizes its child to
                    0.65em square, which a text arrow's line box overflows —
                    that is what threw the old one off centre. */}
                <svg
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="square"
                  className="btn-arrow btn-arrow-forward"
                  aria-hidden="true"
                >
                  <path d="M1.4 5H8.2" />
                  <path d="M5.6 2.4 8.2 5 5.6 7.6" />
                </svg>
              </Link>
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default Merch;

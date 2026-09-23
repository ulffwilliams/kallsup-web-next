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
              <Link href="/merch" className="btn">
                Se all merch
                <span className="btn-arrow">→</span>
              </Link>
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default Merch;

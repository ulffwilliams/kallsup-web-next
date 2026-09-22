import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import MerchCard from "./MerchCard";
import { getMerchProducts } from "../_lib/shopify";

/**
 * Merch. Products come from the Shopify Storefront API — see `_lib/shopify.ts`.
 * A failed or unconfigured shop and an empty catalogue look the same to a
 * visitor, and both mean the same thing, so they share one message. The cause
 * is in the server log either way.
 */
async function Merch() {
  const products = await getMerchProducts();

  return (
    <section id="merch" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader title="Merch" />

        <Reveal>
          {products && products.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <MerchCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-label">Merch tillbaka snart.</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default Merch;

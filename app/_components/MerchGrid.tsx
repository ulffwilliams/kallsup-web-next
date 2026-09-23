import MerchCard from "./MerchCard";
import type { ShopifyProduct } from "../_lib/shopify";

type MerchGridProps = {
  products: ShopifyProduct[] | null;
  /** Shown when there is nothing to render. */
  emptyMessage?: string;
  linkToProduct?: boolean;
};

/**
 * The merch grid and its empty state, shared by the front-page section, the
 * catalogue and the category pages — so all three agree on what an empty grid
 * says and how the columns break.
 *
 * `null` (shop unreachable) and `[]` (nothing to sell) look the same to a
 * visitor and mean the same thing, so they share one message. The cause is in
 * the server log either way.
 */
function MerchGrid({
  products,
  emptyMessage = "Merch tillbaka snart.",
  linkToProduct = true,
}: MerchGridProps) {
  if (!products || products.length === 0) {
    return <p className="type-label">{emptyMessage}</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <MerchCard product={product} linkToProduct={linkToProduct} />
        </li>
      ))}
    </ul>
  );
}

export default MerchGrid;

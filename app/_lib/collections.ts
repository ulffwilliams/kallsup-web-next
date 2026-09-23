/**
 * Which collections count as categories. Pure, so both the pages and the
 * sitemap get the same answer without another round trip.
 */
import type { ShopifyCollection } from "./shopify";

/* Shopify creates `frontpage` for its own theme's featured row. Nobody chose
   it as a category, and it holds a mix of everything. */
const HIDDEN_HANDLES = new Set(["frontpage"]);

/**
 * Empty collections are kept on purpose: a category the shop owner created
 * but has not filled yet should still be reachable, showing an empty state
 * rather than vanishing without explanation.
 */
export function filterCategories(
  collections: ShopifyCollection[],
): ShopifyCollection[] {
  return collections.filter(
    (collection) => !HIDDEN_HANDLES.has(collection.handle),
  );
}

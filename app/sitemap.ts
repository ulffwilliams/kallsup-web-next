import type { MetadataRoute } from "next";

import { getAllProducts, getCollections } from "./_lib/shopify";
import { filterCategories } from "./_lib/collections";

const SITE_URL = "https://kallsup.se";

/**
 * Regenerates with the merch cache. A shop that fails to answer yields the
 * two static entries rather than an empty sitemap, which would tell search
 * engines the site had been emptied.
 */
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getAllProducts(),
    getCollections(),
  ]);

  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/merch`, lastModified: now, priority: 0.8 },
    ...filterCategories(collections ?? []).map((category) => ({
      url: `${SITE_URL}/merch/kategori/${category.handle}`,
      lastModified: now,
      priority: 0.6,
    })),
    ...(products ?? []).map((product) => ({
      url: `${SITE_URL}/merch/${product.handle}`,
      lastModified: now,
      priority: 0.7,
    })),
  ];
}

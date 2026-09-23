import Link from "next/link";

import type { ShopifyCollection } from "../_lib/shopify";

type CategoryNavProps = {
  categories: ShopifyCollection[];
  /** Handle of the category being viewed, or undefined on /merch. */
  current?: string;
};

/**
 * Category chips. Real links rather than client-side filters, so every
 * category has its own URL, its own metadata and a place in the sitemap.
 */
function CategoryNav({ categories, current }: CategoryNavProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Produktkategorier"
      className="mb-10 flex flex-wrap gap-x-7 gap-y-3"
    >
      <Link
        href="/merch"
        aria-current={current ? undefined : "page"}
        data-active={current ? undefined : "true"}
        className="link-nav link-underline"
      >
        Alla
      </Link>

      {categories.map((category) => {
        const active = current === category.handle;

        return (
          <Link
            key={category.handle}
            href={`/merch/kategori/${category.handle}`}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : undefined}
            className="link-nav link-underline"
          >
            {category.title}
          </Link>
        );
      })}
    </nav>
  );
}

export default CategoryNav;

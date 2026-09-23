# Merch Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give merch a full catalogue page, one page per Shopify collection, and a page per product with the metadata search engines need.

**Architecture:** Three new server-rendered routes read the Storefront API through the existing `storefront` helper and are statically generated with the same 600s revalidate window as the front page. Categories come from Shopify collections, so adding one needs no deploy. The buying controls move out of `MerchCard` into a shared `AddToCartForm` that both the grid card and the product page render, keeping variant resolution in one place.

**Tech Stack:** Next.js 16 App Router (async `params`, `generateStaticParams`, `generateMetadata`, `sitemap.ts`), React 19, Tailwind v4, Shopify Storefront API `2026-07`, `node --test` with `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-09-23-merch-pages-design.md`

---

## Context you need before starting

Read `app/_lib/shopify.ts` first. It already has: `storefront<T>(query, opts)` (auth, error handling, caching), `normalizeProduct(node, domain)`, `formatPrice`, `getMerchProducts`, and the `ShopifyProduct` / `ShopifyVariant` / `ShopifyImage` / `ShopifyOptionGroup` types.

**Facts verified against the live store on 2026-09-23 — do not re-derive:**

- Products: `test-t-shirt` (5 variants, option `Storlek`), `alldeles-for-nara-vinyl` (1 variant).
- Collections: `frontpage` ("Startsida", Shopify's own), `accessoarer` (empty), `klader` (1), `musik` (1).
- `collections(first: 20, sortKey: TITLE)` returns Accessoarer, Kläder, Musik, Startsida — alphabetical, so `frontpage` is filtered by handle, not by position.
- `seo { title description }` is `null` on every product and collection. Fall back to `title` / `description` everywhere.
- Collections have no `image`. Category pages are text-only.
- `product(handle: "finns-inte")` returns `{"product": null}` with **no** GraphQL error, so a missing handle is a plain `null` check, not an error branch.
- A GraphQL **fragment plus** `products(first: 100, sortKey: COLLECTION_DEFAULT)` inside `collection(handle:)` is confirmed working.
- The Storefront API has **no product-count field** on a collection. Do not try to show counts in the category chips.

**Two gotchas that will bite you:**

1. **Single-variant products carry a synthetic option.** `alldeles-for-nara-vinyl` reports `options: [{ name: "Title", optionValues: [{ name: "Default Title" }] }]`. Never render that as a picker. The existing guard — render chips only when `product.variants.length > 1` — handles it; keep that guard when you move the code.
2. **`app/_lib/shopify.ts` reads `process.env`.** Never import a runtime value from it into a `"use client"` component. Type-only imports are erased and safe.

## File structure

| File | Responsibility |
| --- | --- |
| `app/_lib/seo.ts` (create) | Pure metadata helpers: description truncation, JSON-LD |
| `app/_lib/seo.test.ts` (create) | Unit tests for those |
| `app/_lib/collections.ts` (create) | Pure category filtering |
| `app/_lib/collections.test.ts` (create) | Unit tests for that |
| `app/_lib/shopify.ts` (modify) | Product fragment, collection queries, product-by-handle |
| `app/_components/AddToCartForm.tsx` (create) | Option chips + add-to-cart, shared |
| `app/_components/MerchCard.tsx` (modify) | Image, title, price; delegates buying to the form |
| `app/_components/MerchGrid.tsx` (create) | The shared grid and its empty state |
| `app/_components/CategoryNav.tsx` (create) | Category chip row |
| `app/_components/Merch.tsx` (modify) | Front-page section: grid + "Se allt" |
| `app/merch/page.tsx` (create) | Full catalogue |
| `app/merch/kategori/[handle]/page.tsx` (create) | One collection |
| `app/merch/[handle]/page.tsx` (create) | One product |
| `app/sitemap.ts` (create) | Front page, `/merch`, categories, products |
| `app/_lib/site.ts` (modify) | Root-relative nav hrefs |
| `scripts/shopify-smoke.mjs` (modify) | Collection and product-by-handle checks |
| `package.json` (modify) | Test script picks up the new test files |

---

## Task 1: SEO helpers

**Files:**
- Create: `app/_lib/seo.ts`
- Create: `app/_lib/seo.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the new test files to the test script**

In `package.json`, replace the `test` script:

```json
    "test": "node --test --experimental-strip-types app/_lib/shopify.test.ts app/_lib/variants.test.ts app/_lib/cart.test.ts app/_lib/seo.test.ts app/_lib/collections.test.ts",
```

`collections.test.ts` arrives in Task 4, so `npm test` fails on the missing file until then. Run the individual file while working through Tasks 1–3.

- [ ] **Step 2: Write the failing test**

Create `app/_lib/seo.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { metaDescription, productJsonLd } from "./seo.ts";

test("returns short text unchanged", () => {
  assert.equal(metaDescription("Kallsups klädesplagg."), "Kallsups klädesplagg.");
});

test("returns an empty string for missing text", () => {
  assert.equal(metaDescription(null), "");
  assert.equal(metaDescription(undefined), "");
  assert.equal(metaDescription(""), "");
});

test("collapses whitespace so markup newlines do not leak into the tag", () => {
  assert.equal(metaDescription("Vinyl\n\n  och   kassett"), "Vinyl och kassett");
});

test("truncates on a word boundary and marks the cut", () => {
  const long = "ord ".repeat(60).trim();
  const result = metaDescription(long);

  assert.ok(result.length <= 156, `was ${result.length}`);
  assert.ok(result.endsWith("…"), result);
  assert.ok(!result.includes("or…"), "must not cut mid-word");
});

test("builds a Product schema with an in-stock offer", () => {
  const json = productJsonLd({
    title: "Alldeles för Nära - VINYL",
    description: "TestVinylskiva!",
    url: "https://kallsup.se/merch/alldeles-for-nara-vinyl",
    image: "https://cdn.shopify.com/s/files/1/afn-front.png",
    price: "300.0",
    currency: "SEK",
    available: true,
  });

  assert.equal(json["@type"], "Product");
  assert.equal(json.name, "Alldeles för Nära - VINYL");
  assert.deepEqual(json.image, [
    "https://cdn.shopify.com/s/files/1/afn-front.png",
  ]);
  assert.equal(json.offers.price, "300.0");
  assert.equal(json.offers.priceCurrency, "SEK");
  assert.equal(json.offers.availability, "https://schema.org/InStock");
  assert.equal(
    json.offers.url,
    "https://kallsup.se/merch/alldeles-for-nara-vinyl",
  );
});

test("marks a sold-out product as OutOfStock", () => {
  const json = productJsonLd({
    title: "Kallsup T",
    description: "",
    url: "https://kallsup.se/merch/kallsup-t",
    image: null,
    price: "250.0",
    currency: "SEK",
    available: false,
  });

  assert.equal(json.offers.availability, "https://schema.org/OutOfStock");
  assert.equal("image" in json, false, "omit image rather than sending null");
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test --experimental-strip-types app/_lib/seo.test.ts`
Expected: FAIL with `Cannot find module` for `./seo.ts`.

- [ ] **Step 4: Write the implementation**

Create `app/_lib/seo.ts`:

```ts
/**
 * Pure metadata helpers. No network, no env — so the unit tests cover the
 * exact strings that end up in <head> and in the JSON-LD block.
 */

/* Google truncates around 155-160 characters. Cutting ourselves keeps the
   ellipsis on a word boundary instead of mid-syllable. */
const MAX_DESCRIPTION = 155;

export function metaDescription(text: string | null | undefined): string {
  if (!text) {
    return "";
  }

  const collapsed = text.replace(/\s+/g, " ").trim();

  if (collapsed.length <= MAX_DESCRIPTION) {
    return collapsed;
  }

  const cut = collapsed.slice(0, MAX_DESCRIPTION);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;

  return `${trimmed.replace(/[.,;:!?]$/, "")}…`;
}

export type ProductJsonLdInput = {
  title: string;
  description: string;
  url: string;
  /** Absolute CDN URL, or null when the product has no photography. */
  image: string | null;
  /** Raw Shopify amount, e.g. "300.0" — not the formatted price. */
  price: string;
  currency: string;
  available: boolean;
};

/**
 * schema.org Product. The `offers` block is what puts the price and stock
 * line into a Google result; without it the markup is decorative.
 */
export function productJsonLd(input: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description,
    ...(input.image ? { image: [input.image] } : {}),
    brand: { "@type": "Brand", name: "Kallsup" },
    offers: {
      "@type": "Offer",
      url: input.url,
      price: input.price,
      priceCurrency: input.currency,
      availability: input.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test --experimental-strip-types app/_lib/seo.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add app/_lib/seo.ts app/_lib/seo.test.ts package.json
git commit -m "feat: add pure SEO metadata helpers"
```

---

## Task 2: Share one product fragment and expose raw prices

The product selection set is about to appear in four queries. Extract it once. While in there, carry the raw price amount and currency through normalization — JSON-LD needs `"300.0"` and `"SEK"`, not the formatted `"300 kr"`.

**Files:**
- Modify: `app/_lib/shopify.ts`
- Modify: `app/_lib/shopify.test.ts`

- [ ] **Step 1: Extend the test**

In `app/_lib/shopify.test.ts`, add at the end:

```ts
test("carries the raw price amount and currency for structured data", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.equal(product.priceAmount, "250.0");
  assert.equal(product.currencyCode, "SEK");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types app/_lib/shopify.test.ts`
Expected: FAIL — `product.priceAmount` is `undefined`.

- [ ] **Step 3: Extend the product type**

In `app/_lib/shopify.ts`, add two fields to `ShopifyProduct`, directly under `price`:

```ts
  /** Raw lowest amount, e.g. "250.0". Formatted output lives in `price`. */
  priceAmount: string;
  currencyCode: string;
```

- [ ] **Step 4: Set them in `normalizeProduct`**

In `normalizeProduct`, add after the `price:` line:

```ts
    priceAmount: node.priceRange.minVariantPrice.amount,
    currencyCode: node.priceRange.minVariantPrice.currencyCode,
```

- [ ] **Step 5: Extract the fragment**

Replace the whole `PRODUCTS_QUERY` declaration with a fragment plus the query that uses it:

```ts
/*
 * The selection every product-shaped query shares. `quantityAvailable` is
 * deliberately absent: the storefront token lacks
 * `unauthenticated_read_product_inventory`, and the field answers with a
 * GraphQL error rather than null, which would blank the whole response.
 *
 * `images(first: 2)` is all a grid card needs — the first shot plus the hover
 * shot. The product page fetches its own gallery through `PRODUCT_QUERY`.
 */
const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    title
    handle
    onlineStoreUrl
    availableForSale
    options {
      name
      optionValues {
        name
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 2) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

/*
 * @inContext pins the market so prices resolve in the Swedish market's currency
 * even if the store later sells in several. Without it, Shopify picks the
 * context from the *server's* location, which on Vercel is not Sweden.
 */
const PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query MerchProducts($first: Int!, $country: CountryCode!)
  @inContext(country: $country) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;
```

- [ ] **Step 6: Run the tests**

Run: `node --test --experimental-strip-types app/_lib/shopify.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Confirm the live query still works**

Run: `npm run smoke`
Expected: all checks pass. This exercises the real API, which is the only thing that proves the fragment is valid GraphQL.

- [ ] **Step 8: Commit**

```bash
git add app/_lib/shopify.ts app/_lib/shopify.test.ts
git commit -m "refactor: share one product fragment, expose raw price fields"
```

---

## Task 3: Collection queries

**Files:**
- Modify: `app/_lib/shopify.ts`

- [ ] **Step 1: Add the collection types**

In `app/_lib/shopify.ts`, after the `ShopifyProduct` type:

```ts
export type ShopifyCollection = {
  id: string;
  handle: string;
  title: string;
  /** Plain-text body from the admin. Doubles as the meta description. */
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
};
```

- [ ] **Step 2: Add the queries**

Below `PRODUCTS_QUERY`:

```ts
const COLLECTION_FIELDS = /* GraphQL */ `
  fragment CollectionFields on Collection {
    id
    handle
    title
    description
    seo {
      title
      description
    }
  }
`;

/*
 * sortKey: TITLE gives a stable alphabetical order. Shopify has no manual
 * ordering *between* collections, so anything else would shuffle as the store
 * is edited.
 */
const COLLECTIONS_QUERY = /* GraphQL */ `
  ${COLLECTION_FIELDS}
  query MerchCollections($country: CountryCode!)
  @inContext(country: $country) {
    collections(first: 20, sortKey: TITLE) {
      edges {
        node {
          ...CollectionFields
        }
      }
    }
  }
`;

const COLLECTION_QUERY = /* GraphQL */ `
  ${COLLECTION_FIELDS}
  ${PRODUCT_FIELDS}
  query MerchCollection($handle: String!, $country: CountryCode!)
  @inContext(country: $country) {
    collection(handle: $handle) {
      ...CollectionFields
      products(first: 100, sortKey: COLLECTION_DEFAULT) {
        edges {
          node {
            ...ProductFields
          }
        }
      }
    }
  }
`;
```

- [ ] **Step 3: Add the normalizer and the fetchers**

Below `getMerchProducts`:

```ts
type CollectionNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  seo: { title: string | null; description: string | null };
};

function normalizeCollection(node: CollectionNode): ShopifyCollection {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    seoTitle: node.seo.title,
    seoDescription: node.seo.description,
  };
}

/** Every collection the token can see, alphabetical, `frontpage` included. */
export async function getCollections(): Promise<ShopifyCollection[] | null> {
  const data = await storefront<{
    collections: { edges: Array<{ node: CollectionNode }> };
  }>(COLLECTIONS_QUERY, {
    next: { revalidate: 600, tags: ["merch"] },
  });

  if (!data) {
    return null;
  }

  return data.collections.edges.map(({ node }) => normalizeCollection(node));
}

/** `null` means the handle does not exist, or the shop is unreachable. */
export async function getCollection(handle: string): Promise<{
  collection: ShopifyCollection;
  products: ShopifyProduct[];
} | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!domain) {
    return null;
  }

  const data = await storefront<{
    collection:
      | (CollectionNode & {
          products: { edges: Array<{ node: ProductNode }> };
        })
      | null;
  }>(COLLECTION_QUERY, {
    variables: { handle },
    next: { revalidate: 600, tags: ["merch"] },
  });

  if (!data?.collection) {
    return null;
  }

  return {
    collection: normalizeCollection(data.collection),
    products: data.collection.products.edges.map(({ node }) =>
      normalizeProduct(node, domain),
    ),
  };
}
```

- [ ] **Step 4: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/_lib/shopify.ts
git commit -m "feat: fetch Shopify collections and their products"
```

---

## Task 4: Category filtering

**Files:**
- Create: `app/_lib/collections.ts`
- Create: `app/_lib/collections.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/_lib/collections.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { filterCategories } from "./collections.ts";
import type { ShopifyCollection } from "./shopify.ts";

function collection(handle: string, title: string): ShopifyCollection {
  return {
    id: `gid://shopify/Collection/${handle}`,
    handle,
    title,
    description: "",
    seoTitle: null,
    seoDescription: null,
  };
}

const ALL = [
  collection("accessoarer", "Accessoarer"),
  collection("klader", "Kläder"),
  collection("musik", "Musik"),
  collection("frontpage", "Startsida"),
];

test("drops Shopify's own frontpage collection", () => {
  assert.deepEqual(
    filterCategories(ALL).map((c) => c.handle),
    ["accessoarer", "klader", "musik"],
  );
});

test("preserves the order it was given", () => {
  const reversed = [...ALL].reverse();

  assert.deepEqual(
    filterCategories(reversed).map((c) => c.handle),
    ["musik", "klader", "accessoarer"],
  );
});

test("keeps categories that have no products", () => {
  // `accessoarer` is empty in the live store and must still be listed.
  assert.ok(filterCategories(ALL).some((c) => c.handle === "accessoarer"));
});

test("returns an empty list when the store has only frontpage", () => {
  assert.deepEqual(filterCategories([collection("frontpage", "Startsida")]), []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types app/_lib/collections.test.ts`
Expected: FAIL with `Cannot find module` for `./collections.ts`.

- [ ] **Step 3: Write the implementation**

Create `app/_lib/collections.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types app/_lib/collections.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, 26 tests — 6 shopify (5 existing plus the one added in Task 2), 6 variants, 4 cart, 6 seo, 4 collections.

- [ ] **Step 6: Commit**

```bash
git add app/_lib/collections.ts app/_lib/collections.test.ts
git commit -m "feat: filter Shopify collections down to real categories"
```

---

## Task 5: Full catalogue and product-by-handle

**Files:**
- Modify: `app/_lib/shopify.ts`

- [ ] **Step 1: Add the detail type**

In `app/_lib/shopify.ts`, after `ShopifyCollection`:

```ts
export type ShopifyProductDetail = ShopifyProduct & {
  /** Admin-authored HTML. Rendered with dangerouslySetInnerHTML. */
  descriptionHtml: string;
  /** Plain text version, used for meta descriptions. */
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Every shot, not just the two the grid card uses. */
  images: ShopifyImage[];
};
```

- [ ] **Step 2: Add the queries**

Below `COLLECTION_QUERY`:

```ts
const ALL_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query AllMerchProducts($first: Int!, $country: CountryCode!)
  @inContext(country: $country) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;

/*
 * Its own query rather than a reuse of ProductFields: the page needs the full
 * gallery, the description and the SEO overrides, none of which a grid card
 * should pay for.
 */
const PRODUCT_QUERY = /* GraphQL */ `
  query MerchProduct($handle: String!, $country: CountryCode!)
  @inContext(country: $country) {
    product(handle: $handle) {
      id
      title
      handle
      onlineStoreUrl
      availableForSale
      description
      descriptionHtml
      seo {
        title
        description
      }
      options {
        name
        optionValues {
          name
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 20) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;
```

- [ ] **Step 3: Add the fetchers**

Below `getCollection`:

```ts
/** The whole catalogue for `/merch`. 100 is far above the real inventory. */
export async function getAllProducts(
  first = 100,
): Promise<ShopifyProduct[] | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!domain) {
    return null;
  }

  const data = await storefront<StorefrontResponse>(ALL_PRODUCTS_QUERY, {
    variables: { first },
    next: { revalidate: 600, tags: ["merch"] },
  });

  if (!data) {
    return null;
  }

  return data.products.edges.map(({ node }) => normalizeProduct(node, domain));
}

/**
 * `null` means the handle does not exist, or the shop is unreachable — the
 * API answers a missing handle with `product: null` and no error, so the two
 * cases are indistinguishable here and both end in a 404.
 */
export async function getProduct(
  handle: string,
): Promise<ShopifyProductDetail | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!domain) {
    return null;
  }

  const data = await storefront<{
    product:
      | (ProductNode & {
          description: string;
          descriptionHtml: string;
          seo: { title: string | null; description: string | null };
          images: { edges: Array<{ node: ImageNode }> };
        })
      | null;
  }>(PRODUCT_QUERY, {
    variables: { handle },
    next: { revalidate: 600, tags: ["merch"] },
  });

  if (!data?.product) {
    return null;
  }

  const node = data.product;

  return {
    ...normalizeProduct(node, domain),
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    seoTitle: node.seo.title,
    seoDescription: node.seo.description,
    images: node.images.edges.map(({ node: image }) =>
      normalizeImage(image, node.title),
    ),
  };
}
```

`normalizeImage` is currently module-private. It stays private — `getProduct` lives in the same file.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm test`
Expected: clean typecheck, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/_lib/shopify.ts
git commit -m "feat: fetch the full catalogue and single products by handle"
```

---

## Task 6: Extract the buying controls

**Files:**
- Create: `app/_components/AddToCartForm.tsx`
- Modify: `app/_components/MerchCard.tsx`

- [ ] **Step 1: Create the shared form**

Create `app/_components/AddToCartForm.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useCart } from "./CartProvider";
import {
  defaultSelection,
  findVariant,
  isValueAvailable,
} from "../_lib/variants";
import type { Selection } from "../_lib/variants";
import type { ShopifyProduct } from "../_lib/shopify";

/**
 * Option chips plus the add-to-cart button, shared by the grid card and the
 * product page so variant resolution exists once.
 *
 * Chips render only when a product has more than one variant. Shopify gives
 * single-variant products a synthetic option — `Title: "Default Title"` — and
 * showing that as a picker would be nonsense.
 */
function AddToCartForm({ product }: { product: ShopifyProduct }) {
  const { add, openCart, isPending } = useCart();
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(product),
  );
  const [error, setError] = useState<string | null>(null);

  const variant = findVariant(product, selection);
  const hasChoices = product.variants.length > 1;
  const soldOut = !variant?.available;

  const onAdd = async () => {
    if (!variant) {
      return;
    }

    setError(null);

    const message = await add(variant.id);

    if (message) {
      setError(message);
      return;
    }

    openCart();
  };

  return (
    <div>
      {hasChoices &&
        product.optionGroups.map((group) => (
          <fieldset key={group.name} className="mt-3">
            <legend className="type-label mb-2">{group.name}</legend>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const selected = selection[group.name] === value;
                const available = isValueAvailable(
                  product,
                  group.name,
                  value,
                  selection,
                );

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setSelection((current) => ({
                        ...current,
                        [group.name]: value,
                      }))
                    }
                    className={`type-label border px-3 py-1 transition-colors ${
                      selected
                        ? "border-kall-cream text-kall-cream"
                        : "border-kall-700 text-kall-500 hover:border-kall-600 hover:text-kall-300"
                    } ${available ? "" : "line-through opacity-50"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut || isPending}
        className="btn btn-solid mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {soldOut
          ? "Slutsåld"
          : isPending
            ? "Lägger i varukorg…"
            : "Lägg i varukorg"}
      </button>

      {error && (
        <p role="alert" className="type-label mt-2 text-kall-ember">
          {error}
        </p>
      )}
    </div>
  );
}

export default AddToCartForm;
```

- [ ] **Step 2: Rewrite the card around it**

Replace the whole contents of `app/_components/MerchCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";

import AddToCartForm from "./AddToCartForm";
import type { ShopifyProduct } from "../_lib/shopify";

const IMAGE_SIZES = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw";

type MerchCardProps = {
  product: ShopifyProduct;
  /** Wraps the image and title in a link to the product page. */
  linkToProduct?: boolean;
};

/**
 * One product in a grid. A server component now — the interactive part lives
 * in `AddToCartForm`, so the card itself ships no JavaScript.
 *
 * An item with a second product shot crossfades to it on hover. Only the top
 * shot fades: dissolving both at once dips through the tile background as a
 * grey flash.
 */
function MerchCard({ product, linkToProduct = true }: MerchCardProps) {
  const href = `/merch/${product.handle}`;

  const media = product.image ? (
    <div className="relative aspect-square w-full overflow-hidden bg-kall-900/40">
      <Image
        src={product.image.url}
        alt={product.image.alt}
        fill
        sizes={IMAGE_SIZES}
        className="hover-zoom object-cover"
      />
      {product.hoverImage && (
        <Image
          src={product.hoverImage.url}
          alt=""
          aria-hidden="true"
          fill
          sizes={IMAGE_SIZES}
          className="hover-zoom object-cover opacity-0 transition-opacity duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        />
      )}
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  ) : (
    <div className="relative flex aspect-square w-full items-center justify-center border border-dashed border-kall-700 bg-kall-900/40">
      <span className="type-label uppercase">{product.title}</span>
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );

  const label = (
    <>
      <p className="mt-4 text-sm tracking-[0.04em] text-kall-cream uppercase">
        {product.title}
      </p>
      <p className="type-label mt-1">{product.price}</p>
    </>
  );

  return (
    <div className="group">
      {linkToProduct ? (
        <Link href={href} className="block">
          {media}
          {label}
        </Link>
      ) : (
        <>
          {media}
          {label}
        </>
      )}

      <AddToCartForm product={product} />
    </div>
  );
}

export default MerchCard;
```

The card loses its `"use client"` directive — check the top of the file and remove it if the rewrite did not.

Note the price: the card shows `product.price` (the lowest variant price) rather than tracking the selected variant. The selection now lives inside `AddToCartForm`, and a grid card showing "from 250 kr" is the normal pattern. The product page shows the exact variant price.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add app/_components/AddToCartForm.tsx app/_components/MerchCard.tsx
git commit -m "refactor: extract AddToCartForm so card and product page share it"
```

---

## Task 7: Shared grid

**Files:**
- Create: `app/_components/MerchGrid.tsx`
- Modify: `app/_components/Merch.tsx`

- [ ] **Step 1: Create the grid**

Create `app/_components/MerchGrid.tsx`:

```tsx
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
```

- [ ] **Step 2: Rewrite the front-page section**

Replace the whole contents of `app/_components/Merch.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify the front page still renders products**

Run: `npm run build && grep -c "Test t-shirt" .next/server/app/index.html`
Expected: build clean, count of at least 1.

- [ ] **Step 4: Commit**

```bash
git add app/_components/MerchGrid.tsx app/_components/Merch.tsx
git commit -m "feat: share one merch grid and link the front page to /merch"
```

---

## Task 8: Category chips

**Files:**
- Create: `app/_components/CategoryNav.tsx`

- [ ] **Step 1: Create the component**

Create `app/_components/CategoryNav.tsx`:

```tsx
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

  const chip = (active: boolean) =>
    `type-label border px-3 py-1 transition-colors ${
      active
        ? "border-kall-cream text-kall-cream"
        : "border-kall-700 text-kall-500 hover:border-kall-600 hover:text-kall-300"
    }`;

  return (
    <nav aria-label="Produktkategorier" className="mb-10 flex flex-wrap gap-2">
      <Link
        href="/merch"
        aria-current={current ? undefined : "page"}
        className={chip(!current)}
      >
        Alla
      </Link>

      {categories.map((category) => (
        <Link
          key={category.handle}
          href={`/merch/kategori/${category.handle}`}
          aria-current={current === category.handle ? "page" : undefined}
          className={chip(current === category.handle)}
        >
          {category.title}
        </Link>
      ))}
    </nav>
  );
}

export default CategoryNav;
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_components/CategoryNav.tsx
git commit -m "feat: add category chip navigation"
```

---

## Task 9: The catalogue page

**Files:**
- Create: `app/merch/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/merch/page.tsx`:

```tsx
import type { Metadata } from "next";

import SectionHeader from "../_components/SectionHeader";
import Reveal from "../_components/Reveal";
import MerchGrid from "../_components/MerchGrid";
import CategoryNav from "../_components/CategoryNav";
import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import Background from "../_components/Background";
import { getAllProducts, getCollections } from "../_lib/shopify";
import { filterCategories } from "../_lib/collections";
import { metaDescription } from "../_lib/seo";

/* Matches the front page's window — merch changes on the same rhythm. */
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Merch",
  description: metaDescription(
    "Vinyl, kläder och accessoarer från Kallsup. Skickas från Sverige.",
  ),
  alternates: { canonical: "/merch" },
  openGraph: {
    title: "Merch — Kallsup",
    description: "Vinyl, kläder och accessoarer från Kallsup.",
    url: "/merch",
    type: "website",
  },
};

export default async function MerchPage() {
  const [products, collections] = await Promise.all([
    getAllProducts(),
    getCollections(),
  ]);

  const categories = filterCategories(collections ?? []);

  return (
    <div className="relative isolate w-full">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10">
        <section className="section-y pt-32 md:pt-40">
          <div className="shell">
            <SectionHeader title="Merch" />

            <Reveal>
              <CategoryNav categories={categories} />
              <MerchGrid products={products} />
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
```

The extra top padding replaces the hero the front page has: without it the fixed header overlaps the title.

- [ ] **Step 2: Verify it renders**

Run: `npm run build`
Expected: clean build, with `/merch` listed as a static route.

Then: `grep -o "Accessoarer\|Kläder\|Musik" .next/server/app/merch.html | sort -u`
Expected: all three category names, proving the chips rendered.

- [ ] **Step 3: Commit**

```bash
git add app/merch/page.tsx
git commit -m "feat: add the /merch catalogue page"
```

---

## Task 10: Category pages

**Files:**
- Create: `app/merch/kategori/[handle]/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/merch/kategori/[handle]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SectionHeader from "../../../_components/SectionHeader";
import Reveal from "../../../_components/Reveal";
import MerchGrid from "../../../_components/MerchGrid";
import CategoryNav from "../../../_components/CategoryNav";
import SiteHeader from "../../../_components/SiteHeader";
import SiteFooter from "../../../_components/SiteFooter";
import Background from "../../../_components/Background";
import { getCollection, getCollections } from "../../../_lib/shopify";
import { filterCategories } from "../../../_lib/collections";
import { metaDescription } from "../../../_lib/seo";

export const revalidate = 600;

type PageProps = { params: Promise<{ handle: string }> };

/**
 * Prerenders one page per category. An unreachable shop returns an empty list
 * rather than failing the build — the routes then render on demand.
 */
export async function generateStaticParams() {
  const collections = await getCollections();

  return filterCategories(collections ?? []).map((category) => ({
    handle: category.handle,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const result = await getCollection(handle);

  if (!result) {
    return { title: "Kategorin finns inte" };
  }

  const { collection } = result;
  const title = collection.seoTitle ?? collection.title;
  const description = metaDescription(
    collection.seoDescription ?? collection.description,
  );

  return {
    title,
    description,
    alternates: { canonical: `/merch/kategori/${collection.handle}` },
    openGraph: {
      title: `${title} — Kallsup`,
      description,
      url: `/merch/kategori/${collection.handle}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { handle } = await params;
  const [result, collections] = await Promise.all([
    getCollection(handle),
    getCollections(),
  ]);

  if (!result) {
    notFound();
  }

  const { collection, products } = result;
  const categories = filterCategories(collections ?? []);

  return (
    <div className="relative isolate w-full">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10">
        <section className="section-y pt-32 md:pt-40">
          <div className="shell">
            <SectionHeader title={collection.title} />

            <Reveal>
              <CategoryNav categories={categories} current={collection.handle} />

              {collection.description && (
                <p className="type-meta mb-10 max-w-prose">
                  {collection.description}
                </p>
              )}

              <MerchGrid
                products={products}
                emptyMessage="Inga produkter här just nu."
              />
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verify all three categories prerendered**

Run: `npm run build`
Expected: the route list shows `/merch/kategori/[handle]` as static with 3 prerendered paths.

Then: `grep -o "Inga produkter här just nu" .next/server/app/merch/kategori/accessoarer.html`
Expected: one match — `accessoarer` is empty in the live store, so this proves the empty state renders rather than the page 404ing.

- [ ] **Step 3: Commit**

```bash
git add "app/merch/kategori/[handle]/page.tsx"
git commit -m "feat: add category pages with their own metadata"
```

---

## Task 11: Product pages

**Files:**
- Create: `app/merch/[handle]/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/merch/[handle]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import AddToCartForm from "../../_components/AddToCartForm";
import Reveal from "../../_components/Reveal";
import SiteHeader from "../../_components/SiteHeader";
import SiteFooter from "../../_components/SiteFooter";
import Background from "../../_components/Background";
import { getAllProducts, getProduct } from "../../_lib/shopify";
import { metaDescription, productJsonLd } from "../../_lib/seo";

export const revalidate = 600;

const SITE_URL = "https://kallsup.se";

type PageProps = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  const products = await getAllProducts();

  return (products ?? []).map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Produkten finns inte" };
  }

  const title = product.seoTitle ?? product.title;
  const description = metaDescription(
    product.seoDescription ?? product.description,
  );
  const url = `/merch/${product.handle}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Kallsup`,
      description,
      url,
      type: "website",
      images: product.image
        ? [
            {
              url: product.image.url,
              width: product.image.width,
              height: product.image.height,
              alt: product.image.alt,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  const jsonLd = productJsonLd({
    title: product.title,
    description: metaDescription(product.seoDescription ?? product.description),
    url: `${SITE_URL}/merch/${product.handle}`,
    image: product.image?.url ?? null,
    price: product.priceAmount,
    currency: product.currencyCode,
    available: product.available,
  });

  return (
    <div className="relative isolate w-full">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10">
        <section className="section-y pt-32 md:pt-40">
          <div className="shell">
            <Reveal>
              <nav aria-label="Brödsmulor" className="type-label mb-8">
                <Link href="/merch" className="hover:text-kall-cream">
                  Merch
                </Link>
                <span aria-hidden="true"> / </span>
                <span>{product.title}</span>
              </nav>
            </Reveal>

            <Reveal className="grid gap-10 md:grid-cols-2 md:gap-14">
              <div className="flex flex-col gap-4">
                {product.images.length > 0 ? (
                  product.images.map((image) => (
                    <div
                      key={image.url}
                      className="relative aspect-square w-full overflow-hidden bg-kall-900/40"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 90vw, 45vw"
                        className="object-cover"
                      />
                      <div className="grain-overlay" aria-hidden="true" />
                    </div>
                  ))
                ) : (
                  <div className="relative flex aspect-square w-full items-center justify-center border border-dashed border-kall-700 bg-kall-900/40">
                    <span className="type-label uppercase">
                      {product.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:sticky md:top-28 md:self-start">
                <h1 className="type-huge mb-4 text-kall-cream">
                  {product.title}
                </h1>
                <p className="type-label mb-6">{product.price}</p>

                <AddToCartForm product={product} />

                {product.descriptionHtml && (
                  /* HTML authored in the Shopify admin, not by visitors, so
                     this is not an injection surface. */
                  <div
                    className="type-meta mt-10 max-w-prose space-y-4"
                    dangerouslySetInnerHTML={{
                      __html: product.descriptionHtml,
                    }}
                  />
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify both products prerendered with structured data**

Run: `npm run build`
Expected: `/merch/[handle]` static with 2 prerendered paths.

Then: `grep -o "application/ld+json" .next/server/app/merch/alldeles-for-nara-vinyl.html`
Expected: one match.

Then: `grep -o "schema.org/InStock" .next/server/app/merch/alldeles-for-nara-vinyl.html`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add "app/merch/[handle]/page.tsx"
git commit -m "feat: add product pages with JSON-LD structured data"
```

---

## Task 12: Sitemap and navigation

**Files:**
- Create: `app/sitemap.ts`
- Modify: `app/_lib/site.ts`

- [ ] **Step 1: Create the sitemap**

Create `app/sitemap.ts`:

```ts
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
```

- [ ] **Step 2: Make the nav work from every route**

In `app/_lib/site.ts`, replace the `nav` export:

```ts
/* Root-relative so the anchors resolve from /merch and the product pages too;
   a bare "#live" points at nothing outside the front page. Merch is now a
   page of its own rather than a section link. */
export const nav = [
  { href: "/#live", label: "Live" },
  { href: "/#musik", label: "Musik" },
  { href: "/merch", label: "Merch" },
  { href: "/#kontakt", label: "Kontakt" },
] as const;
```

- [ ] **Step 3: Check nothing depended on the old bare anchors**

Run: `grep -rn '"#live"\|"#musik"\|"#merch"\|"#kontakt"' app/`
Expected: only `id="live"`, `id="musik"`, `id="merch"`, `id="kontakt"` section attributes — no remaining `href` matches outside `site.ts`.

If `SiteHeader.tsx` styles the Live link with `item.href === "#live"`, that comparison now never matches. Update it to `item.href === "/#live"`.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: clean, with `/sitemap.xml` in the route list.

Then start the server and check it: `npx next start -p 3100` in one shell, then
`curl -s http://localhost:3100/sitemap.xml | grep -c "<loc>"`
Expected: 7 — front page, `/merch`, 3 categories, 2 products. Stop the server afterwards.

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/_lib/site.ts app/_components/SiteHeader.tsx
git commit -m "feat: add sitemap and make nav anchors work off the front page"
```

---

## Task 13: Extend the smoke script

**Files:**
- Modify: `scripts/shopify-smoke.mjs`

- [ ] **Step 1: Add the queries**

In `scripts/shopify-smoke.mjs`, add below the existing `CART_CREATE` constant:

```js
const COLLECTIONS = `
  query Smoke($country: CountryCode!) @inContext(country: $country) {
    collections(first: 20, sortKey: TITLE) {
      edges {
        node {
          handle
          title
          description
          seo { title description }
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE = `
  query Smoke($handle: String!, $country: CountryCode!)
  @inContext(country: $country) {
    product(handle: $handle) {
      handle
      description
      descriptionHtml
      seo { title description }
      images(first: 10) { edges { node { url } } }
      variants(first: 20) { edges { node { id } } }
    }
  }
`;
```

- [ ] **Step 2: Add the checks**

Directly above the final `if (failures.length > 0)` block:

```js
console.log("collections");
const collectionData = await query({
  query: COLLECTIONS,
  variables: { country: "SE" },
});
const collections = collectionData.collections.edges.map((edge) => edge.node);
const categories = collections.filter((node) => node.handle !== "frontpage");

check("the store exposes at least one category collection", categories.length > 0);
check(
  "categories are sorted alphabetically by title",
  categories
    .map((node) => node.title)
    .every((title, index, all) => index === 0 || all[index - 1] <= title),
);
check(
  "every category has a description to use as its meta description",
  categories.every((node) => typeof node.description === "string"),
);

console.log("product by handle");
const detail = await query({
  query: PRODUCT_BY_HANDLE,
  variables: { handle: product.handle, country: "SE" },
});

check("product(handle:) resolves the grid's handle", Boolean(detail.product));
check(
  "product exposes descriptionHtml for the product page",
  typeof detail.product?.descriptionHtml === "string",
);
check(
  "product exposes a gallery",
  Array.isArray(detail.product?.images?.edges),
);

const missing = await query({
  query: PRODUCT_BY_HANDLE,
  variables: { handle: "den-har-finns-inte-alls", country: "SE" },
});

check(
  "an unknown handle answers null rather than an error",
  missing.product === null,
);
```

- [ ] **Step 3: Run it**

Run: `npm run smoke`
Expected: every line prints `ok`, ending with `All checks passed.`

- [ ] **Step 4: Commit**

```bash
git add scripts/shopify-smoke.mjs
git commit -m "test: cover collections and product-by-handle in the smoke script"
```

---

## Task 14: Full verification

**Files:** none — this task only runs and records.

- [ ] **Step 1: Unit tests**

Run: `npm test`
Expected: all tests pass, 0 fail. Record the count.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no *new* problems. The repo already has 2 errors and 7 warnings on `main`, all in `app/apps/latordnaren/**` and `tailwind.config.mjs`. Anything reported in a file this plan touched is a real failure.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean, with these routes prerendered:

```
/                             static
/merch                        static
/merch/[handle]               static, 2 paths
/merch/kategori/[handle]      static, 3 paths
/sitemap.xml
```

- [ ] **Step 4: Smoke**

Run: `npm run smoke`
Expected: all checks pass.

- [ ] **Step 5: Manual pass**

Run `npm run dev`, then confirm:

1. `/merch` lists both products with chips "Alla, Accessoarer, Kläder, Musik".
2. Clicking "Kläder" lands on `/merch/kategori/klader` showing only the t-shirt, with the chip marked current and the description text under the title.
3. `/merch/kategori/accessoarer` shows "Inga produkter här just nu." — not a 404.
4. Clicking a product card opens `/merch/<handle>` with the gallery, the description, and a working size picker.
5. Adding from the product page opens the drawer and increments the header count.
6. `/merch/finns-inte` renders the 404 page.
7. From `/merch`, the nav "Live" link returns to `/#live` and scrolls to the gigs.
8. View source on a product page: `<title>`, `<meta name="description">`, `<link rel="canonical">` and the `application/ld+json` block are all present and filled.

- [ ] **Step 6: Record the result**

Report which steps passed and paste the output of `npm test`, `npm run build`
and `npm run smoke`. Do not claim a step passed that was not run.

---

## Notes for whoever picks this up

- **`musik` had no products earlier today** even though the vinyl carries `productType: musik`; it resolved before this plan was written. If a category looks empty in testing, check the collection's conditions in the admin before suspecting the code.
- **The `merch` cache tag is still unused.** Product edits appear within 600s. A Shopify webhook calling `revalidateTag("merch")` would make it instant; deliberately deferred.
- **`/merch/kategori/` is a reserved segment.** A collection with the handle `kategori` would be unreachable. Nothing in the store uses it.

# Shopify Merch Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded Bandcamp merch cards with live Shopify products that visitors can add to an on-site cart before checking out on Shopify.

**Architecture:** `Merch.tsx` stays a server component and renders products fetched through the Storefront API with a 600s cache. Cart mutations run as server actions that keep the cart id in an httpOnly cookie, so no token or cart identity reaches the browser. A client `CartProvider` in the root layout holds the returned cart and feeds both the header badge and a slide-over drawer, which hands off to Shopify's hosted checkout by redirect.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, Tailwind v4, Shopify Storefront API `2026-07`, `node --test` with `--experimental-strip-types` for unit tests (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-09-22-shopify-merch-design.md`

---

## Context you need before starting

**The store is already configured.** `.env.local` holds:

```
SHOPIFY_STORE_DOMAIN=05h8cn-0j.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<32 hex chars>
```

**Facts verified against the live dev store on 2026-09-22 — do not re-derive:**

- API version `2026-07` works. `shopify.ts` already defaults to it.
- Store currency is SEK. `@inContext(country: SE)` is correct.
- Catalog: one product, `test-t-shirt`, one option group `Storlek` with values S, M, L, XL, 2XL.
- `onlineStoreUrl` is `null` because the dev store is password-protected. The existing fallback to `https://${domain}/products/${handle}` handles it.
- `quantityAvailable` raises `ACCESS_DENIED` — the token lacks `unauthenticated_read_product_inventory`. **Never query that field.** It is a GraphQL error, not a `null`, so it would blank the whole section.
- `options { values }` does not exist in `2026-07`. The shape is `options { name optionValues { name } }`.
- `cartCreate` works with the public token. Cart ids look like
  `gid://shopify/Cart/hWNH7...?key=6174cfd4...` — store the whole string.

**Gotcha that will bite you:** `app/_lib/shopify.ts` reads `process.env` and holds the token logic. Never import a runtime value from it into a `"use client"` component — that pulls the module into the client bundle. Type-only imports (`import type { ... }`) are erased at compile time and are safe. Client-safe pure helpers live in `app/_lib/variants.ts` for exactly this reason.

## File structure

| File                                        | Responsibility                                            |
| ------------------------------------------- | --------------------------------------------------------- |
| `app/_lib/shopify.ts` (modify)              | Storefront transport + product queries and normalization  |
| `app/_lib/shopify.test.ts` (create)         | Unit tests for product normalization and price formatting |
| `app/_lib/variants.ts` (create)             | Pure, client-safe variant/option resolution               |
| `app/_lib/variants.test.ts` (create)        | Unit tests for variant resolution                         |
| `app/_lib/cart.ts` (create)                 | Cart GraphQL operations + cart normalization              |
| `app/_lib/cart.test.ts` (create)            | Unit tests for cart normalization                         |
| `app/_lib/cart-actions.ts` (create)         | Server actions + cart cookie lifecycle                    |
| `app/_components/CartProvider.tsx` (create) | Client cart context and drawer open state                 |
| `app/_components/CartDrawer.tsx` (create)   | Slide-over cart UI, checkout handoff                      |
| `app/_components/MerchCard.tsx` (create)    | One product card: option chips + add to cart              |
| `app/_components/Merch.tsx` (modify)        | Server component: fetch products, render grid             |
| `app/_components/SiteHeader.tsx` (modify)   | Cart trigger button with quantity badge                   |
| `app/layout.tsx` (modify)                   | Mount `CartProvider` + `CartDrawer`                       |
| `app/_lib/merch.ts` (delete)                | Hardcoded Bandcamp items, no longer used                  |
| `scripts/shopify-smoke.mjs` (create)        | Live API shape assertions                                 |
| `package.json` (modify)                     | `test` and `smoke` scripts                                |

---

## Task 1: Extract the `storefront` transport helper

Pure refactor. `getMerchProducts` keeps its current behaviour; the fetch, auth, and error plumbing move into a helper that cart operations will reuse.

**Files:**

- Modify: `app/_lib/shopify.ts`

- [ ] **Step 1: Add the transport helper**

Insert after the `isShopifyConfigured` function in `app/_lib/shopify.ts`:

```ts
type StorefrontRequest = {
  variables?: Record<string, unknown>;
  /** Pass `"no-store"` for cart traffic. Omit to use `next` caching. */
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

/**
 * Single entry point for Storefront traffic. Returns `data` or `null` —
 * callers decide what an absent response means for their UI.
 *
 * Every operation must declare `$country: CountryCode!` and apply
 * `@inContext(country: $country)`; the variable is injected here so pricing
 * resolves in the Swedish market rather than the server's location.
 */
export async function storefront<T>(
  query: string,
  { variables, cache, next }: StorefrontRequest = {},
): Promise<T | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const auth = authHeader();

  if (!domain || !auth) {
    return null;
  }

  try {
    const response = await fetch(
      `https://${domain}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
        body: JSON.stringify({
          query,
          variables: { country: MARKET_COUNTRY, ...variables },
        }),
        ...(cache ? { cache } : {}),
        ...(next ? { next } : {}),
      },
    );

    if (!response.ok) {
      console.error(
        `Shopify Storefront ${response.status} ${response.statusText} ` +
          `(domain=${domain}, apiVersion=${API_VERSION}). ` +
          `404 usually means a wrong domain, 401/403 a bad or unscoped token, ` +
          `400 an unsupported API version.`,
      );
      return null;
    }

    const payload = (await response.json()) as GraphQLResponse<T>;

    if (payload.errors?.length) {
      console.error(
        "Shopify Storefront GraphQL errors:",
        payload.errors.map((error) => error.message).join("; "),
      );
      return null;
    }

    return payload.data ?? null;
  } catch (error) {
    console.error("Shopify Storefront request failed:", error);
    return null;
  }
}
```

- [ ] **Step 2: Rewrite `getMerchProducts` to use it**

Replace the whole existing `getMerchProducts` function body with:

```ts
export async function getMerchProducts(
  first = 8,
): Promise<ShopifyProduct[] | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!domain) {
    return null;
  }

  const data = await storefront<StorefrontResponse>(PRODUCTS_QUERY, {
    variables: { first },
    // Products change rarely; matches the page's own revalidate window.
    next: { revalidate: 600, tags: ["merch"] },
  });

  if (!data) {
    return null;
  }

  return data.products.edges.map(({ node }) => normalizeProduct(node, domain));
}
```

- [ ] **Step 3: Adjust the `StorefrontResponse` type**

The helper already unwraps `data`, so the type describes the inner shape only. Replace the existing `StorefrontResponse` type with:

```ts
type ProductNode = {
  id: string;
  title: string;
  handle: string;
  onlineStoreUrl: string | null;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

type StorefrontResponse = {
  products: {
    edges: Array<{ node: ProductNode }>;
  };
};
```

- [ ] **Step 4: Add the `normalizeProduct` function**

Add above `getMerchProducts`. Task 2 extends it; this version only moves the existing mapping out of the fetch function:

```ts
export function normalizeProduct(
  node: ProductNode,
  domain: string,
): ShopifyProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    url: node.onlineStoreUrl ?? `https://${domain}/products/${node.handle}`,
    price: formatPrice(
      node.priceRange.minVariantPrice.amount,
      node.priceRange.minVariantPrice.currencyCode,
    ),
    available: node.availableForSale,
    image: node.featuredImage
      ? {
          url: node.featuredImage.url,
          alt: node.featuredImage.altText ?? node.title,
          width: node.featuredImage.width ?? 1200,
          height: node.featuredImage.height ?? 1200,
        }
      : null,
  };
}
```

- [ ] **Step 5: Verify nothing broke**

Run: `npx tsc --noEmit`
Expected: no errors. `Merch.tsx` does not import these yet, so nothing else changes.

- [ ] **Step 6: Commit**

```bash
git add app/_lib/shopify.ts
git commit -m "refactor: extract storefront transport helper from getMerchProducts"
```

---

## Task 2: Query variants, options, and a second image

**Files:**

- Modify: `app/_lib/shopify.ts`
- Create: `app/_lib/shopify.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the test script to `package.json`**

In the `scripts` block, add:

```json
    "test": "node --test --experimental-strip-types app/_lib/shopify.test.ts app/_lib/variants.test.ts app/_lib/cart.test.ts",
```

The three files are listed explicitly rather than globbed so a typo in a filename fails loudly instead of silently running zero tests. Tasks 3 and 4 create the other two; until then `npm test` will fail on the missing files, which is expected.

- [ ] **Step 2: Write the failing test**

Create `app/_lib/shopify.test.ts`. The fixture is a trimmed copy of a real `2026-07` response from the dev store:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeProduct } from "./shopify.ts";

const NODE = {
  id: "gid://shopify/Product/16578039153031",
  title: "Test t-shirt",
  handle: "test-t-shirt",
  onlineStoreUrl: null,
  availableForSale: true,
  options: [
    {
      name: "Storlek",
      optionValues: [{ name: "S" }, { name: "M" }, { name: "L" }],
    },
  ],
  priceRange: {
    minVariantPrice: { amount: "250.0", currencyCode: "SEK" },
  },
  images: {
    edges: [
      {
        node: {
          url: "https://cdn.shopify.com/s/files/1/tee.png",
          altText: null,
          width: 4350,
          height: 3850,
        },
      },
      {
        node: {
          url: "https://cdn.shopify.com/s/files/1/tee-back.png",
          altText: null,
          width: 4350,
          height: 3850,
        },
      },
    ],
  },
  variants: {
    edges: [
      {
        node: {
          id: "gid://shopify/ProductVariant/1",
          title: "S",
          availableForSale: true,
          price: { amount: "250.0", currencyCode: "SEK" },
          selectedOptions: [{ name: "Storlek", value: "S" }],
        },
      },
      {
        node: {
          id: "gid://shopify/ProductVariant/2",
          title: "M",
          availableForSale: false,
          price: { amount: "250.0", currencyCode: "SEK" },
          selectedOptions: [{ name: "Storlek", value: "M" }],
        },
      },
    ],
  },
};

test("falls back to a constructed product URL when the store is password-protected", () => {
  const product = normalizeProduct(NODE, "05h8cn-0j.myshopify.com");

  assert.equal(
    product.url,
    "https://05h8cn-0j.myshopify.com/products/test-t-shirt",
  );
});

test("formats prices in the store currency without stray decimals", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.match(product.price, /250/);
  assert.doesNotMatch(product.price, /250,00/);
});

test("maps the first image to image and the second to hoverImage", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.equal(product.image?.url, "https://cdn.shopify.com/s/files/1/tee.png");
  assert.equal(product.image?.alt, "Test t-shirt");
  assert.equal(
    product.hoverImage?.url,
    "https://cdn.shopify.com/s/files/1/tee-back.png",
  );
  assert.equal(product.hoverImage?.alt, "");
});

test("flattens selectedOptions into a lookup keyed by option name", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.deepEqual(product.variants[0].options, { Storlek: "S" });
  assert.equal(product.variants[0].available, true);
  assert.equal(product.variants[1].available, false);
});

test("exposes option groups in the order the store defines them", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.deepEqual(product.optionGroups, [
    { name: "Storlek", values: ["S", "M", "L"] },
  ]);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test --experimental-strip-types app/_lib/shopify.test.ts`
Expected: FAIL. The fixture has `options`, `images`, and `variants`, which `normalizeProduct` does not read yet, so `product.hoverImage`, `product.variants`, and `product.optionGroups` are `undefined`.

- [ ] **Step 4: Extend the types**

In `app/_lib/shopify.ts`, replace the `ShopifyProduct` type and add the new ones:

```ts
export type ShopifyImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type ShopifyVariant = {
  id: string;
  title: string;
  available: boolean;
  price: string;
  /** `selectedOptions` flattened: `{ Storlek: "M" }`. */
  options: Record<string, string>;
};

export type ShopifyOptionGroup = {
  name: string;
  values: string[];
};

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  url: string;
  /** Lowest variant price, already formatted for display. */
  price: string;
  available: boolean;
  image: ShopifyImage | null;
  /** Second product shot, used for the hover crossfade. */
  hoverImage: ShopifyImage | null;
  optionGroups: ShopifyOptionGroup[];
  variants: ShopifyVariant[];
};
```

- [ ] **Step 5: Extend the query**

Replace `PRODUCTS_QUERY` in `app/_lib/shopify.ts`:

```ts
/*
 * @inContext pins the market so prices resolve in the Swedish market's currency
 * even if the store later sells in several. Without it, Shopify picks the
 * context from the *server's* location, which on Vercel is not Sweden.
 *
 * `quantityAvailable` is deliberately absent: the storefront token lacks
 * `unauthenticated_read_product_inventory`, and the field answers with a
 * GraphQL error rather than null, which would blank the entire section.
 */
const PRODUCTS_QUERY = /* GraphQL */ `
  query MerchProducts($first: Int!, $country: CountryCode!)
  @inContext(country: $country) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
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
      }
    }
  }
`;
```

- [ ] **Step 6: Extend `ProductNode` and `normalizeProduct`**

Replace the `ProductNode` type from Task 1:

```ts
type ImageNode = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  onlineStoreUrl: string | null;
  availableForSale: boolean;
  options: Array<{ name: string; optionValues: Array<{ name: string }> }>;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  images: { edges: Array<{ node: ImageNode }> };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
};
```

Replace `normalizeProduct` with:

```ts
/** `altText` is decorative on the hover shot — the first image carries the label. */
function normalizeImage(node: ImageNode, fallbackAlt: string): ShopifyImage {
  return {
    url: node.url,
    alt: node.altText ?? fallbackAlt,
    width: node.width ?? 1200,
    height: node.height ?? 1200,
  };
}

export function normalizeProduct(
  node: ProductNode,
  domain: string,
): ShopifyProduct {
  const [first, second] = node.images.edges;

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    url: node.onlineStoreUrl ?? `https://${domain}/products/${node.handle}`,
    price: formatPrice(
      node.priceRange.minVariantPrice.amount,
      node.priceRange.minVariantPrice.currencyCode,
    ),
    available: node.availableForSale,
    image: first ? normalizeImage(first.node, node.title) : null,
    hoverImage: second ? normalizeImage(second.node, "") : null,
    optionGroups: node.options.map((option) => ({
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    variants: node.variants.edges.map(({ node: variant }) => ({
      id: variant.id,
      title: variant.title,
      available: variant.availableForSale,
      price: formatPrice(variant.price.amount, variant.price.currencyCode),
      options: Object.fromEntries(
        variant.selectedOptions.map((option) => [option.name, option.value]),
      ),
    })),
  };
}
```

The hover shot is decorative — the card renders it with `alt=""` and
`aria-hidden`, so `normalizeImage` gets `""` as its fallback rather than the
product title. A store-supplied `altText` still wins when one is set.

- [ ] **Step 7: Run the test to verify it passes**

Run: `node --test --experimental-strip-types app/_lib/shopify.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 8: Commit**

```bash
git add app/_lib/shopify.ts app/_lib/shopify.test.ts package.json
git commit -m "feat: query Shopify variants, option groups and hover image"
```

---

## Task 3: Client-safe variant resolution

**Files:**

- Create: `app/_lib/variants.ts`
- Create: `app/_lib/variants.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/_lib/variants.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultSelection, findVariant, isValueAvailable } from "./variants.ts";
import type { ShopifyProduct } from "./shopify.ts";

function product(): ShopifyProduct {
  return {
    id: "gid://shopify/Product/1",
    title: "Test t-shirt",
    handle: "test-t-shirt",
    url: "https://example.myshopify.com/products/test-t-shirt",
    price: "250 kr",
    available: true,
    image: null,
    hoverImage: null,
    optionGroups: [
      { name: "Storlek", values: ["S", "M"] },
      { name: "Färg", values: ["Svart", "Vit"] },
    ],
    variants: [
      {
        id: "v1",
        title: "S / Svart",
        available: false,
        price: "250 kr",
        options: { Storlek: "S", Färg: "Svart" },
      },
      {
        id: "v2",
        title: "S / Vit",
        available: true,
        price: "250 kr",
        options: { Storlek: "S", Färg: "Vit" },
      },
      {
        id: "v3",
        title: "M / Svart",
        available: true,
        price: "250 kr",
        options: { Storlek: "M", Färg: "Svart" },
      },
    ],
  };
}

test("defaults to the first purchasable variant, not the first listed", () => {
  assert.deepEqual(defaultSelection(product()), {
    Storlek: "S",
    Färg: "Vit",
  });
});

test("falls back to the first variant when everything is sold out", () => {
  const soldOut = product();
  soldOut.variants = soldOut.variants.map((variant) => ({
    ...variant,
    available: false,
  }));

  assert.deepEqual(defaultSelection(soldOut), {
    Storlek: "S",
    Färg: "Svart",
  });
});

test("returns an empty selection for a product with no variants", () => {
  const empty = product();
  empty.variants = [];

  assert.deepEqual(defaultSelection(empty), {});
});

test("finds the variant matching every selected option", () => {
  assert.equal(
    findVariant(product(), { Storlek: "M", Färg: "Svart" })?.id,
    "v3",
  );
});

test("returns null when the combination does not exist", () => {
  assert.equal(findVariant(product(), { Storlek: "M", Färg: "Vit" }), null);
});

test("reports a value as available only when some purchasable variant keeps the other selections", () => {
  const p = product();

  // With Färg=Svart selected, only M is purchasable (S/Svart is sold out).
  assert.equal(isValueAvailable(p, "Storlek", "M", { Färg: "Svart" }), true);
  assert.equal(isValueAvailable(p, "Storlek", "S", { Färg: "Svart" }), false);
  // With Färg=Vit selected, only S exists.
  assert.equal(isValueAvailable(p, "Storlek", "S", { Färg: "Vit" }), true);
  assert.equal(isValueAvailable(p, "Storlek", "M", { Färg: "Vit" }), false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types app/_lib/variants.test.ts`
Expected: FAIL with `Cannot find module` for `./variants.ts`.

- [ ] **Step 3: Write the implementation**

Create `app/_lib/variants.ts`:

```ts
/**
 * Pure option/variant resolution, kept apart from `shopify.ts` so client
 * components can import it without dragging the API module — and the token
 * logic it reads from `process.env` — into the browser bundle. The import
 * below is type-only and is erased at compile time.
 */
import type { ShopifyProduct, ShopifyVariant } from "./shopify";

export type Selection = Record<string, string>;

/**
 * Opens the card on something a visitor can actually buy. Falls back to the
 * first variant so a fully sold-out product still shows a coherent state.
 */
export function defaultSelection(product: ShopifyProduct): Selection {
  const variant =
    product.variants.find((candidate) => candidate.available) ??
    product.variants[0];

  return variant ? { ...variant.options } : {};
}

export function findVariant(
  product: ShopifyProduct,
  selection: Selection,
): ShopifyVariant | null {
  return (
    product.variants.find((variant) =>
      product.optionGroups.every(
        (group) => variant.options[group.name] === selection[group.name],
      ),
    ) ?? null
  );
}

/**
 * Whether picking `value` in `groupName` leads to something purchasable,
 * holding the visitor's other choices fixed. Drives the disabled state on the
 * option chips so dead ends are visible before they are clicked.
 */
export function isValueAvailable(
  product: ShopifyProduct,
  groupName: string,
  value: string,
  selection: Selection,
): boolean {
  return product.variants.some(
    (variant) =>
      variant.available &&
      variant.options[groupName] === value &&
      product.optionGroups.every(
        (group) =>
          group.name === groupName ||
          selection[group.name] === undefined ||
          variant.options[group.name] === selection[group.name],
      ),
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types app/_lib/variants.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add app/_lib/variants.ts app/_lib/variants.test.ts
git commit -m "feat: add client-safe variant resolution helpers"
```

---

## Task 4: Cart operations and normalization

**Files:**

- Create: `app/_lib/cart.ts`
- Create: `app/_lib/cart.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/_lib/cart.test.ts`. The fixture is a trimmed copy of a real `cartCreate` response from the dev store:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeCart } from "./cart.ts";

const CART_NODE = {
  id: "gid://shopify/Cart/hWNH7LYCO8K8SoHbr0RNgTHq?key=6174cfd4273552ad51c704a2b65727bc",
  checkoutUrl:
    "https://05h8cn-0j.myshopify.com/cart/c/hWNH7LYCO8K8SoHbr0RNgTHq?key=Qp7b",
  totalQuantity: 2,
  cost: {
    subtotalAmount: { amount: "500.0", currencyCode: "SEK" },
  },
  lines: {
    edges: [
      {
        node: {
          id: "gid://shopify/CartLine/23d166a2?cart=hWNH7LYCO8K8SoHbr0RNgTHq",
          quantity: 2,
          cost: { totalAmount: { amount: "500.0", currencyCode: "SEK" } },
          merchandise: {
            id: "gid://shopify/ProductVariant/65983491834247",
            title: "S",
            price: { amount: "250.0", currencyCode: "SEK" },
            selectedOptions: [{ name: "Storlek", value: "S" }],
            image: {
              url: "https://cdn.shopify.com/s/files/1/tee.png",
              altText: null,
              width: 4350,
              height: 3850,
            },
            product: { title: "Test t-shirt", handle: "test-t-shirt" },
          },
        },
      },
    ],
  },
};

test("flattens the line edges and keeps the cart id verbatim", () => {
  const cart = normalizeCart(CART_NODE);

  assert.equal(cart.id, CART_NODE.id);
  assert.ok(cart.id.includes("?key="), "the key must survive normalization");
  assert.equal(cart.totalQuantity, 2);
  assert.equal(cart.lines.length, 1);
});

test("carries the merchandise details each cart row renders", () => {
  const [line] = normalizeCart(CART_NODE).lines;

  assert.equal(line.productTitle, "Test t-shirt");
  assert.equal(line.variantTitle, "S");
  assert.equal(line.quantity, 2);
  assert.deepEqual(line.options, { Storlek: "S" });
  assert.equal(line.image?.url, "https://cdn.shopify.com/s/files/1/tee.png");
  assert.equal(line.image?.alt, "Test t-shirt");
  assert.match(line.total, /500/);
});

test("handles a line whose variant has no image", () => {
  const node = structuredClone(CART_NODE) as typeof CART_NODE;
  // @ts-expect-error — exercising the null branch the API allows
  node.lines.edges[0].node.merchandise.image = null;

  assert.equal(normalizeCart(node).lines[0].image, null);
});

test("formats the subtotal in the cart currency", () => {
  assert.match(normalizeCart(CART_NODE).subtotal, /500/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types app/_lib/cart.test.ts`
Expected: FAIL with `Cannot find module` for `./cart.ts`.

- [ ] **Step 3: Write the implementation**

Create `app/_lib/cart.ts`:

```ts
/**
 * Storefront cart operations. Every function returns either a normalized cart
 * or an error message — callers surface the message rather than throwing, so a
 * Shopify hiccup never takes the page down.
 *
 * `expired: true` is the one error worth acting on: Shopify drops abandoned
 * carts after roughly ten days, and the response comes back with `cart: null`
 * rather than an error. Callers clear the cookie and start a new cart.
 */
import { formatPrice, storefront } from "./shopify";
import type { ShopifyImage } from "./shopify";

export type CartLine = {
  id: string;
  quantity: number;
  /** Line total, already formatted. */
  total: string;
  variantId: string;
  variantTitle: string;
  productTitle: string;
  options: Record<string, string>;
  image: ShopifyImage | null;
};

export type Cart = {
  /** Includes the `?key=…` suffix. Store and pass it back verbatim. */
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: string;
  lines: CartLine[];
};

export type CartResult = { cart: Cart } | { error: string; expired?: boolean };

type CartImageNode = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type CartNode = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        cost: { totalAmount: { amount: string; currencyCode: string } };
        merchandise: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          selectedOptions: Array<{ name: string; value: string }>;
          image: CartImageNode | null;
          product: { title: string; handle: string };
        };
      };
    }>;
  };
};

type CartMutationPayload = {
  cart: CartNode | null;
  userErrors: Array<{ message: string }>;
};

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
                width
                height
              }
              product {
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartCreate($lines: [CartLineInput!]!, $country: CountryCode!)
  @inContext(country: $country) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesAdd(
    $cartId: ID!
    $lines: [CartLineInput!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_LINES_UPDATE = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesUpdate(
    $cartId: ID!
    $lines: [CartLineUpdateInput!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_LINES_REMOVE = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesRemove(
    $cartId: ID!
    $lineIds: [ID!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_QUERY = /* GraphQL */ `
  ${CART_FIELDS}
  query CartById($id: ID!, $country: CountryCode!)
  @inContext(country: $country) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

const GENERIC_ERROR = "Kunde inte uppdatera korgen. Försök igen.";

export function normalizeCart(node: CartNode): Cart {
  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    subtotal: formatPrice(
      node.cost.subtotalAmount.amount,
      node.cost.subtotalAmount.currencyCode,
    ),
    lines: node.lines.edges.map(({ node: line }) => ({
      id: line.id,
      quantity: line.quantity,
      total: formatPrice(
        line.cost.totalAmount.amount,
        line.cost.totalAmount.currencyCode,
      ),
      variantId: line.merchandise.id,
      variantTitle: line.merchandise.title,
      productTitle: line.merchandise.product.title,
      options: Object.fromEntries(
        line.merchandise.selectedOptions.map((option) => [
          option.name,
          option.value,
        ]),
      ),
      image: line.merchandise.image
        ? {
            url: line.merchandise.image.url,
            alt:
              line.merchandise.image.altText ?? line.merchandise.product.title,
            width: line.merchandise.image.width ?? 800,
            height: line.merchandise.image.height ?? 800,
          }
        : null,
    })),
  };
}

/** Unwraps a mutation payload, mapping Shopify's shapes onto `CartResult`. */
function toResult(payload: CartMutationPayload | undefined): CartResult {
  if (!payload) {
    return { error: GENERIC_ERROR };
  }

  if (payload.userErrors.length) {
    return { error: payload.userErrors[0].message };
  }

  if (!payload.cart) {
    return { error: GENERIC_ERROR, expired: true };
  }

  return { cart: normalizeCart(payload.cart) };
}

export async function createCart(
  variantId: string,
  quantity: number,
): Promise<CartResult> {
  const data = await storefront<{ cartCreate: CartMutationPayload }>(
    CART_CREATE,
    {
      variables: { lines: [{ merchandiseId: variantId, quantity }] },
      cache: "no-store",
    },
  );

  return toResult(data?.cartCreate);
}

export async function addCartLine(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<CartResult> {
  const data = await storefront<{ cartLinesAdd: CartMutationPayload }>(
    CART_LINES_ADD,
    {
      variables: {
        cartId,
        lines: [{ merchandiseId: variantId, quantity }],
      },
      cache: "no-store",
    },
  );

  return toResult(data?.cartLinesAdd);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<CartResult> {
  const data = await storefront<{ cartLinesUpdate: CartMutationPayload }>(
    CART_LINES_UPDATE,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      cache: "no-store",
    },
  );

  return toResult(data?.cartLinesUpdate);
}

export async function removeCartLine(
  cartId: string,
  lineId: string,
): Promise<CartResult> {
  const data = await storefront<{ cartLinesRemove: CartMutationPayload }>(
    CART_LINES_REMOVE,
    {
      variables: { cartId, lineIds: [lineId] },
      cache: "no-store",
    },
  );

  return toResult(data?.cartLinesRemove);
}

/** `null` means the cart is gone or unreachable — callers drop the cookie. */
export async function fetchCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: CartNode | null }>(CART_QUERY, {
    variables: { id: cartId },
    cache: "no-store",
  });

  return data?.cart ? normalizeCart(data.cart) : null;
}
```

- [ ] **Step 4: Export `formatPrice` from `shopify.ts`**

`cart.ts` imports it. In `app/_lib/shopify.ts`, change the declaration:

```ts
export function formatPrice(amount: string, currencyCode: string) {
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test --experimental-strip-types app/_lib/cart.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS, 15 tests across the three files.

- [ ] **Step 7: Commit**

```bash
git add app/_lib/cart.ts app/_lib/cart.test.ts app/_lib/shopify.ts
git commit -m "feat: add Storefront cart operations and normalization"
```

---

## Task 5: Server actions and the cart cookie

**Files:**

- Create: `app/_lib/cart-actions.ts`

- [ ] **Step 1: Write the implementation**

Create `app/_lib/cart-actions.ts`:

```ts
"use server";

/**
 * Server actions for every cart mutation. The Storefront token and the cart id
 * both stay server-side: the browser only ever sees a normalized `Cart`.
 *
 * Shopify expires abandoned carts after roughly ten days. When that happens
 * the mutation answers `cart: null` (surfaced as `expired`), so we drop the
 * cookie and start a fresh cart instead of showing the visitor an error for
 * something they did not do.
 */
import { cookies } from "next/headers";

import {
  addCartLine,
  createCart,
  fetchCart,
  removeCartLine,
  updateCartLine,
} from "./cart";
import type { Cart, CartResult } from "./cart";

const CART_COOKIE = "kallsup_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 14;

async function readCartId(): Promise<string | null> {
  const store = await cookies();

  return store.get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(cartId: string): Promise<void> {
  const store = await cookies();

  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
}

async function clearCartId(): Promise<void> {
  const store = await cookies();

  store.delete(CART_COOKIE);
}

/** Reads the visitor's existing cart, if any. Called once on mount. */
export async function readCart(): Promise<Cart | null> {
  const cartId = await readCartId();

  if (!cartId) {
    return null;
  }

  const cart = await fetchCart(cartId);

  if (!cart) {
    await clearCartId();
    return null;
  }

  return cart;
}

export async function addToCart(
  variantId: string,
  quantity = 1,
): Promise<CartResult> {
  const cartId = await readCartId();

  if (cartId) {
    const result = await addCartLine(cartId, variantId, quantity);

    if ("cart" in result) {
      return result;
    }

    if (!result.expired) {
      return result;
    }

    await clearCartId();
  }

  const created = await createCart(variantId, quantity);

  if ("cart" in created) {
    await writeCartId(created.cart.id);
  }

  return created;
}

/** Quantity 0 removes the line — the drawer's stepper relies on this. */
export async function setLineQuantity(
  lineId: string,
  quantity: number,
): Promise<CartResult> {
  const cartId = await readCartId();

  if (!cartId) {
    return { error: "Korgen finns inte längre.", expired: true };
  }

  const result =
    quantity > 0
      ? await updateCartLine(cartId, lineId, quantity)
      : await removeCartLine(cartId, lineId);

  if ("error" in result && result.expired) {
    await clearCartId();
  }

  return result;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_lib/cart-actions.ts
git commit -m "feat: add cart server actions backed by an httpOnly cookie"
```

---

## Task 6: Cart context provider

**Files:**

- Create: `app/_components/CartProvider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the provider**

Create `app/_components/CartProvider.tsx`:

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { addToCart, readCart, setLineQuantity } from "../_lib/cart-actions";
import type { Cart } from "../_lib/cart";

type CartContextValue = {
  cart: Cart | null;
  /** False when the store has no credentials — the header hides its trigger. */
  shopEnabled: boolean;
  isPending: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Resolves to an error message, or null when the line was added. */
  add: (variantId: string, quantity?: number) => Promise<string | null>;
  setQuantity: (lineId: string, quantity: number) => Promise<string | null>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

type CartProviderProps = {
  shopEnabled: boolean;
  children: React.ReactNode;
};

function CartProvider({ shopEnabled, children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  /* A returning visitor still holds the cookie, so the badge has to reflect
     their existing cart. The page itself is statically cached, which is why
     this runs on the client rather than as part of the server render. */
  useEffect(() => {
    if (!shopEnabled) {
      return;
    }

    let active = true;

    readCart()
      .then((existing) => {
        if (active && existing) {
          setCart(existing);
        }
      })
      .catch(() => {
        // A failed restore is not worth surfacing — the visitor can re-add.
      });

    return () => {
      active = false;
    };
  }, [shopEnabled]);

  const run = useCallback(
    (action: () => Promise<{ cart: Cart } | { error: string }>) =>
      new Promise<string | null>((resolve) => {
        startTransition(async () => {
          const result = await action();

          if ("cart" in result) {
            setCart(result.cart);
            resolve(null);
            return;
          }

          resolve(result.error);
        });
      }),
    [],
  );

  const add = useCallback(
    (variantId: string, quantity = 1) =>
      run(() => addToCart(variantId, quantity)),
    [run],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      run(() => setLineQuantity(lineId, quantity)),
    [run],
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      cart,
      shopEnabled,
      isPending,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
    }),
    [
      cart,
      shopEnabled,
      isPending,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
```

- [ ] **Step 2: Mount it in the layout**

In `app/layout.tsx`, add the imports next to the existing ones:

```tsx
import CartProvider from "./_components/CartProvider";
import { isShopifyConfigured } from "./_lib/shopify";
```

Replace the `<body>` contents:

```tsx
<body className="antialiased min-w-xs">
  <CartProvider shopEnabled={isShopifyConfigured()}>{children}</CartProvider>
  <Analytics />
  <SpeedInsights />
</body>
```

`layout.tsx` is a server component, so it can call `isShopifyConfigured()` and pass the boolean across the boundary. Task 8 adds `<CartDrawer />` inside the provider.

- [ ] **Step 3: Verify it typechecks and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: both clean. The site renders exactly as before — nothing consumes the context yet.

- [ ] **Step 4: Commit**

```bash
git add app/_components/CartProvider.tsx app/layout.tsx
git commit -m "feat: add cart context provider and mount it in the layout"
```

---

## Task 7: Product card with option chips

**Files:**

- Create: `app/_components/MerchCard.tsx`

- [ ] **Step 1: Write the card**

Create `app/_components/MerchCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";

import { useCart } from "./CartProvider";
import {
  defaultSelection,
  findVariant,
  isValueAvailable,
} from "../_lib/variants";
import type { Selection } from "../_lib/variants";
import type { ShopifyProduct } from "../_lib/shopify";

const IMAGE_SIZES = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw";

/**
 * One product. Option chips only appear for products with more than one
 * variant, so a single-SKU record stays a plain card. An item with a second
 * product shot crossfades to it on hover — only the top shot fades, because
 * dissolving both at once dips through the tile background as a grey flash.
 */
function MerchCard({ product }: { product: ShopifyProduct }) {
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
    <div className="group">
      {product.image ? (
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
      )}

      <p className="mt-4 text-sm tracking-[0.04em] text-kall-cream uppercase">
        {product.title}
      </p>
      <p className="type-label mt-1">{variant?.price ?? product.price}</p>

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
        {soldOut ? "Slutsåld" : isPending ? "Lägger i korg…" : "Lägg i korg"}
      </button>

      {error && (
        <p role="alert" className="type-label mt-2 text-kall-ember">
          {error}
        </p>
      )}
    </div>
  );
}

export default MerchCard;
```

Sold-out values keep their chip clickable on purpose: a visitor who picks a struck-through size sees "Slutsåld" on the button, which reads better than a dead control.

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_components/MerchCard.tsx
git commit -m "feat: add merch card with option chips and add-to-cart"
```

---

## Task 8: Wire the Merch section to Shopify

**Files:**

- Modify: `app/_components/Merch.tsx`
- Delete: `app/_lib/merch.ts`

- [ ] **Step 1: Rewrite the section**

Replace the entire contents of `app/_components/Merch.tsx`:

```tsx
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
```

- [ ] **Step 2: Delete the hardcoded items**

```bash
git rm app/_lib/merch.ts
```

- [ ] **Step 3: Confirm nothing else imported it**

Run: `grep -rn "_lib/merch" app/`
Expected: no output. If anything matches, that file still needs updating before the build will pass.

The Bandcamp CTA in `MobileMenu.tsx` and the links in `Releases.tsx` are music links, not merch items, and stay exactly as they are.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: clean build. The merch section now renders the dev store's `Test t-shirt`.

- [ ] **Step 5: Commit**

```bash
git add app/_components/Merch.tsx app/_lib/merch.ts
git commit -m "feat: render merch section from Shopify instead of hardcoded items"
```

---

## Task 9: Cart drawer

**Files:**

- Create: `app/_components/CartDrawer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the drawer**

Create `app/_components/CartDrawer.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { useCart } from "./CartProvider";

/**
 * Slide-over cart. Scroll lock, Escape-to-close and focus handling mirror
 * `MobileMenu`, which this sits above: the header is `z-50` and the mobile nav
 * `z-40`, so the drawer takes `z-[60]` to stay on top of both.
 *
 * Checkout is Shopify-hosted — the Checkout API is not available outside
 * Shopify Plus — so the last step leaves the site.
 */
function CartDrawer() {
  const { cart, isOpen, closeCart, setQuantity, isPending } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, closeCart]);

  const lines = cart?.lines ?? [];

  return (
    <div hidden={!isOpen} className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Stäng korgen"
        onClick={closeCart}
        className="absolute inset-0 h-full w-full bg-kall-void/80 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Varukorg"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-kall-700 bg-kall-900 outline-none"
      >
        <div className="flex items-center justify-between border-b border-kall-700 px-6 py-5">
          <h2 className="type-label uppercase">Varukorg</h2>
          <button
            type="button"
            onClick={closeCart}
            className="type-label text-kall-cream"
          >
            Stäng
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="type-label px-6 py-8">Varukorgen är tom.</p>
        ) : (
          <ul className="flex-1 overflow-y-auto px-6 py-4">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex gap-4 border-b border-kall-800 py-4"
              >
                {line.image && (
                  <div className="relative size-16 shrink-0 overflow-hidden bg-kall-800">
                    <Image
                      src={line.image.url}
                      alt={line.image.alt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm tracking-[0.04em] text-kall-cream uppercase">
                    {line.productTitle}
                  </p>
                  <p className="type-label mt-1">{line.variantTitle}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Minska antal"
                      disabled={isPending}
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                      className="type-label border border-kall-700 px-2 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="type-label">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Öka antal"
                      disabled={isPending}
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                      className="type-label border border-kall-700 px-2 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="type-label shrink-0">{line.total}</p>
              </li>
            ))}
          </ul>
        )}

        {cart && lines.length > 0 && (
          <div className="border-t border-kall-700 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="type-label uppercase">Delsumma</span>
              <span className="type-label">{cart.subtotal}</span>
            </div>
            <a
              href={cart.checkoutUrl}
              className="btn btn-solid w-full justify-center"
            >
              Till kassan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
```

Checkout is a plain `<a>` rather than a scripted redirect: it survives JavaScript failures and lets the visitor open it in a new tab.

- [ ] **Step 2: Mount it inside the provider**

In `app/layout.tsx`, add the import:

```tsx
import CartDrawer from "./_components/CartDrawer";
```

and place it inside the provider, after `{children}`:

```tsx
<CartProvider shopEnabled={isShopifyConfigured()}>
  {children}
  <CartDrawer />
</CartProvider>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add app/_components/CartDrawer.tsx app/layout.tsx
git commit -m "feat: add cart drawer with quantity stepper and checkout handoff"
```

---

## Task 10: Header cart trigger

**Files:**

- Modify: `app/_components/SiteHeader.tsx`

- [ ] **Step 1: Import the hook**

Add to the imports in `app/_components/SiteHeader.tsx`:

```tsx
import { useCart } from "./CartProvider";
```

- [ ] **Step 2: Read the cart in the component**

Directly below `const closeMenu = useCallback(() => setMenuOpen(false), []);` add:

```tsx
const { cart, shopEnabled, openCart } = useCart();
```

- [ ] **Step 3: Render the trigger**

In the right-hand cluster, insert the button before the existing "Meny" button, so the markup reads:

```tsx
<div className="flex flex-1 items-center justify-end gap-5">
  <div className="hidden items-center gap-4 md:flex">
    {socials.map((social) => (
      <a
        key={social.href}
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        className="social-img"
        aria-label={social.label}
      >
        <Image
          src={social.icon}
          alt=""
          width={20}
          height={20}
          className="size-5"
        />
      </a>
    ))}
  </div>

  {shopEnabled && (
    <button
      type="button"
      onClick={openCart}
      aria-label={
        cart?.totalQuantity
          ? `Varukorg, ${cart.totalQuantity} varor`
          : "Varukorg"
      }
      className="type-label text-kall-cream"
    >
      Korg
      {cart?.totalQuantity ? ` (${cart.totalQuantity})` : ""}
    </button>
  )}

  <button
    type="button"
    onClick={() => setMenuOpen((open) => !open)}
    aria-expanded={menuOpen}
    aria-controls="mobile-menu"
    className="type-label text-kall-cream md:hidden"
  >
    {menuOpen ? "Stäng" : "Meny"}
  </button>
</div>
```

The trigger is visible at every breakpoint — a cart the visitor cannot reach on a phone is worse than no cart at all.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add app/_components/SiteHeader.tsx
git commit -m "feat: add cart trigger with quantity badge to the header"
```

---

## Task 11: Live API smoke script

**Files:**

- Create: `scripts/shopify-smoke.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the script**

Create `scripts/shopify-smoke.mjs`:

```js
/**
 * Asserts that the live Storefront API still answers with the shape the app
 * depends on. Unit tests cover normalization from recorded payloads; this
 * catches the things they cannot — a rotated token, a removed field, a scope
 * that was revoked, an API version that stopped being served.
 *
 * Run: npm run smoke
 */

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION ?? "2026-07";

if (!domain || !token) {
  console.error(
    "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN. " +
      "Run through `npm run smoke`, which loads .env.local.",
  );
  process.exit(1);
}

const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`  ok   ${label}`);
    return;
  }

  console.error(`  FAIL ${label}`);
  failures.push(label);
}

async function query(body) {
  const response = await fetch(
    `https://${domain}/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data;
}

const PRODUCTS = `
  query Smoke($country: CountryCode!) @inContext(country: $country) {
    products(first: 10, sortKey: BEST_SELLING) {
      edges {
        node {
          id
          handle
          availableForSale
          options { name optionValues { name } }
          images(first: 2) { edges { node { url } } }
          variants(first: 20) {
            edges {
              node {
                id
                availableForSale
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE = `
  mutation Smoke($lines: [CartLineInput!]!, $country: CountryCode!)
  @inContext(country: $country) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost { subtotalAmount { amount currencyCode } }
      }
      userErrors { message }
    }
  }
`;

console.log(`Shopify smoke — ${domain} @ ${version}`);

console.log("products");
const productData = await query({
  query: PRODUCTS,
  variables: { country: "SE" },
});
const products = productData.products.edges.map((edge) => edge.node);

check(
  "at least one product is published to the token's channel",
  products.length > 0,
);

const [product] = products;

if (product) {
  check("product exposes option groups", Array.isArray(product.options));
  check("product has at least one variant", product.variants.edges.length > 0);

  const variant = product.variants.edges[0]?.node;

  check("variant carries a global id", Boolean(variant?.id));
  check("variant carries a price amount", Boolean(variant?.price?.amount));
  check("variant prices are in SEK", variant?.price?.currencyCode === "SEK");
  check(
    "variant exposes selectedOptions",
    Array.isArray(variant?.selectedOptions),
  );
}

console.log("cart");
const variantId = product?.variants.edges[0]?.node.id;

if (variantId) {
  const cartData = await query({
    query: CART_CREATE,
    variables: {
      lines: [{ merchandiseId: variantId, quantity: 1 }],
      country: "SE",
    },
  });
  const { cart, userErrors } = cartData.cartCreate;

  check("cartCreate returns no userErrors", userErrors.length === 0);
  check(
    "cart id carries its ?key= suffix",
    Boolean(cart?.id.includes("?key=")),
  );
  check("cart exposes a checkoutUrl", Boolean(cart?.checkoutUrl));
  check("cart totals the added line", cart?.totalQuantity === 1);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll checks passed.");
```

- [ ] **Step 2: Add the script to `package.json`**

In the `scripts` block:

```json
    "smoke": "node --env-file=.env.local scripts/shopify-smoke.mjs",
```

`--env-file` is native to Node 20.6+ and keeps the token out of the shell history.

- [ ] **Step 3: Run it**

Run: `npm run smoke`
Expected: every line prints `ok`, ending with `All checks passed.`

- [ ] **Step 4: Commit**

```bash
git add scripts/shopify-smoke.mjs package.json
git commit -m "test: add Shopify Storefront smoke script"
```

---

## Task 12: Full verification

**Files:** none — this task only runs and records.

- [ ] **Step 1: Unit tests**

Run: `npm test`
Expected: 15 tests pass, 0 fail.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 4: Smoke**

Run: `npm run smoke`
Expected: all checks pass.

- [ ] **Step 5: Manual pass**

Before starting, add a second product in the Shopify admin and set one variant
of `Test t-shirt` to out of stock, so the multi-product grid and the sold-out
path both get exercised. Publish both products to the token's sales channel or
they will not appear.

Run: `npm run dev`, open `http://localhost:3000/#merch`, then confirm:

1. The grid shows both products with real images and SEK prices.
2. The out-of-stock size is struck through; selecting it changes the button to "Slutsåld" and disables it.
3. Adding an in-stock size opens the drawer with that line.
4. The header shows `Korg (1)`.
5. The `+` and `−` steppers change the line total and the subtotal.
6. Stepping down from 1 removes the line and the drawer shows "Varuorgen är tom".
7. Escape closes the drawer and focus returns to the trigger.
8. Reloading the page keeps the cart contents — the cookie survived.
9. "Till kassan" lands on the Shopify checkout with the right items.

Step 9 needs Bogus Gateway enabled in the dev store (Settings → Payments → test mode) only if you want to complete a payment. Reaching the checkout page is enough to call this verified.

- [ ] **Step 6: Record the result**

Report which steps passed and paste the output of `npm test`, `npm run build`,
and `npm run smoke`. Do not claim the feature works on steps that were not run.

---

## Notes for whoever picks this up

- **Rotate the `shpat_` admin token** in the Shopify admin if it has not been done. It was pasted into a chat during design and is not used by this code.
- **The `merch` cache tag is unused so far.** If product edits need to appear faster than 600s, add a Shopify webhook route that calls `revalidateTag("merch")`. That was deliberately deferred, not forgotten.
- **Adding `unauthenticated_read_product_inventory`** to the token later would let the cards show "Bara 2 kvar". The query field to add back is `quantityAvailable` on the variant node — but only once the scope is confirmed, since it errors rather than returning null.

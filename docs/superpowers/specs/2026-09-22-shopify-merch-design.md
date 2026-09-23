# Shopify merch with on-site cart

**Date:** 2026-09-22
**Status:** approved, ready for implementation plan

## Goal

Replace the hardcoded Bandcamp cards in the Merch section with live products
from the Shopify Storefront API, and let visitors build a cart on kallsup.se
before handing off to Shopify's hosted checkout.

## Context

Half the plumbing already exists:

- `app/_lib/shopify.ts` — Storefront API client with `getMerchProducts()`,
  token selection (`authHeader()`), SEK market pinning via `@inContext`,
  price formatting, and diagnostic logging on failure.
- `next.config.ts` — `cdn.shopify.com` allowed in `images.remotePatterns`.
- `app/_components/Merch.tsx` — renders a 3-up grid of cards with a
  hover-crossfade between two product shots.

What is missing: variant data, cart state, and the wiring from `Merch.tsx` to
Shopify instead of `app/_lib/merch.ts`.

### Verified store facts

Probed against the dev store on 2026-09-22:

| Fact | Value |
| --- | --- |
| Domain | `05h8cn-0j.myshopify.com` |
| Shop name | Kallsups webbshop |
| Currency | SEK — no USD/market mismatch |
| API version | `2026-07` works; the `shopify.ts` default stands |
| Catalog | 1 product, `test-t-shirt`, 5 variants (S–2XL) |
| Token | public Storefront token, in `.env.local` |
| `cartCreate` | works with the public token (write_checkouts granted) |

The store's `shpat_` token answered on both the Storefront and the Admin
endpoint, so it is an Admin API token. It is deliberately **not** used: the
public Storefront token covers products and cart, and an admin-capable secret
does not belong in the site's environment. That token should be rotated.

## Architecture

```
Merch.tsx (server)  ──getMerchProducts()──▶  _lib/shopify.ts ──▶ Storefront API
   │                                              ▲
   └─▶ MerchCard.tsx (client)                     │
            │ addToCart(variantId, qty)           │
            ▼                                     │
       _lib/cart-actions.ts (server actions) ─────┘
            │  cart id in httpOnly cookie
            ▼
       CartProvider / CartDrawer (client)  ──▶ checkoutUrl (Shopify checkout)
```

Products are cached and rendered on the server. Cart mutations run as server
actions so the token never reaches the browser, even though the public token
would tolerate it.

## Components

### `app/_lib/shopify.ts` (extend)

Extract the fetch/auth/error handling currently inlined in
`getMerchProducts()` into a single `storefront<T>(query, variables, cacheOpts)`
helper that queries and mutations share. Mutations pass `cache: "no-store"`.

Extend the product query with:

- `options { name optionValues { name } }` — drives the chip groups. The older
  `options { values }` shape no longer exists in `2026-07`.
- `variants(first: 20) { id title availableForSale price { amount currencyCode } selectedOptions { name value } }`
- `images(first: 2)` — the second image feeds the existing hover-crossfade

`quantityAvailable` is deliberately **not** queried. The store's token lacks
`unauthenticated_read_product_inventory`, and the field does not degrade to
`null` — it raises a GraphQL `ACCESS_DENIED` error, which the existing
`payload.errors?.length` guard turns into a `null` return and an empty merch
section. `availableForSale` carries the in-stock signal on its own.

Types: extend `ShopifyProduct` with `options` and `variants`, add
`ShopifyVariant`, add a normalized `Cart` type (`id`, `checkoutUrl`,
`totalQuantity`, `cost`, `lines[]`).

Cart functions, each returning the normalized `Cart` or an error:
`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartGet`.

### `app/_lib/cart-actions.ts` (new)

Server actions, one per cart operation: `addToCart`, `setLineQuantity`,
`removeLine`, `readCart`.

Cart identity lives in a cookie:

- name `kallsup_cart`, `httpOnly`, `sameSite: "lax"`, `secure` outside dev,
  `maxAge` 14 days
- the value is the **full** `cart.id`, including its `?key=…` query string.
  `cart(id:)` also resolves the bare id on `2026-07`, but the key is what
  authorizes mutations against carts created by another session, so it is
  stored and passed through verbatim.
- Shopify expires abandoned carts after ~10 days. When `cart` comes back
  `null`, clear the cookie and create a fresh cart rather than erroring

Actions return `{ cart }` or `{ error }`. `userErrors` from Shopify map to the
error message shown on the card or in the drawer.

### `app/_components/Merch.tsx` (rewrite)

Stays a server component. Fetches products, renders the grid, passes each
product to `MerchCard`. Drops the `merchItems` import.

### `app/_components/MerchCard.tsx` (new, client)

- One chip group per entry in `product.options`, rendered only when the product
  has more than one variant. Single-variant products show no picker.
- Selecting options resolves a variant by matching `selectedOptions`.
  Unavailable combinations render disabled.
- Add-to-cart button wrapped in `useTransition`: idle → "Lägg i korg",
  pending → disabled, resolved → "Lagt i korg ✓" for ~2s, error → inline
  message under the button.
- Sold-out variants disable the button and swap the label to "Slutsåld".
- Keeps the existing card visuals: `aspect-square`, `hover-zoom`,
  `grain-overlay`, `type-label`, the two-image crossfade, and `IMAGE_SIZES`.

### `app/_components/CartProvider.tsx` (new, client)

React context holding `cart`, `isPending`, `shopEnabled`, and the mutation
callbacks. Reads the server cart once on mount so a returning visitor with a
live cookie sees their lines. Mounted in `app/layout.tsx` wrapping `children`,
which is a server component and so can pass `shopEnabled={isShopifyConfigured()}`
down — that is how the client header learns whether a shop exists at all.

### `app/_components/CartDrawer.tsx` (new, client)

Right-hand slide-over listing lines (thumbnail, title, variant, qty stepper,
line price), subtotal, and a `btn btn-solid` "Till kassan" that assigns
`window.location.href = cart.checkoutUrl`. Empty state: "Varukorgen är tom".

Accessibility and layering follow `MobileMenu.tsx`: body scroll lock, Escape to
close, `aria-modal`, focus moved into the drawer on open and restored on close.
`SiteHeader` is `z-50` and `MobileMenu` is `z-40`, so the drawer sits at
`z-[60]`.

### `app/_components/SiteHeader.tsx` (edit)

Cart trigger button left of the mobile "Meny" button, visible at all widths,
showing `totalQuantity` as a badge when non-zero. Rendered only when
`shopEnabled` is true, so an unconfigured shop does not leave a dead button in
the chrome.

### Deletions

`app/_lib/merch.ts` is removed along with its three Bandcamp items.

Out of scope, explicitly: the "Köp skivan" Bandcamp CTA in `MobileMenu.tsx` and
the streaming/Bandcamp links in `Releases.tsx`. Those are music links, not
merch cards, and stay as they are.

## Data flow

1. Request hits `/`. `Merch.tsx` awaits `getMerchProducts()`, served from the
   600s cache tagged `merch`.
2. Visitor picks options on a card and submits. The server action reads the
   cookie, calls `cartLinesAdd` (or `cartCreate` when there is no cart), sets
   the cookie if new, and returns the normalized cart.
3. `CartProvider` stores the returned cart. The header badge and drawer read
   from context — no refetch, no `revalidatePath`.
4. "Till kassan" leaves the site for `cart.checkoutUrl`. Shopify owns payment,
   shipping, and order confirmation.

## Caching

- Products: `next: { revalidate: 600, tags: ["merch"] }`, already in place.
- Cart: `cache: "no-store"` on every mutation and read. Stock and totals must
  never come from a cache.
- A Shopify webhook → `revalidateTag("merch")` route is deliberately deferred.
  Ten minutes of staleness on a 1–5 product catalog is not worth an endpoint.

## Error handling

| Failure | Behaviour |
| --- | --- |
| Shopify unconfigured or unreachable | Merch section renders its header plus "Merch tillbaka snart." Existing diagnostic logging in `shopify.ts` covers the cause. |
| Empty product list | Same copy as above. A configured-but-empty shop and a broken one look the same to a visitor, and both mean "nothing to buy". |
| Add-to-cart fails | Inline error under the card's button. No toast system. |
| Cart cookie stale or expired | Cookie cleared, new cart created, operation retried once. |
| Variant sold out between render and add | Shopify returns a `userError`; the message surfaces inline. The card refetches nothing — ten-minute staleness is accepted. |

## Verification

The repo has no test runner, but Node 22.14 runs TypeScript tests natively —
`node --test --experimental-strip-types` was confirmed working against a
scratch `.test.ts`. Pure logic therefore gets real unit tests with no new
dependencies, and the integration edges get a smoke script:

0. `npm test` → `node --test --experimental-strip-types "app/_lib/**/*.test.ts"`,
   covering the pure functions: variant resolution from selected options,
   cart normalization from a recorded Storefront payload, and price
   formatting. Network calls are not unit-tested; the smoke script covers them.
1. `scripts/shopify-smoke.mjs` (new) — hits the Storefront API with the env
   token and asserts the response shape the code depends on: products present,
   each with `options`, at least one variant with an `id` and a price, and a
   successful `cartCreate` returning a `checkoutUrl`. Run with
   `node scripts/shopify-smoke.mjs`.
2. `npm run lint` and `npm run build` clean.
3. Manual pass in `npm run dev`: pick a size, add to cart, badge increments,
   drawer shows the line, qty stepper updates the subtotal, "Till kassan" lands
   on Shopify's checkout.
4. Dev-store checkout needs Bogus Gateway enabled to click through payment. Not
   required for merging the listing and cart work.

## Risks

- **The dev store is password-protected**, so `onlineStoreUrl` may be `null`.
  `shopify.ts` already falls back to `https://${domain}/products/${handle}`.
- **One test product** means the multi-variant and sold-out paths get thin
  coverage. Add a second product and mark one variant out of stock in the dev
  admin before the manual pass.
- **Checkout is Shopify-hosted and non-negotiable.** The Checkout API is not
  available outside Shopify Plus, so the cart hands off by redirect.

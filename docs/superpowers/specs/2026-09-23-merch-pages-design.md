# Merch pages with categories and SEO

**Date:** 2026-09-23
**Status:** approved, ready for implementation plan
**Builds on:** `docs/superpowers/specs/2026-09-22-shopify-merch-design.md`

## Goal

Give merch its own pages: a full catalogue at `/merch`, one page per category,
and a page per product with the metadata search engines need. Today the only
merch surface is a section on the front page capped at eight products, with no
shareable product URLs and nowhere to show a product's description.

## Context

Shipped already (see the 2026-09-22 spec): Storefront product fetching with
variants, an on-site cart behind server actions, and a `MerchCard` that renders
option chips and an add-to-cart button. Routes today:

```
/                          front page, merch section (8 best sellers)
/apps, /apps/…             unrelated
/go/biljett/[gigId]        unrelated
```

### Verified store facts

Probed 2026-09-23:

| Fact | Value |
| --- | --- |
| Products | 2 — `test-t-shirt` (typ `Kläder`), `alldeles-for-nara-vinyl` (typ `musik`) |
| Collections | `frontpage` (Shopify's own), `klader`, `musik`, `accessoarer` |
| `klader` | 1 product |
| `musik`, `accessoarer` | empty |
| Collection `seo` | `null` on every collection — fall back to `title`/`description` |
| Collection `description` | set, e.g. "Kallsups klädesplagg." |
| Collection `image` | none |
| Product `seo` | `null` on both — fall back to `title`/`description` |

**Open admin issue, not a code issue:** `musik` is empty although the vinyl
carries `productType: musik`. Either the collection is manual and the product
was never added, or an automated rule does not match the lowercase type. The
site renders the empty state correctly either way, but the category will look
broken until it is fixed in the admin.

## Decisions

**Categories are Shopify collections.** The code hardcodes no category list; it
reads collections and builds pages from them. Adding "Affischer" next year needs
no deploy.

**`frontpage` is excluded.** Shopify creates it for its own theme; it is not a
category anyone chose.

**Empty categories are shown, not hidden.** They appear as chips and have their
own pages with an empty state. This is deliberate — the store deliberately keeps
empty collections to exercise the case. Hiding them later is a one-line filter.

**Category order is alphabetical by title.** Shopify has no manual ordering
*between* collections, so alphabetical is the only predictable choice:
Accessoarer, Kläder, Musik.

**The product owns the short URL.** Products are the SEO target and the thing
people share, so categories take the prefix.

## Routes

```
/                                   front page section, 8 best sellers + "Se allt →"
/merch                              every product + category chips
/merch/kategori/[handle]            one collection's products
/merch/[handle]                     one product
```

All statically generated through `generateStaticParams`, revalidating on the
existing 600s window. Unknown handles call `notFound()`.

`/merch/kategori/` is a literal segment, so a collection whose handle is
`kategori` would be unreachable. That is an acceptable collision: it would also
have to compete with the route name in the admin, and nothing in the store uses
it.

## Data layer

New functions in `app/_lib/shopify.ts`, all built on the existing `storefront`
helper and the existing `normalizeProduct`:

- `getAllProducts(first = 100)` — the full catalogue for `/merch`
- `getProduct(handle)` — one product, with every image rather than two, plus
  `descriptionHtml` and `seo`
- `getCollections()` — every collection except `frontpage`, sorted by title,
  each with `handle`, `title`, `description`, `seo` and a product count
- `getCollection(handle)` — one collection with its products

Two type additions: `ShopifyCollection`, and `ShopifyProductDetail` extending
`ShopifyProduct` with `images: ShopifyImage[]`, `descriptionHtml` and `seo`.

The card needs two images; the product page needs the gallery. Rather than
over-fetching on the grid, `getProduct` runs its own query against
`product(handle:)`.

## Components

**`app/_components/AddToCartForm.tsx` (new, client).** The option chips, the
variant resolution and the add-to-cart button, extracted from `MerchCard`.
`MerchCard` and the product page both render it. Without this extraction the
variant logic exists twice and drifts.

**`app/_components/MerchCard.tsx` (modify).** Keeps the image, title and price;
delegates the buying controls to `AddToCartForm`. On `/merch` and the category
pages the title links to the product page; on the front page it keeps today's
behaviour.

**`app/_components/MerchGrid.tsx` (new, server).** The `<ul className="grid …">`
shared by `/merch`, the category pages and the front-page section, plus the
empty state. One place decides what an empty merch grid says.

**`app/_components/CategoryNav.tsx` (new, server).** The chip row: "Alla" plus
one link per collection, with the current one marked `aria-current="page"`.

**`app/merch/page.tsx`, `app/merch/kategori/[handle]/page.tsx`,
`app/merch/[handle]/page.tsx` (new).** Server components, each with its own
`generateMetadata` and `generateStaticParams`.

**`app/_lib/seo.ts` (new).** Pure helpers: `metaDescription(text)` truncating on
a word boundary at 155 characters, and `productJsonLd(product, url)` building
the schema object. Pure means testable without a browser or a network.

## SEO

Per product: title from `seo.title ?? title`, description from
`seo.description ?? description` through `metaDescription`, `openGraph` with the
featured image, and a canonical URL. Plus a JSON-LD `Product` block with
`offers` carrying price, `priceCurrency` and `availability`
(`InStock`/`OutOfStock`) — that is what produces the price and stock line in
Google results.

Per category: `seo.title ?? title`, `seo.description ?? description`, canonical.

`app/sitemap.ts` lists the front page, `/merch`, every category and every
product. `metadataBase` is already set to `https://kallsup.se` in the root
layout, so relative canonicals resolve.

The product description renders through `dangerouslySetInnerHTML` from
`descriptionHtml`. The HTML comes from the store admin, not from visitors, so
this is not an injection surface — stated explicitly so it reads as a decision
rather than an oversight.

## Navigation

`app/_lib/site.ts` currently holds bare anchors (`#live`, `#musik`, `#merch`).
On any route other than `/` they point at nothing. They become root-relative
(`/#live`), which works from every page. A "Merch" entry pointing at `/merch`
joins the nav.

This is the one pre-existing problem the feature forces us to fix; it is in
scope precisely because the feature breaks without it.

## Error handling

| Case | Behaviour |
| --- | --- |
| Unknown product or category handle | `notFound()` → 404 |
| Empty category | Page renders with its title and description plus "Inga produkter här just nu." |
| Shopify unreachable on `/merch` | "Merch tillbaka snart.", as the front page section already does |
| Shopify unreachable during `generateStaticParams` | Returns `[]`; pages fall back to on-demand rendering rather than failing the build |

## Verification

1. `npm test` — unit tests for `metaDescription` (truncation, word boundary,
   empty input), `productJsonLd` (availability both ways, price and currency),
   and collection filtering (`frontpage` excluded, alphabetical order).
2. `npm run smoke` — extended with a collections check and a product-by-handle
   check, asserting `descriptionHtml` and the image list are present.
3. `npm run build` — confirms every product and category prerendered.
4. `npm run lint`.
5. Manual: `/merch` lists both products, chips navigate, `/merch/kategori/musik`
   shows the empty state, a product page shows gallery, description and working
   add-to-cart, and the nav links work from `/merch` back to `/#live`.

## Out of scope

Collection images (none exist), pagination beyond 100 products, search, related
products, and the webhook-driven `revalidateTag("merch")` route still deferred
from the previous spec.

/**
 * Shopify Storefront API — read-only product listing for the Merch section.
 *
 * Needs the store domain plus one token (see .env.local):
 *   SHOPIFY_STORE_DOMAIN             e.g. kallsup.myshopify.com  (no https://)
 *   SHOPIFY_STOREFRONT_ACCESS_TOKEN  public token — custom app in the admin
 *   SHOPIFY_STOREFRONT_PRIVATE_TOKEN private token — Headless channel; takes
 *                                    precedence when both are set
 * Optional:
 *   SHOPIFY_API_VERSION              defaults to API_VERSION below
 *
 * The two token types use different headers. Public tokens are meant to be
 * client-visible; private ones must stay server-side, which is where this
 * module runs either way.
 *
 * We render our own cards from this data rather than embedding Shopify's Buy
 * Button: the injected iframe ships its own styles and cannot inherit the
 * --color-kall-* tokens, so it always reads as pasted on.
 */

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-07";

/** Market context for pricing. SE keeps everything in SEK. */
const MARKET_COUNTRY = "SE";

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
  /** Raw lowest amount, e.g. "250.0". Formatted output lives in `price`. */
  priceAmount: string;
  currencyCode: string;
  available: boolean;
  image: ShopifyImage | null;
  /** Second product shot, used for the hover crossfade. */
  hoverImage: ShopifyImage | null;
  optionGroups: ShopifyOptionGroup[];
  variants: ShopifyVariant[];
};

export type ShopifyCollection = {
  id: string;
  handle: string;
  title: string;
  /** Plain-text body from the admin. Doubles as the meta description. */
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

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

type StorefrontResponse = {
  products: {
    edges: Array<{ node: ProductNode }>;
  };
};

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

/** Private token wins when both are present — it isn't IP rate-limited. */
function authHeader(): Record<string, string> | null {
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;

  if (privateToken) {
    return { "Shopify-Storefront-Private-Token": privateToken };
  }

  const publicToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (publicToken) {
    return { "X-Shopify-Storefront-Access-Token": publicToken };
  }

  return null;
}

export function isShopifyConfigured() {
  return Boolean(process.env.SHOPIFY_STORE_DOMAIN && authHeader());
}

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

export function formatPrice(amount: string, currencyCode: string) {
  const value = Number(amount);

  if (Number.isNaN(value)) {
    return "";
  }

  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

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
    priceAmount: node.priceRange.minVariantPrice.amount,
    currencyCode: node.priceRange.minVariantPrice.currencyCode,
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

/**
 * Returns the storefront's products, or null when the shop isn't configured or
 * the request fails — callers fall back to placeholder cards rather than
 * rendering an empty section.
 */
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

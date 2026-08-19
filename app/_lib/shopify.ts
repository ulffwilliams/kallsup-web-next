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

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  url: string;
  price: string;
  available: boolean;
  image: { url: string; alt: string; width: number; height: number } | null;
};

type StorefrontResponse = {
  data?: {
    products: {
      edges: Array<{
        node: {
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
      }>;
    };
  };
  errors?: Array<{ message: string }>;
};

/*
 * @inContext pins the market so prices resolve in the Swedish market's currency
 * even if the store later sells in several. Without it, Shopify picks the
 * context from the *server's* location, which on Vercel is not Sweden.
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
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
            width
            height
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

function formatPrice(amount: string, currencyCode: string) {
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

/**
 * Returns the storefront's products, or null when the shop isn't configured or
 * the request fails — callers fall back to placeholder cards rather than
 * rendering an empty section.
 */
export async function getMerchProducts(
  first = 8,
): Promise<ShopifyProduct[] | null> {
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
          query: PRODUCTS_QUERY,
          variables: { first, country: MARKET_COUNTRY },
        }),
        // Products change rarely; matches the page's own revalidate window.
        next: { revalidate: 600, tags: ["merch"] },
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

    const payload = (await response.json()) as StorefrontResponse;

    if (payload.errors?.length) {
      console.error(
        "Shopify Storefront GraphQL errors:",
        payload.errors.map((error) => error.message).join("; "),
      );
      return null;
    }

    const edges = payload.data?.products.edges ?? [];

    return edges.map(({ node }) => ({
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
    }));
  } catch (error) {
    console.error("Shopify Storefront request failed:", error);
    return null;
  }
}

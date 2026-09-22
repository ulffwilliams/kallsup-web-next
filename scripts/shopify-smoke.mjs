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
  const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify(body),
  });

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
  check("cart id carries its ?key= suffix", Boolean(cart?.id.includes("?key=")));
  check("cart exposes a checkoutUrl", Boolean(cart?.checkoutUrl));
  check("cart totals the added line", cart?.totalQuantity === 1);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll checks passed.");

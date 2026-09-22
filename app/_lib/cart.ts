/**
 * Storefront cart operations. Every function returns either a normalized cart
 * or an error message — callers surface the message rather than throwing, so a
 * Shopify hiccup never takes the page down.
 *
 * `expired: true` is the one error worth acting on: Shopify drops abandoned
 * carts after roughly ten days, and the response comes back with `cart: null`
 * rather than an error. Callers clear the cookie and start a new cart.
 */
/* The `.ts` specifier is what lets `node --test --experimental-strip-types`
   resolve this import; the bundler accepts it too. Type-only imports are
   erased and need no extension. */
import { formatPrice, storefront } from "./shopify.ts";
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

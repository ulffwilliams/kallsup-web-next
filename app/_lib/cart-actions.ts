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
import { updateTag } from "next/cache";

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

/**
 * A stale variant means the product pages are serving ids Shopify has since
 * replaced. Expiring the `merch` tag makes the router's post-action refresh
 * fetch fresh products, so the next click uses the new ids.
 */
export async function addToCart(
  variantId: string,
  quantity = 1,
): Promise<CartResult> {
  const result = await addOrCreate(variantId, quantity);

  if ("error" in result && result.staleVariant) {
    updateTag("merch");
  }

  return result;
}

async function addOrCreate(
  variantId: string,
  quantity: number,
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

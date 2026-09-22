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

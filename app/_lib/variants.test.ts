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
  assert.equal(findVariant(product(), { Storlek: "M", Färg: "Svart" })?.id, "v3");
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

import { test } from "node:test";
import assert from "node:assert/strict";

import { filterCategories } from "./collections.ts";
import type { ShopifyCollection } from "./shopify.ts";

function collection(handle: string, title: string): ShopifyCollection {
  return {
    id: `gid://shopify/Collection/${handle}`,
    handle,
    title,
    description: "",
    seoTitle: null,
    seoDescription: null,
  };
}

const ALL = [
  collection("accessoarer", "Accessoarer"),
  collection("klader", "Kläder"),
  collection("musik", "Musik"),
  collection("frontpage", "Startsida"),
];

test("drops Shopify's own frontpage collection", () => {
  assert.deepEqual(
    filterCategories(ALL).map((c) => c.handle),
    ["accessoarer", "klader", "musik"],
  );
});

test("preserves the order it was given", () => {
  const reversed = [...ALL].reverse();

  assert.deepEqual(
    filterCategories(reversed).map((c) => c.handle),
    ["musik", "klader", "accessoarer"],
  );
});

test("keeps categories that have no products", () => {
  // `accessoarer` is empty in the live store and must still be listed.
  assert.ok(filterCategories(ALL).some((c) => c.handle === "accessoarer"));
});

test("returns an empty list when the store has only frontpage", () => {
  assert.deepEqual(filterCategories([collection("frontpage", "Startsida")]), []);
});

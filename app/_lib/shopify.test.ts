import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeProduct } from "./shopify.ts";

const NODE = {
  id: "gid://shopify/Product/16578039153031",
  title: "Test t-shirt",
  handle: "test-t-shirt",
  onlineStoreUrl: null,
  availableForSale: true,
  options: [
    {
      name: "Storlek",
      optionValues: [{ name: "S" }, { name: "M" }, { name: "L" }],
    },
  ],
  priceRange: {
    minVariantPrice: { amount: "250.0", currencyCode: "SEK" },
  },
  images: {
    edges: [
      {
        node: {
          url: "https://cdn.shopify.com/s/files/1/tee.png",
          altText: null,
          width: 4350,
          height: 3850,
        },
      },
      {
        node: {
          url: "https://cdn.shopify.com/s/files/1/tee-back.png",
          altText: null,
          width: 4350,
          height: 3850,
        },
      },
    ],
  },
  variants: {
    edges: [
      {
        node: {
          id: "gid://shopify/ProductVariant/1",
          title: "S",
          availableForSale: true,
          price: { amount: "250.0", currencyCode: "SEK" },
          selectedOptions: [{ name: "Storlek", value: "S" }],
        },
      },
      {
        node: {
          id: "gid://shopify/ProductVariant/2",
          title: "M",
          availableForSale: false,
          price: { amount: "250.0", currencyCode: "SEK" },
          selectedOptions: [{ name: "Storlek", value: "M" }],
        },
      },
    ],
  },
};

test("falls back to a constructed product URL when the store is password-protected", () => {
  const product = normalizeProduct(NODE, "05h8cn-0j.myshopify.com");

  assert.equal(
    product.url,
    "https://05h8cn-0j.myshopify.com/products/test-t-shirt",
  );
});

test("formats prices in the store currency without stray decimals", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.match(product.price, /250/);
  assert.doesNotMatch(product.price, /250,00/);
});

test("maps the first image to image and the second to hoverImage", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.equal(product.image?.url, "https://cdn.shopify.com/s/files/1/tee.png");
  assert.equal(product.image?.alt, "Test t-shirt");
  assert.equal(
    product.hoverImage?.url,
    "https://cdn.shopify.com/s/files/1/tee-back.png",
  );
  assert.equal(product.hoverImage?.alt, "");
});

test("flattens selectedOptions into a lookup keyed by option name", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.deepEqual(product.variants[0].options, { Storlek: "S" });
  assert.equal(product.variants[0].available, true);
  assert.equal(product.variants[1].available, false);
});

test("exposes option groups in the order the store defines them", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.deepEqual(product.optionGroups, [
    { name: "Storlek", values: ["S", "M", "L"] },
  ]);
});

test("carries the raw price amount and currency for structured data", () => {
  const product = normalizeProduct(NODE, "example.myshopify.com");

  assert.equal(product.priceAmount, "250.0");
  assert.equal(product.currencyCode, "SEK");
});

import { test } from "node:test";
import assert from "node:assert/strict";

import { metaDescription, productJsonLd } from "./seo.ts";

test("returns short text unchanged", () => {
  assert.equal(
    metaDescription("Kallsups klädesplagg."),
    "Kallsups klädesplagg.",
  );
});

test("returns an empty string for missing text", () => {
  assert.equal(metaDescription(null), "");
  assert.equal(metaDescription(undefined), "");
  assert.equal(metaDescription(""), "");
});

test("collapses whitespace so markup newlines do not leak into the tag", () => {
  assert.equal(metaDescription("Vinyl\n\n  och   kassett"), "Vinyl och kassett");
});

test("truncates on a word boundary and marks the cut", () => {
  const long = "ord ".repeat(60).trim();
  const result = metaDescription(long);

  assert.ok(result.length <= 156, `was ${result.length}`);
  assert.ok(result.endsWith("…"), result);
  assert.ok(!result.includes("or…"), "must not cut mid-word");
});

test("builds a Product schema with an in-stock offer", () => {
  const json = productJsonLd({
    title: "Alldeles för Nära - VINYL",
    description: "TestVinylskiva!",
    url: "https://kallsup.se/merch/alldeles-for-nara-vinyl",
    image: "https://cdn.shopify.com/s/files/1/afn-front.png",
    price: "300.0",
    currency: "SEK",
    available: true,
  });

  assert.equal(json["@type"], "Product");
  assert.equal(json.name, "Alldeles för Nära - VINYL");
  assert.deepEqual(json.image, [
    "https://cdn.shopify.com/s/files/1/afn-front.png",
  ]);
  assert.equal(json.offers.price, "300.0");
  assert.equal(json.offers.priceCurrency, "SEK");
  assert.equal(json.offers.availability, "https://schema.org/InStock");
  assert.equal(
    json.offers.url,
    "https://kallsup.se/merch/alldeles-for-nara-vinyl",
  );
});

test("marks a sold-out product as OutOfStock", () => {
  const json = productJsonLd({
    title: "Kallsup T",
    description: "",
    url: "https://kallsup.se/merch/kallsup-t",
    image: null,
    price: "250.0",
    currency: "SEK",
    available: false,
  });

  assert.equal(json.offers.availability, "https://schema.org/OutOfStock");
  assert.equal("image" in json, false, "omit image rather than sending null");
});

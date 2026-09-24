import { test } from "node:test";
import assert from "node:assert/strict";

import { POLICY_ROUTES, policyBySlug } from "./policies.ts";

test("covers all four Shopify policies exactly once", () => {
  const fields = POLICY_ROUTES.map((route) => route.field).sort();

  assert.deepEqual(fields, [
    "privacyPolicy",
    "refundPolicy",
    "shippingPolicy",
    "termsOfService",
  ]);
});

test("slugs are unique and URL-safe", () => {
  const slugs = POLICY_ROUTES.map((route) => route.slug);

  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/, `${slug} must be lowercase and hyphenated`);
  }
});

test("resolves a known slug", () => {
  assert.equal(policyBySlug("integritetspolicy")?.field, "privacyPolicy");
});

test("returns null for an unknown slug so the route can 404", () => {
  assert.equal(policyBySlug("finns-inte"), null);
});

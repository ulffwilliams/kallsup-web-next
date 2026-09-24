/**
 * Which Shopify policy lives at which URL on kallsup.se.
 *
 * Shopify names its policies in English ("Terms of Service", "Refund
 * Policy") and its slugs are fixed, so the Swedish titles and paths live
 * here rather than being read from the API. Pure, so the sitemap and the
 * pages agree without another round trip.
 */

export type PolicyField =
  | "termsOfService"
  | "refundPolicy"
  | "shippingPolicy"
  | "privacyPolicy";

export type PolicyRoute = {
  slug: string;
  field: PolicyField;
  /** Swedish heading, shown instead of Shopify's English title. */
  title: string;
  /** One line under the heading on the index page. */
  summary: string;
};

export const POLICY_ROUTES: PolicyRoute[] = [
  {
    slug: "kopvillkor",
    field: "termsOfService",
    title: "Köpvillkor",
    summary: "Villkoren för att handla hos oss.",
  },
  {
    slug: "retur-och-angerratt",
    field: "refundPolicy",
    title: "Retur och ångerrätt",
    summary: "Öppet köp, ångerrätt och reklamation.",
  },
  {
    slug: "frakt-och-leverans",
    field: "shippingPolicy",
    title: "Frakt och leverans",
    summary: "Leveranstider, fraktkostnad och tull.",
  },
  {
    slug: "integritetspolicy",
    field: "privacyPolicy",
    title: "Integritetspolicy",
    summary: "Hur vi behandlar dina personuppgifter.",
  },
];

export function policyBySlug(slug: string): PolicyRoute | null {
  return POLICY_ROUTES.find((route) => route.slug === slug) ?? null;
}

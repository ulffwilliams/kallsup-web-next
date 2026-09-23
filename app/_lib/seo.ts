/**
 * Pure metadata helpers. No network, no env — so the unit tests cover the
 * exact strings that end up in <head> and in the JSON-LD block.
 */

/* Google truncates around 155-160 characters. Cutting ourselves keeps the
   ellipsis on a word boundary instead of mid-syllable. */
const MAX_DESCRIPTION = 155;

export function metaDescription(text: string | null | undefined): string {
  if (!text) {
    return "";
  }

  const collapsed = text.replace(/\s+/g, " ").trim();

  if (collapsed.length <= MAX_DESCRIPTION) {
    return collapsed;
  }

  const cut = collapsed.slice(0, MAX_DESCRIPTION);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;

  return `${trimmed.replace(/[.,;:!?]$/, "")}…`;
}

export type ProductJsonLdInput = {
  title: string;
  description: string;
  url: string;
  /** Absolute CDN URL, or null when the product has no photography. */
  image: string | null;
  /** Raw Shopify amount, e.g. "300.0" — not the formatted price. */
  price: string;
  currency: string;
  available: boolean;
};

/**
 * schema.org Product. The `offers` block is what puts the price and stock
 * line into a Google result; without it the markup is decorative.
 */
export function productJsonLd(input: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description,
    ...(input.image ? { image: [input.image] } : {}),
    brand: { "@type": "Brand", name: "Kallsup" },
    offers: {
      "@type": "Offer",
      url: input.url,
      price: input.price,
      priceCurrency: input.currency,
      availability: input.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

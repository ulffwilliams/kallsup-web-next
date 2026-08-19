/**
 * Merch. Hardcoded Bandcamp links for now — no Shopify store yet, so every
 * card is an outbound link rather than a cart. `shopify.ts` stays in the tree
 * for whenever the storefront goes live.
 *
 * TODO: prices, and a real product shot for the t-shirt.
 */

export type MerchItem = {
  slug: string;
  name: string;
  /** Sub-line under the name — variant, colour, format. */
  variant?: string;
  price?: string;
  url: string;
  image?: string;
  imageAlt?: string;
};

export const merchItems: MerchItem[] = [
  {
    slug: "afn-vinyl-black",
    name: "Alldeles för nära (PRE-ORDER)",
    variant: "Svart vinyl",
    url: "https://varorecords.bandcamp.com/album/alldeles-f-r-n-ra",
    image: "/images/afn-front-bgw.png",
    imageAlt: "/images/afn-back-bgw.png",
  },
  {
    slug: "esr-vinyl-turquoise",
    name: "En sista räddning",
    variant: "Translucent turquoise vinyl",
    url: "https://varorecords.bandcamp.com/album/en-sista-r-ddning",
    image: "/images/cover-esr-front.jpg",
    imageAlt: "/images/cover-esr-back.jpg",
  },
  {
    slug: "kallsup-t-black",
    name: "Kallsup T",
    variant: "Svart",
    url: "https://kallsup.bandcamp.com/merch/kallsup-t-black",
    image: "/images/tee.png",
  },
];

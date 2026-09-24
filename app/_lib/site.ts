/** Single source of truth for nav, socials and outbound links. */

export const site = {
  name: "Kallsup",
  tagline: "Alldeles för nära",
  email: "mgmt@kallsup.se",
  photoCredit: "Miranda Fredriksson",
} as const;

/* Root-relative so the anchors resolve from /merch and the product pages too;
   a bare "#live" points at nothing outside the front page. Merch is now a
   page of its own rather than a section link. */
export const nav = [
  { href: "/#live", label: "Live" },
  { href: "/#musik", label: "Musik" },
  { href: "/merch", label: "Merch" },
  { href: "/#kontakt", label: "Kontakt" },
] as const;

export const socials = [
  {
    href: "https://open.spotify.com/artist/0lksP63BacYDmZCjWyNWnz",
    label: "Spotify",
    icon: "/images/spotify.png",
  },
  {
    href: "https://www.instagram.com/kallsup909/",
    label: "Instagram",
    icon: "/images/instagram.png",
  },
  {
    href: "https://www.facebook.com/kallsup909/",
    label: "Facebook",
    icon: "/images/facebook.png",
  },
  {
    href: "https://music.apple.com/se/artist/kallsup/1651905464",
    label: "Apple Music",
    icon: "/images/apple.svg",
  },
  {
    href: "https://www.tiktok.com/@kallsupband",
    label: "TikTok",
    icon: "/images/tiktok.svg",
  },
  {
    // Vårö Records, not the band's own page — the label sells the records.
    href: "https://varorecords.bandcamp.com/",
    label: "Bandcamp",
    icon: "/images/bandcamp.svg",
  },
] as const;

/** Looked up by label so the socials array stays free to reorder. */
export const instagram = socials.find((s) => s.label === "Instagram")!;

/**
 * The selling entity. Required by e-handelslagen (2002:562) to be easy,
 * direct and permanently available — hence the footer on every page.
 *
 * `postalTown` is deliberately empty until the postcode and city are
 * confirmed; rendering code skips the line rather than printing half an
 * address. A street on its own does not meet the geographic address
 * requirement, so this must be filled before the shop opens.
 */
export const company = {
  legalName: "Skärrad AB",
  orgNumber: "559550-6444",
  vatNumber: "SE559550644401",
  street: "Karlsgatan 12A",
  postalTown: "",
  email: "ekonomi@skarrad.se",
  phone: "+46 73 816 24 89",
} as const;

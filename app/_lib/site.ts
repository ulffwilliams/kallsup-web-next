/** Single source of truth for nav, socials and outbound links. */

export const site = {
  name: "Kallsup",
  tagline: "Alldeles för nära",
  email: "mgmt@kallsup.se",
  photoCredit: "Miranda Fredriksson",
} as const;

export const nav = [
  { href: "#live", label: "Live" },
  { href: "#musik", label: "Musik" },
  { href: "#merch", label: "Merch" },
  { href: "#kontakt", label: "Kontakt" },
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

export const bandcampAlbum =
  "https://varorecords.bandcamp.com/album/en-sista-r-ddning";

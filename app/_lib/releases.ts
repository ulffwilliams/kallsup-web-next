/**
 * Discography. Local config for now — moves to a `releases` table alongside the
 * gig admin UI so the band can add releases without a deploy.
 *
 * TODO: `afn` still needs a release date and streaming links.
 */

export type Release = {
  slug: string;
  title: string;
  year: string;
  format: string;
  /** Shown instead of streaming links when the record isn't out yet. */
  status?: string;
  /** Optional call to action. Renders a solid button in place of the `status`
   *  chip — pre-order, ticket link, crowdfunder, whatever the release needs.
   *  Both fields must be set for the button to render. */
  ctaTitle?: string;
  ctaLink?: string;
  cover: string;
  coverThumb?: string;
  spotify?: string;
  bandcamp?: string;
  featured?: boolean;
};

export const releases: Release[] = [
  {
    slug: "afn",
    title: "Alldeles för nära",
    year: "2026",
    format: "Album",
    status: "Snart",
    ctaTitle: "Förhandsbeställ skivan",
    ctaLink: "https://varorecords.bandcamp.com/album/alldeles-f-r-n-ra",
    cover: "/images/cover-afn.jpg",
    coverThumb: "/images/cover-afn-sm.jpg",
    featured: true,
  },
  {
    slug: "en-sista-raddning",
    title: "En sista räddning",
    year: "2025",
    format: "Album",
    cover: "/images/ensistaraddning.jpg",
    spotify: "https://open.spotify.com/artist/0lksP63BacYDmZCjWyNWnz",
    bandcamp:
      "https://varorecords.bandcamp.com/album/en-sista-r-ddning",
  },
  {
    slug: "kallsup",
    title: "Kallsup",
    year: "2023",
    format: "EP",
    cover: "/images/cover-kallsup.jpg",
    coverThumb: "/images/cover-kallsup-sm.jpg",
    spotify: "https://open.spotify.com/artist/0lksP63BacYDmZCjWyNWnz",
    bandcamp: "https://kallsup.bandcamp.com/album/kallsup",
  },
];

export const featuredRelease = releases.find((release) => release.featured);

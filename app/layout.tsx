import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";

const neuething = localFont({
  src: [
    {
      path: "../public/fonts/neuething-sans-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/neuething-sans-ultraexpanded.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neuething",
  display: "swap",
});

/* Micro-label / meta typeface. Carries dates, catalogue numbers and section
   labels so the UltraExpanded display face is never asked to set small text. */
const typewriter = localFont({
  src: [
    {
      path: "../public/fonts/elegant-typewriter-light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/elegant-typewriter-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/elegant-typewriter-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-typewriter",
  display: "swap",
});

const description =
  "Kallsup är ett shoegaze/alternativt rockband från Örebro. 'Alldeles för nära' ute 2:a Oktober.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kallsup.se"),
  title: {
    default: "Kallsup",
    template: "%s — Kallsup",
  },
  description,
  openGraph: {
    title: "Kallsup",
    description,
    url: "https://kallsup.se",
    siteName: "Kallsup",
    locale: "sv_SE",
    type: "website",
    images: [
      {
        url: "/images/press-horizontal.jpg",
        width: 2560,
        height: 1707,
        alt: "Kallsup — pressbild",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kallsup",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={`${neuething.variable} ${typewriter.variable}`}>
      <head>
        <link
          rel="preload"
          href="/images/loggavit.png"
          as="image"
          type="image/png"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased min-w-xs">
        <a href="#main" className="skip-link">
          Hoppa till innehåll
        </a>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

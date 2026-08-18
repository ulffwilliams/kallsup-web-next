import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";

const neuething = localFont({
  src: [
    {
      path: "../public/fonts/NeuethingSans-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/NeuethingSans-SemiBoldUltraExpanded.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neuething",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kallsup",
  description:
    "Kallsup is a indie-rock/shoegaze band from Örebro, Sweden. Det värsta på en bra dag.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={neuething.variable}>
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
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

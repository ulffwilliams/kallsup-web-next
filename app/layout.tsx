import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";

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
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/images/loggavit.png"
          as="image"
          type="image/png"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased flex m-0 place-items-center min-w-xs">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

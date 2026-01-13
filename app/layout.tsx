import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"


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
      <body className="antialiased">
        {children}
        <Analytics />
        </body>
    </html>
  );
}

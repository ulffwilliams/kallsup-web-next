import type { Metadata } from "next";

import SectionHeader from "../_components/SectionHeader";
import Reveal from "../_components/Reveal";
import MerchGrid from "../_components/MerchGrid";
import CategoryNav from "../_components/CategoryNav";
import SiteHeader from "../_components/SiteHeader";
import SiteFooter from "../_components/SiteFooter";
import Background from "../_components/Background";
import { getAllProducts, getCollections } from "../_lib/shopify";
import { filterCategories } from "../_lib/collections";
import { metaDescription } from "../_lib/seo";

/* Matches the front page's window — merch changes on the same rhythm. */
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Merch",
  description: metaDescription(
    "Vinyl, kläder och accessoarer från Kallsup. Skickas från Sverige.",
  ),
  alternates: { canonical: "/merch" },
  openGraph: {
    title: "Merch — Kallsup",
    description: "Vinyl, kläder och accessoarer från Kallsup.",
    url: "/merch",
    type: "website",
  },
};

export default async function MerchPage() {
  const [products, collections] = await Promise.all([
    getAllProducts(),
    getCollections(),
  ]);

  const categories = filterCategories(collections ?? []);

  return (
    <div className="relative isolate w-full">
      <Background />
      <SiteHeader />

      <main id="main" className="relative z-10">
        <section className="section-y pt-32 md:pt-40">
          <div className="shell">
            <SectionHeader title="Merch" />

            <Reveal>
              <CategoryNav categories={categories} />
              <MerchGrid products={products} />
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

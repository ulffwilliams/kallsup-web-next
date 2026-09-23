import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SectionHeader from "../../../_components/SectionHeader";
import Reveal from "../../../_components/Reveal";
import MerchGrid from "../../../_components/MerchGrid";
import CategoryNav from "../../../_components/CategoryNav";
import { getCollection, getCollections } from "../../../_lib/shopify";
import { filterCategories } from "../../../_lib/collections";
import { metaDescription } from "../../../_lib/seo";

export const revalidate = 600;

type PageProps = { params: Promise<{ handle: string }> };

/**
 * Prerenders one page per category. An unreachable shop returns an empty list
 * rather than failing the build — the routes then render on demand.
 */
export async function generateStaticParams() {
  const collections = await getCollections();

  return filterCategories(collections ?? []).map((category) => ({
    handle: category.handle,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const result = await getCollection(handle);

  if (!result) {
    return { title: "Kategorin finns inte" };
  }

  const { collection } = result;
  const title = collection.seoTitle ?? collection.title;
  const description = metaDescription(
    collection.seoDescription ?? collection.description,
  );

  return {
    title,
    description,
    alternates: { canonical: `/merch/kategori/${collection.handle}` },
    openGraph: {
      title: `${title} — Kallsup`,
      description,
      url: `/merch/kategori/${collection.handle}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { handle } = await params;
  const [result, collections] = await Promise.all([
    getCollection(handle),
    getCollections(),
  ]);

  if (!result) {
    notFound();
  }

  const { collection, products } = result;
  const categories = filterCategories(collections ?? []);

  return (
    <section className="section-y pt-32 md:pt-40">
      <div className="shell">
        {/* Always "Merch" — the underlined chip below says which category you
            are in, and swapping the masthead made every category read as a
            separate section of the site. */}
        <SectionHeader title="Merch" />

        <Reveal>
          <CategoryNav categories={categories} current={collection.handle} />

          <MerchGrid
            products={products}
            emptyMessage="Inga produkter här just nu."
          />
        </Reveal>
      </div>
    </section>
  );
}

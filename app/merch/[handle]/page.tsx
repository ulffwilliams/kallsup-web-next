import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import AddToCartForm from "../../_components/AddToCartForm";
import Reveal from "../../_components/Reveal";
import { getAllProducts, getProduct } from "../../_lib/shopify";
import { metaDescription, productJsonLd } from "../../_lib/seo";

export const revalidate = 600;

const SITE_URL = "https://kallsup.se";

type PageProps = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  const products = await getAllProducts();

  return (products ?? []).map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Produkten finns inte" };
  }

  const title = product.seoTitle ?? product.title;
  const description = metaDescription(
    product.seoDescription ?? product.description,
  );
  const url = `/merch/${product.handle}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Kallsup`,
      description,
      url,
      type: "website",
      images: product.image
        ? [
            {
              url: product.image.url,
              width: product.image.width,
              height: product.image.height,
              alt: product.image.alt,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  const jsonLd = productJsonLd({
    title: product.title,
    description: metaDescription(product.seoDescription ?? product.description),
    url: `${SITE_URL}/merch/${product.handle}`,
    image: product.image?.url ?? null,
    price: product.priceAmount,
    currency: product.currencyCode,
    available: product.available,
  });

  return (
    <section className="section-y pt-32 md:pt-40">
      <div className="shell">
        <Reveal>
          <nav aria-label="Brödsmulor" className="type-label mb-8 text-kall-cream">
            {/* Everything is cream now, so the link needs its own hover tell —
                otherwise nothing distinguishes it from the current page. */}
            <Link href="/merch" className="transition-colors hover:text-kall-gold">
              Merch
            </Link>
            <span aria-hidden="true" className="text-kall-600">
              {" / "}
            </span>
            <span>{product.title}</span>
          </nav>
        </Reveal>

        <Reveal className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="flex flex-col gap-4">
            {product.images.length > 0 ? (
              product.images.map((image) => (
                <div
                  key={image.url}
                  className="relative aspect-square w-full overflow-hidden bg-kall-900/40"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 90vw, 45vw"
                    className="object-cover"
                  />
                  <div className="grain-overlay" aria-hidden="true" />
                </div>
              ))
            ) : (
              <div className="relative flex aspect-square w-full items-center justify-center border border-dashed border-kall-700 bg-kall-900/40">
                <span className="type-label uppercase">{product.title}</span>
              </div>
            )}
          </div>

          <div className="md:sticky md:top-28 md:self-start">
            <h1 className="type-huge mb-4 text-kall-cream">{product.title}</h1>
            <p className="type-price mb-8">{product.price}</p>

            <AddToCartForm product={product} />

            {product.descriptionHtml && (
              /* HTML authored in the Shopify admin, not by visitors, so this
                 is not an injection surface. */
              <div
                className="type-meta mt-10 max-w-prose space-y-4"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}
          </div>
        </Reveal>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

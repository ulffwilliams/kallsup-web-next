import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import SectionHeader from "../../_components/SectionHeader";
import Reveal from "../../_components/Reveal";
import SitePrivacyNotice from "../../_components/SitePrivacyNotice";
import { getPolicies, getPolicy } from "../../_lib/shopify";
import { policyBySlug } from "../../_lib/policies";
import { metaDescription } from "../../_lib/seo";

export const revalidate = 600;

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Only prerenders the policies the store has actually published. An
 * unreachable shop yields an empty list rather than failing the build.
 */
export async function generateStaticParams() {
  const policies = await getPolicies();

  return (policies ?? []).map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = policyBySlug(slug);

  if (!route) {
    return { title: "Sidan finns inte" };
  }

  return {
    title: route.title,
    description: metaDescription(route.summary),
    alternates: { canonical: `/villkor/${route.slug}` },
  };
}

export default async function PolicyPage({ params }: PageProps) {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) {
    notFound();
  }

  const isPrivacy = slug === "integritetspolicy";

  return (
    <section className="section-y pt-32 md:pt-40">
      <div className="shell">
        <Reveal>
          <nav aria-label="Brödsmulor" className="type-label mb-8 text-kall-cream">
            <Link
              href="/villkor"
              className="transition-colors hover:text-kall-gold"
            >
              Villkor
            </Link>
            <span aria-hidden="true" className="text-kall-600">
              {" / "}
            </span>
            <span>{policy.title}</span>
          </nav>
        </Reveal>

        <SectionHeader title={policy.title} />

        {/* This site's own processing goes first. Shopify's policy lists
            card numbers and contact details, which is true of its checkout and
            false of kallsup.se — read in that order, a visitor would conclude
            this page takes their card. */}
        {isPrivacy && (
          <>
            <SitePrivacyNotice />
            <h2 className="policy-prose mb-6 max-w-prose text-kall-cream">
              Butikspolicy
            </h2>
          </>
        )}

        {/* Deliberately not wrapped in Reveal: a fade-in on a document
            someone opened specifically to read is friction, and a legal text
            is the last thing that should depend on an observer firing.

            The HTML is the same Shopify renders in its checkout, authored in
            the store admin rather than by visitors, so this is not an
            injection surface. One source means the pre-purchase text and the
            checkout text cannot drift apart. */}
        <div
          className="policy-prose max-w-prose"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      </div>
    </section>
  );
}

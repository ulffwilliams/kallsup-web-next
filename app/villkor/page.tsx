import type { Metadata } from "next";
import Link from "next/link";

import SectionHeader from "../_components/SectionHeader";
import Reveal from "../_components/Reveal";
import { getPolicies } from "../_lib/shopify";
import { POLICY_ROUTES } from "../_lib/policies";
import { metaDescription } from "../_lib/seo";
import { company } from "../_lib/site";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Villkor",
  description: metaDescription(
    "Köpvillkor, ångerrätt, frakt och integritetspolicy för Kallsups webbshop.",
  ),
  alternates: { canonical: "/villkor" },
};

export default async function VillkorPage() {
  const policies = await getPolicies();
  const published = new Set((policies ?? []).map((policy) => policy.slug));

  return (
    <section className="section-y pt-32 md:pt-40">
      <div className="shell">
        <SectionHeader title="Villkor" />

        <Reveal>
          <ul className="max-w-prose">
            {POLICY_ROUTES.map((route) => (
              <li key={route.slug} className="border-t border-kall-800 py-5">
                {published.has(route.slug) ? (
                  <Link href={`/villkor/${route.slug}`} className="group block">
                    <p className="text-sm tracking-[0.04em] text-kall-cream uppercase transition-colors group-hover:text-kall-gold">
                      {route.title}
                    </p>
                    <p className="type-label mt-1">{route.summary}</p>
                  </Link>
                ) : (
                  /* A policy the shop has not written yet is listed but not
                     linked, so the gap is visible rather than silent. */
                  <div>
                    <p className="text-sm tracking-[0.04em] uppercase">
                      {route.title}
                    </p>
                    <p className="type-label mt-1">Publiceras inom kort.</p>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <address className="type-meta mt-12 max-w-prose not-italic">
            {company.legalName}, org.nr {company.orgNumber}
            <br />
            {company.street}
            {company.postalTown ? <>, {company.postalTown}</> : null}
            <br />
            <a href={`mailto:${company.email}`} className="link-underline">
              {company.email}
            </a>
          </address>
        </Reveal>
      </div>
    </section>
  );
}

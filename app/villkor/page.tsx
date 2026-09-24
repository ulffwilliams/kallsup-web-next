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
                    <p className="text-sm tracking-[0.04em] text-kall-cream transition-colors group-hover:text-kall-gold">
                      {route.title}
                    </p>
                    {/* type-meta, not type-label: the label role is 11px of kall-500, which
                        disappears against the olive background at body-text size. */}
                    <p className="type-meta mt-1">{route.summary}</p>
                  </Link>
                ) : (
                  /* A policy the shop has not written yet is listed but not
                     linked, so the gap is visible rather than silent. */
                  <div>
                    <p className="text-sm tracking-[0.04em]">
                      {route.title}
                    </p>
                    <p className="type-meta mt-1">Publiceras inom kort.</p>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* The seller's identity. E-handelslagen (2002:562) wants it easy,
              direct and permanently available; the footer links here from
              every page, which is where it belongs — beside the terms it
              governs rather than repeated in the chrome.

              The postal line is skipped entirely while `postalTown` is empty,
              rather than printing a street with no town. */}
          <section className="mt-14 border-t border-kall-800 pt-8">
            <address className="type-meta max-w-prose leading-7 not-italic">
              <span className="text-kall-cream">{company.legalName}</span>
              <br />
              Organisationsnummer {company.orgNumber}
              <br />
              Momsregistreringsnummer {company.vatNumber}
              {company.postalTown ? (
                <>
                  <br />
                  {company.street}, {company.postalTown}
                </>
              ) : null}
              <br />
              <a href={`mailto:${company.email}`} className="link-underline">
                {company.email}
              </a>
            </address>
          </section>
        </Reveal>
      </div>
    </section>
  );
}

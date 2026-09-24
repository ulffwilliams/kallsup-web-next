import Image from "next/image";
import Link from "next/link";

import { site, company } from "../_lib/site";
import { POLICY_ROUTES } from "../_lib/policies";

/**
 * Closing slab. Carries the seller's identity, which e-handelslagen
 * (2002:562) requires to be easy, direct and permanently available — a footer
 * on every page is the usual way to meet that.
 *
 * The postal line is skipped entirely while `postalTown` is empty, rather
 * than printing a street with no town.
 */
function SiteFooter() {
  return (
    <footer className="relative z-10 bg-kall-black pt-10 pb-6">
      <div className="shell">
        <div className="grid gap-8 sm:grid-cols-2">
          <address className="type-label not-italic">
            <span className="text-kall-300">{company.legalName}</span>
            <br />
            Org.nr {company.orgNumber} · Momsreg.nr {company.vatNumber}
            <br />
            {company.street}
            {company.postalTown ? `, ${company.postalTown}` : ""}
            <br />
            <a href={`mailto:${company.email}`} className="hover:text-kall-cream">
              {company.email}
            </a>
            {" · "}
            <a
              href={`tel:${company.phone.replace(/\s/g, "")}`}
              className="hover:text-kall-cream"
            >
              {company.phone}
            </a>
          </address>

          <nav aria-label="Villkor" className="sm:justify-self-end">
            <ul className="type-label flex flex-col gap-2 sm:text-right">
              {POLICY_ROUTES.map((route) => (
                <li key={route.slug}>
                  <Link
                    href={`/villkor/${route.slug}`}
                    className="hover:text-kall-cream"
                  >
                    {route.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-kall-800 pt-5">
          <Image
            src="/images/skarrad-vit.png"
            alt={site.name}
            width={396}
            height={100}
            className="h-4 w-auto md:h-5 [filter:brightness(0.47)_sepia(0.35)_saturate(1.6)]"
          />
          <p className="type-label">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

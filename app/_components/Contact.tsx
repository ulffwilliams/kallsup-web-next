import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { site, instagram } from "../_lib/site";

/** Kontakt / Boka — full-width split, mail left, socials right. */
function Contact() {
  return (
    <section id="kontakt" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader title="Kontakt" />

        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <a
              href={`mailto:${site.email}`}
              className="link-underline font-mono text-xl tracking-[0.06em] text-kall-cream sm:text-2xl"
            >
              {site.email}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default Contact;

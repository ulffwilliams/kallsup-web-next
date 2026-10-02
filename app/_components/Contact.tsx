import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { site } from "../_lib/site";

/** Kontakt / Boka. One address; the socials already sit in the header. */
function Contact() {
  return (
    <section id="kontakt" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader title="Kontakt" />

        <Reveal>
          <a
            href={`mailto:${site.email}`}
            className="link-underline font-mono text-xl tracking-[0.06em] text-kall-cream sm:text-2xl"
          >
            {site.email}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export default Contact;

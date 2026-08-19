"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import MobileMenu from "./MobileMenu";
import { nav, socials, site } from "../_lib/site";

/**
 * Sticky chrome: nav left, logo mark centre, socials right. Collapses to a
 * shorter blurred bar with a hairline once the hero is scrolled past.
 */
function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        data-scrolled={scrolled}
        className="group fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,backdrop-filter,border-color] duration-300 data-[scrolled=true]:border-kall-700 data-[scrolled=true]:bg-kall-void/80 data-[scrolled=true]:backdrop-blur-md"
      >
        <div className="shell flex items-center justify-between py-5 transition-[padding] duration-300 group-data-[scrolled=true]:py-2">
          <nav
            aria-label="Huvudmeny"
            className="hidden flex-1 md:flex md:gap-7"
          >
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="link-nav">
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#top"
            aria-label={`${site.name} — till toppen`}
            className="logo-shell shrink-0"
          >
            <span className="logo-static-layer" aria-hidden="true" />
            <Image
              src="/images/loggavit.png"
              alt={site.name}
              width={140}
              height={40}
              priority
              className="logo-mark h-7 w-auto transition-[height] duration-300 md:h-8"
            />
            <span className="logo-glow-layer" aria-hidden="true" />
          </a>

          <div className="flex flex-1 items-center justify-end gap-5">
            <div className="hidden items-center gap-4 md:flex">
              {socials.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-img"
                  aria-label={social.label}
                >
                  <Image
                    src={social.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5"
                  />
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="type-label text-kall-cream md:hidden"
            >
              {menuOpen ? "Stäng" : "Meny"}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

export default SiteHeader;

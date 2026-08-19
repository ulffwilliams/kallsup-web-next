"use client";

import { useEffect } from "react";
import { nav, socials} from "../_lib/site";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

/** Full-screen overlay nav with oversized items. Locks body scroll while open. */
function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-menu"
      hidden={!open}
      className="fixed inset-0 z-40 flex flex-col justify-between bg-kall-void/97 px-6 pt-28 pb-10 backdrop-blur-sm md:hidden"
    >
      <nav aria-label="Huvudmeny">
        <ul className="flex flex-col gap-2">
          {nav.map((item, index) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onClose}
                className="type-huge block py-1 text-kall-cream transition-colors hover:text-kall-gold"
              >
                <span className="type-label mr-3 align-super">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-6">
        <a
          href="https://varorecords.bandcamp.com/album/alldeles-f-r-n-ra"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-solid justify-center"
        >
          Köp skivan
        </a>
        <div className="flex gap-6">
          {socials.map((social) => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-img"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={social.icon} alt={social.label} className="size-7" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;

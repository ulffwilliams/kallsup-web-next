"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { useCart } from "./CartProvider";

/**
 * Slide-over cart. Scroll lock, Escape-to-close and focus handling mirror
 * `MobileMenu`, which this sits above: the header is `z-50` and the mobile nav
 * `z-40`, so the drawer takes `z-[60]` to stay on top of both.
 *
 * Checkout is Shopify-hosted — the Checkout API is not available outside
 * Shopify Plus — so the last step leaves the site.
 */
function CartDrawer() {
  const { cart, isOpen, closeCart, setQuantity, isPending } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, closeCart]);

  const lines = cart?.lines ?? [];

  return (
    /* Stays mounted so the panel can slide out as well as in: `hidden` would
       drop it before any transition ran. `invisible` flips at the end of the
       closing transition (visibility steps, it does not fade) and `inert`
       keeps the closed drawer out of the tab order and the accessibility tree. */
    <div
      inert={!isOpen}
      className={`fixed inset-0 z-[60] transition-[visibility] duration-500 motion-reduce:duration-0 ${
        isOpen ? "visible" : "invisible"
      }`}
    >
      {/* Blur only, no tint — the page behind stays readable at its own
          brightness, just out of focus. */}
      <button
        type="button"
        aria-label="Stäng korgen"
        onClick={closeCart}
        className={`absolute inset-0 h-full w-full backdrop-blur-md transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Varukorg"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-kall-700 bg-kall-900 shadow-[-24px_0_48px_-12px_rgb(0_0_0/0.5)] outline-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-kall-700 px-6 py-5">
          <h2 className="type-label uppercase">Varukorg</h2>
          <button
            type="button"
            onClick={closeCart}
            className="type-label text-kall-cream"
          >
            Stäng
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="type-label px-6 py-8">Varukorgen är tom.</p>
        ) : (
          <ul className="flex-1 overflow-y-auto px-6 py-4">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex gap-4 border-b border-kall-800 py-4"
              >
                {line.image && (
                  <div className="relative size-16 shrink-0 overflow-hidden bg-kall-800">
                    <Image
                      src={line.image.url}
                      alt={line.image.alt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm tracking-[0.04em] text-kall-cream uppercase">
                    {line.productTitle}
                  </p>
                  <p className="type-label mt-1">{line.variantTitle}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Minska antal"
                      disabled={isPending}
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                      className="type-label border border-kall-700 px-2 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="type-label">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Öka antal"
                      disabled={isPending}
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                      className="type-label border border-kall-700 px-2 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="type-label shrink-0">{line.total}</p>
              </li>
            ))}
          </ul>
        )}

        {cart && lines.length > 0 && (
          <div className="border-t border-kall-700 px-6 py-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="type-label uppercase">Delsumma</span>
              <span className="type-label">{cart.subtotal}</span>
            </div>
            {/* Shopify calculates shipping at checkout from the delivery
                address, so the drawer can only ever show the goods total. */}
            <p className="type-label mb-4">Frakt tillkommer i kassan.</p>
            <a
              href={cart.checkoutUrl}
              className="btn btn-solid w-full justify-center"
            >
              Till kassan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;

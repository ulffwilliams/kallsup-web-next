"use client";

import { useEffect, useRef, useState } from "react";

import { useCart } from "./CartProvider";
import {
  defaultSelection,
  findVariant,
  isValueAvailable,
} from "../_lib/variants";
import type { Selection } from "../_lib/variants";
import type { ShopifyProduct } from "../_lib/shopify";

type AddToCartFormProps = {
  product: ShopifyProduct;
  /**
   * `"detail"` shows the picker up front — the product page exists to lay
   * everything out. `"card"` keeps the grid clean and only asks for a size
   * once the visitor has said they want the thing.
   */
  mode?: "card" | "detail";
};

const CONFIRMATION_MS = 2000;

const CHIP_BASE = "type-label border px-3 py-1 transition-colors";
const CHIP_IDLE =
  "border-kall-700 text-kall-500 hover:border-kall-600 hover:text-kall-300";
const CHIP_SELECTED = "border-kall-cream text-kall-cream";

/**
 * Option chips plus the add-to-cart button, shared by the grid card and the
 * product page so variant resolution exists once.
 *
 * Chips never appear for single-variant products: Shopify gives those a
 * synthetic option — `Title: "Default Title"` — and offering it as a choice
 * would be nonsense.
 */
function AddToCartForm({ product, mode = "detail" }: AddToCartFormProps) {
  const { add, openCart, isPending } = useCart();
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(product),
  );
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "choosing" | "added">("idle");

  const containerRef = useRef<HTMLDivElement>(null);
  const firstChipRef = useRef<HTMLButtonElement>(null);
  const confirmationTimer = useRef<number | undefined>(undefined);

  const hasChoices = product.variants.length > 1;
  const sellable = product.variants.some((variant) => variant.available);

  /* The expanding flow only reads well for a single question. A product with
     both a size and a colour needs the full picker, so it falls back to the
     detail layout rather than growing a wizard. */
  const expands =
    mode === "card" && hasChoices && product.optionGroups.length === 1;

  useEffect(() => {
    return () => window.clearTimeout(confirmationTimer.current);
  }, []);

  /* Moves focus onto the choices as they appear, so the keyboard path is the
     same one the pointer takes. */
  useEffect(() => {
    if (step === "choosing") {
      firstChipRef.current?.focus();
    }
  }, [step]);

  /* Escape, or a click anywhere else, backs out of a half-made decision. */
  useEffect(() => {
    if (step !== "choosing") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStep("idle");
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setStep("idle");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [step]);

  const addVariant = async (variantId: string) => {
    setError(null);

    const message = await add(variantId);

    if (message) {
      setError(message);
      setStep("idle");
      return;
    }

    setStep("added");
    openCart();

    confirmationTimer.current = window.setTimeout(
      () => setStep("idle"),
      CONFIRMATION_MS,
    );
  };

  const onPrimaryClick = () => {
    if (expands) {
      setStep("choosing");
      return;
    }

    const variant = findVariant(product, selection);

    if (variant) {
      void addVariant(variant.id);
    }
  };

  if (!sellable) {
    return (
      <div className="mt-4">
        <button
          type="button"
          disabled
          className="btn btn-solid w-full cursor-not-allowed justify-center opacity-50"
        >
          Slutsåld
        </button>
      </div>
    );
  }

  const selectedVariant = findVariant(product, selection);
  const selectedSoldOut = !selectedVariant?.available;

  return (
    <div ref={containerRef}>
      {/* The detail layout asks every question up front. */}
      {!expands &&
        hasChoices &&
        product.optionGroups.map((group) => (
          <fieldset key={group.name} className="mt-3">
            <legend className="type-label mb-2">{group.name}</legend>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const selected = selection[group.name] === value;
                const available = isValueAvailable(
                  product,
                  group.name,
                  value,
                  selection,
                );

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setSelection((current) => ({
                        ...current,
                        [group.name]: value,
                      }))
                    }
                    className={`${CHIP_BASE} ${
                      selected ? CHIP_SELECTED : CHIP_IDLE
                    } ${available ? "" : "line-through opacity-50"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

      {step === "choosing" && expands ? (
        <div
          role="group"
          aria-label={`Välj ${product.optionGroups[0].name.toLowerCase()}`}
          className="mt-4 flex gap-2"
        >
          {product.optionGroups[0].values.map((value, index) => {
            const group = product.optionGroups[0];
            const variant = findVariant(product, { [group.name]: value });
            const available = Boolean(variant?.available);

            return (
              <button
                key={value}
                ref={index === 0 ? firstChipRef : undefined}
                type="button"
                disabled={!available || isPending}
                onClick={() => variant && void addVariant(variant.id)}
                /* Same `btn btn-solid` the primary button wears, so the row
                   reads as that button splitting apart rather than as a
                   different control appearing. `px-2` narrows it enough for
                   five sizes to fit a card column; the height comes from
                   .btn's own vertical padding and stays identical. */
                className={`btn btn-solid flex-1 justify-center px-2 ${
                  available
                    ? ""
                    : "cursor-not-allowed line-through opacity-40 hover:bg-kall-cream"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={onPrimaryClick}
          disabled={(!expands && selectedSoldOut) || isPending}
          aria-expanded={expands ? step === "choosing" : undefined}
          className="btn btn-solid mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          {step === "added"
            ? "Tillagd ✓"
            : !expands && selectedSoldOut
              ? "Slutsåld"
              : isPending
                ? "Lägger i varukorg…"
                : "Lägg i varukorg"}
        </button>
      )}

      {error && (
        <p role="alert" className="type-label mt-2 text-kall-ember">
          {error}
        </p>
      )}
    </div>
  );
}

export default AddToCartForm;

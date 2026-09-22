"use client";

import { useState } from "react";
import Image from "next/image";

import { useCart } from "./CartProvider";
import {
  defaultSelection,
  findVariant,
  isValueAvailable,
} from "../_lib/variants";
import type { Selection } from "../_lib/variants";
import type { ShopifyProduct } from "../_lib/shopify";

const IMAGE_SIZES = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw";

/**
 * One product. Option chips only appear for products with more than one
 * variant, so a single-SKU record stays a plain card. An item with a second
 * product shot crossfades to it on hover — only the top shot fades, because
 * dissolving both at once dips through the tile background as a grey flash.
 */
function MerchCard({ product }: { product: ShopifyProduct }) {
  const { add, openCart, isPending } = useCart();
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(product),
  );
  const [error, setError] = useState<string | null>(null);

  const variant = findVariant(product, selection);
  const hasChoices = product.variants.length > 1;
  const soldOut = !variant?.available;

  const onAdd = async () => {
    if (!variant) {
      return;
    }

    setError(null);

    const message = await add(variant.id);

    if (message) {
      setError(message);
      return;
    }

    openCart();
  };

  return (
    <div className="group">
      {product.image ? (
        <div className="relative aspect-square w-full overflow-hidden bg-kall-900/40">
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes={IMAGE_SIZES}
            className="hover-zoom object-cover"
          />
          {product.hoverImage && (
            <Image
              src={product.hoverImage.url}
              alt=""
              aria-hidden="true"
              fill
              sizes={IMAGE_SIZES}
              className="hover-zoom object-cover opacity-0 transition-opacity duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
            />
          )}
          <div className="grain-overlay" aria-hidden="true" />
        </div>
      ) : (
        <div className="relative flex aspect-square w-full items-center justify-center border border-dashed border-kall-700 bg-kall-900/40">
          <span className="type-label uppercase">{product.title}</span>
          <div className="grain-overlay" aria-hidden="true" />
        </div>
      )}

      <p className="mt-4 text-sm tracking-[0.04em] text-kall-cream uppercase">
        {product.title}
      </p>
      <p className="type-label mt-1">{variant?.price ?? product.price}</p>

      {hasChoices &&
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
                    className={`type-label border px-3 py-1 transition-colors ${
                      selected
                        ? "border-kall-cream text-kall-cream"
                        : "border-kall-700 text-kall-500 hover:border-kall-600 hover:text-kall-300"
                    } ${available ? "" : "line-through opacity-50"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut || isPending}
        className="btn btn-solid mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {soldOut
          ? "Slutsåld"
          : isPending
            ? "Lägger i varukorg…"
            : "Lägg i varukorg"}
      </button>

      {error && (
        <p role="alert" className="type-label mt-2 text-kall-ember">
          {error}
        </p>
      )}
    </div>
  );
}

export default MerchCard;

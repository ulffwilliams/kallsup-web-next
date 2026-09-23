"use client";

import { useState } from "react";

import { useCart } from "./CartProvider";
import {
  defaultSelection,
  findVariant,
  isValueAvailable,
} from "../_lib/variants";
import type { Selection } from "../_lib/variants";
import type { ShopifyProduct } from "../_lib/shopify";

/**
 * Option chips plus the add-to-cart button, shared by the grid card and the
 * product page so variant resolution exists once.
 *
 * Chips render only when a product has more than one variant. Shopify gives
 * single-variant products a synthetic option — `Title: "Default Title"` — and
 * showing that as a picker would be nonsense.
 */
function AddToCartForm({ product }: { product: ShopifyProduct }) {
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
    <div>
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

export default AddToCartForm;

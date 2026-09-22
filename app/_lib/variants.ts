/**
 * Pure option/variant resolution, kept apart from `shopify.ts` so client
 * components can import it without dragging the API module — and the token
 * logic it reads from `process.env` — into the browser bundle. The import
 * below is type-only and is erased at compile time.
 */
import type { ShopifyProduct, ShopifyVariant } from "./shopify";

export type Selection = Record<string, string>;

/**
 * Opens the card on something a visitor can actually buy. Falls back to the
 * first variant so a fully sold-out product still shows a coherent state.
 */
export function defaultSelection(product: ShopifyProduct): Selection {
  const variant =
    product.variants.find((candidate) => candidate.available) ??
    product.variants[0];

  return variant ? { ...variant.options } : {};
}

export function findVariant(
  product: ShopifyProduct,
  selection: Selection,
): ShopifyVariant | null {
  return (
    product.variants.find((variant) =>
      product.optionGroups.every(
        (group) => variant.options[group.name] === selection[group.name],
      ),
    ) ?? null
  );
}

/**
 * Whether picking `value` in `groupName` leads to something purchasable,
 * holding the visitor's other choices fixed. Drives the disabled state on the
 * option chips so dead ends are visible before they are clicked.
 */
export function isValueAvailable(
  product: ShopifyProduct,
  groupName: string,
  value: string,
  selection: Selection,
): boolean {
  return product.variants.some(
    (variant) =>
      variant.available &&
      variant.options[groupName] === value &&
      product.optionGroups.every(
        (group) =>
          group.name === groupName ||
          selection[group.name] === undefined ||
          variant.options[group.name] === selection[group.name],
      ),
  );
}

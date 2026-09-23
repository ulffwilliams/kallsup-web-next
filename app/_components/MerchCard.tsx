import Image from "next/image";
import Link from "next/link";

import AddToCartForm from "./AddToCartForm";
import type { ShopifyProduct } from "../_lib/shopify";

const IMAGE_SIZES = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw";

type MerchCardProps = {
  product: ShopifyProduct;
  /** Wraps the image and title in a link to the product page. */
  linkToProduct?: boolean;
};

/**
 * One product in a grid. A server component now — the interactive part lives
 * in `AddToCartForm`, so the card itself ships no JavaScript.
 *
 * An item with a second product shot crossfades to it on hover. Only the top
 * shot fades: dissolving both at once dips through the tile background as a
 * grey flash.
 */
function MerchCard({ product, linkToProduct = true }: MerchCardProps) {
  const href = `/merch/${product.handle}`;

  const media = product.image ? (
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
  );

  const label = (
    <>
      <p className="mt-4 text-sm tracking-[0.04em] text-kall-cream uppercase">
        {product.title}
      </p>
      {/* kall-500 label type buried the price against the imagery; cream at
          meta size keeps it readable without competing with the name. */}
      <p className="type-meta mt-1 text-kall-cream">{product.price}</p>
    </>
  );

  return (
    <div className="group">
      {linkToProduct ? (
        <Link href={href} className="block">
          {media}
          {label}
        </Link>
      ) : (
        <>
          {media}
          {label}
        </>
      )}

      <AddToCartForm product={product} mode="card" />
    </div>
  );
}

export default MerchCard;

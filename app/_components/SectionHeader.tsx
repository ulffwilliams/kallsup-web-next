import Reveal from "./Reveal";

type SectionHeaderProps = {
  title: string;
  /** Right-aligned counter or aside, e.g. "05 datum". */
  aside?: string;
  /** Flips the masthead so the title sits right and the aside left. */
  mirrored?: boolean;
};

/**
 * Shared section masthead: micro-label, oversized display title, optional
 * right-aligned counter, hairline rule. Gives every slab the same entry rhythm.
 */
function SectionHeader({ title, aside, mirrored }: SectionHeaderProps) {
  return (
    <Reveal className="mb-10 md:mb-14">
      <div
        className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-3${
          mirrored ? " flex-row-reverse" : ""
        }`}
      >
        <h2 className="type-huge text-kall-cream">{title}</h2>
        {aside && <p className="type-label pb-2">{aside}</p>}
      </div>
    </Reveal>
  );
}

export default SectionHeader;

import Reveal from "./Reveal";

type SectionHeaderProps = {
  title: string;
  /** Right-aligns the title, for the mirrored Musik slab. */
  mirrored?: boolean;
};

/**
 * Shared section masthead: one oversized display title. Gives every slab the
 * same entry rhythm.
 */
function SectionHeader({ title, mirrored }: SectionHeaderProps) {
  return (
    <Reveal className="mb-10 md:mb-14">
      <h2
        className={`type-huge text-kall-cream${mirrored ? " text-right" : ""}`}
      >
        {title}
      </h2>
    </Reveal>
  );
}

export default SectionHeader;

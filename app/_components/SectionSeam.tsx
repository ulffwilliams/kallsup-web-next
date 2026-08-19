/**
 * Hero → Live seam. Purely decorative, no copy and no border box: a warm bloom
 * bleeds down out of the hero photo, a hairline dissolves at both edges instead
 * of ruling a hard line, and the grain carries over from the imagery above — so
 * the two slabs read as one continuous surface rather than stacked panels.
 */
function SectionSeam() {
  return (
    <div aria-hidden="true" className="section-seam z-10">
      <div className="grain-overlay" />
    </div>
  );
}

export default SectionSeam;

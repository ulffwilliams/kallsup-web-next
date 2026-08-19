import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";

/**
 * Video. Single embedded music video, 16:9, full width of the shell.
 *
 * Uses youtube-nocookie so the player doesn't drop tracking cookies before the
 * visitor presses play, and `loading="lazy"` so the YouTube payload stays off
 * the critical path — the section sits well below the fold.
 */
const VIDEO_ID = "ts2tQTctmTk";
const VIDEO_TITLE = "Kallsup — Kino (officiell musikvideo)";

function Video() {
  return (
    <section id="video" className="section-y scroll-mt-24">
      <div className="shell">
        <SectionHeader title="Kino" aside="Kino" />

        <Reveal>
          <div className="relative aspect-video w-full overflow-hidden">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`}
              title={VIDEO_TITLE}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <p className="type-label mt-3">{VIDEO_TITLE}</p>
        </Reveal>
      </div>
    </section>
  );
}

export default Video;

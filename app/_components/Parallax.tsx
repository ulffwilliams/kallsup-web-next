"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type ParallaxProps = {
  children: ReactNode;
  /**
   * Fraction of the scroll distance the layer moves relative to the page.
   * 0 = pinned to the page, positive = lags behind it (drifts down), negative
   * = outruns it (drifts up).
   */
  speed?: number;
  /** Fade the layer out as it drifts. Fully transparent after one viewport. */
  fade?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

/**
 * Drifts its children against the page scroll. Runs off a passive scroll
 * listener coalesced into a single rAF write, and stays put entirely for
 * reduced-motion users so the hero type never moves on them.
 *
 * Stacked siblings collide unless their speeds are ordered: the vertical gap
 * between two layers changes by (upper.speed - lower.speed) * scrollY, so an
 * upper layer with the larger speed eats the gap and overlaps whatever sits
 * below. Keep speed non-increasing down the stack and every gap only widens.
 */
function Parallax({
  children,
  speed = 0.3,
  fade = false,
  as: Tag = "div",
  className,
  style,
}: ParallaxProps) {
  const Element = Tag as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduced.matches) {
      return;
    }

    let frame = 0;

    const paint = () => {
      frame = 0;

      const progress = window.scrollY / window.innerHeight;
      const offset = window.scrollY * speed;

      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;

      if (fade) {
        node.style.opacity = `${Math.max(0, 1 - progress * 1.35).toFixed(3)}`;
      }
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(paint);
      }
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      node.style.transform = "";
      node.style.opacity = "";
    };
  }, [fade, speed]);

  return (
    <Element
      ref={ref}
      className={className}
      style={{ willChange: "transform", ...style }}
    >
      {children}
    </Element>
  );
}

export default Parallax;

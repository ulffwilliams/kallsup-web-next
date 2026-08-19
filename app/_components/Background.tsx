"use client";

import { useEffect, useRef } from "react";

function mixColor(start: number[], end: number[], amount: number) {
  return start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * amount),
  );
}

function toRgb(color: number[]) {
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}

const colorStops = [
  {
    top: [30, 25, 14],
    middle: [88, 79, 31],
    glow: [198, 157, 79],
    base: [7, 6, 5],
  },
  {
    top: [38, 24, 15],
    middle: [113, 80, 35],
    glow: [185, 116, 74],
    base: [11, 8, 7],
  },
  {
    top: [46, 24, 18],
    middle: [132, 77, 43],
    glow: [164, 89, 74],
    base: [16, 10, 9],
  },
  {
    top: [33, 22, 14],
    middle: [97, 69, 30],
    glow: [146, 102, 63],
    base: [8, 7, 6],
  },
];

/**
 * Scroll-driven ground for the whole page.
 *
 * Writes four interpolated colours plus the raw scroll progress as custom
 * properties on <html>; the gradient itself lives in globals.css under
 * `#background`, so nothing rebuilds a multi-kilobyte gradient string per
 * frame. --scroll-progress is also readable by any other component that wants
 * to react to page depth.
 */
function Background() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backgroundRef.current) {
      return;
    }

    const root = document.documentElement;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let animationFrame = 0;
    let currentProgress = 0;
    let targetProgress = 0;

    const applyBackground = (progress: number) => {
      const scaled = progress * (colorStops.length - 1);
      const startIndex = Math.floor(scaled);
      const endIndex = Math.min(startIndex + 1, colorStops.length - 1);
      const mixAmount = scaled - startIndex;
      const from = colorStops[startIndex];
      const to = colorStops[endIndex];

      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty(
        "--grad-top",
        toRgb(mixColor(from.top, to.top, mixAmount)),
      );
      root.style.setProperty(
        "--grad-mid",
        toRgb(mixColor(from.middle, to.middle, mixAmount)),
      );
      root.style.setProperty(
        "--grad-glow",
        toRgb(mixColor(from.glow, to.glow, mixAmount)),
      );
      root.style.setProperty(
        "--grad-base",
        toRgb(mixColor(from.base, to.base, mixAmount)),
      );
    };

    const animate = () => {
      currentProgress += (targetProgress - currentProgress) * 0.08;
      applyBackground(currentProgress);

      if (Math.abs(targetProgress - currentProgress) > 0.001) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      currentProgress = targetProgress;
      applyBackground(currentProgress);
      animationFrame = 0;
    };

    const updateTarget = () => {
      const scrollRange =
        document.documentElement.scrollHeight - window.innerHeight;
      targetProgress =
        scrollRange > 0 ? Math.min(window.scrollY / scrollRange, 1) : 0;

      if (reduceMotion) {
        currentProgress = targetProgress;
        applyBackground(currentProgress);
        return;
      }

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    applyBackground(0);
    updateTarget();

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);

    return () => {
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={backgroundRef}
        id="background"
        className="fixed inset-0 z-0"
        aria-hidden="true"
      />
      <div
        id="background-image-layer"
        className="fixed inset-0 z-0"
        aria-hidden="true"
      />
      <div
        id="background-noise"
        className="fixed inset-0 z-0 opacity-20"
        aria-hidden="true"
      />
    </>
  );
}

export default Background;

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

function Background() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;

    if (!background) {
      return;
    }

    let animationFrame = 0;
    let currentProgress = 0;
    let targetProgress = 0;

    const applyBackground = (progress: number) => {
      const scaled = progress * (colorStops.length - 1);
      const startIndex = Math.floor(scaled);
      const endIndex = Math.min(startIndex + 1, colorStops.length - 1);
      const mixAmount = scaled - startIndex;

      const top = mixColor(
        colorStops[startIndex].top,
        colorStops[endIndex].top,
        mixAmount,
      );
      const middle = mixColor(
        colorStops[startIndex].middle,
        colorStops[endIndex].middle,
        mixAmount,
      );
      const glow = mixColor(
        colorStops[startIndex].glow,
        colorStops[endIndex].glow,
        mixAmount,
      );
      const base = mixColor(
        colorStops[startIndex].base,
        colorStops[endIndex].base,
        mixAmount,
      );

      const glowX = 12 + progress * 54;
      const glowY = 15 + progress * 46;
      const accentX = 82 - progress * 31;
      const accentY = 10 + progress * 54;
      const emberX = 34 + progress * 18;
      const emberY = 78 - progress * 24;

      background.style.backgroundImage = `
        radial-gradient(circle at ${glowX}% ${glowY}%, ${toRgb(glow)} 0%, rgba(198, 157, 79, 0.18) 18%, transparent 42%),
        radial-gradient(circle at ${accentX}% ${accentY}%, rgba(172, 93, 74, 0.24) 0%, transparent 34%),
        radial-gradient(circle at ${emberX}% ${emberY}%, rgba(124, 116, 56, 0.16) 0%, transparent 30%),
        linear-gradient(180deg, ${toRgb(top)} 0%, ${toRgb(middle)} 48%, ${toRgb(base)} 100%)
      `;
    };

    const updateTarget = () => {
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      targetProgress =
        scrollRange > 0 ? Math.min(window.scrollY / scrollRange, 1) : 0;

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(animate);
      }
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
        className="fixed inset-0 -z-10 bg-[#090807]"
        aria-hidden="true"
      />
      <div
        id="background-image-layer"
        className="fixed inset-0 -z-10"
        aria-hidden="true"
      />
      <div
        id="background-noise"
        className="fixed inset-0 -z-10 opacity-20"
        aria-hidden="true"
      />
    </>
  );
}

export default Background;

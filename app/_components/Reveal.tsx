"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger in ms, applied as a CSS transition-delay. */
  delay?: number;
  as?: ElementType;
  className?: string;
  id?: string;
};

/**
 * Fades and lifts its children into view once. Styling lives in globals.css
 * under `[data-reveal]`; this only flips the attribute so reduced-motion users
 * get the plain-fade variant for free.
 */
function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  id,
}: RevealProps) {
  const Element = Tag as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      node.dataset.reveal = "in";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.dataset.reveal = "in";
            observer.disconnect();
          }
        }
      },
      /* threshold stays 0: a fraction would mean an element taller than the
         viewport can never satisfy it, so it would sit at opacity 0 forever.
         The negative bottom rootMargin already holds the reveal back until
         the element's top has crossed 88% of the viewport, which is what the
         fraction was there for. */
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <Element
      ref={ref}
      id={id}
      className={className}
      data-reveal=""
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
          : undefined
      }
    >
      {children}
    </Element>
  );
}

export default Reveal;

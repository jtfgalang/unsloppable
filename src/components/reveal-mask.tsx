"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export type RevealMaskDirection = "up" | "down" | "left" | "right";

const HIDDEN: Record<RevealMaskDirection, string> = {
  up: "translate3d(0, 100%, 0)",
  down: "translate3d(0, -100%, 0)",
  left: "translate3d(100%, 0, 0)",
  right: "translate3d(-100%, 0, 0)",
};

export interface RevealMaskProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Edge the content travels in from. */
  direction?: RevealMaskDirection;
  /** Reveal duration in seconds. */
  duration?: number;
  /** Delay before the reveal begins, in seconds. */
  delay?: number;
  /** Fraction of the surface that must be visible before revealing. */
  threshold?: number;
}

/**
 * Content slides out from behind a clipped edge.
 *
 * The frame clips with `overflow: hidden` and only the inner layer moves, so the
 * reveal runs entirely on `transform`. An earlier version animated `clip-path`,
 * which the compositor cannot handle — every frame went through layout on the
 * main thread and stuttered under any other work.
 */
export const RevealMask = React.forwardRef<HTMLDivElement, RevealMaskProps>(
  ({ className, children, direction = "up", duration = 0.86, delay = 0, threshold = 0.25, style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();
    const [revealed, setRevealed] = React.useState(false);

    React.useEffect(() => {
      const element = localRef.current;
      if (!element) return;
      if (reduced || typeof IntersectionObserver === "undefined") { setRevealed(true); return; }
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) { setRevealed(true); observer.unobserve(entry.target); }
      }, { threshold });
      observer.observe(element);
      return () => observer.disconnect();
    }, [reduced, threshold]);

    const shown = revealed || reduced;

    return <div
      ref={localRef}
      data-open-ui="reveal-mask"
      data-revealed={revealed || undefined}
      className={cn("oui-reveal-mask", className)}
      style={style}
      {...props}
    >
      <div
        className="oui-reveal-mask__inner"
        style={{
          transform: shown ? "translate3d(0, 0, 0)" : HIDDEN[direction],
          transitionDuration: reduced ? "0s" : `${duration}s`,
          transitionDelay: reduced ? "0s" : `${delay}s`,
        }}
      >{children}</div>
    </div>;
  },
);
RevealMask.displayName = "RevealMask";

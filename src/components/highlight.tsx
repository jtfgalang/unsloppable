"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface HighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /** Ink at full strength. Layer alphas are derived from it. */
  color?: string;
  /** Sweep duration in seconds. */
  duration?: number;
  /** Delay before the sweep begins once in view, in seconds. */
  delay?: number;
  /** Fraction of the line box the stroke covers, 0-1. */
  thickness?: number;
  /** Replay each time the phrase re-enters the viewport. */
  repeat?: boolean;
  /** `ink` soaks into a light ground; `light` lifts off a dark one. */
  tone?: "ink" | "light";
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * One pass of a chisel-tip marker across a phrase.
 *
 * WHY THERE IS NO `<span>` BEHIND THE TEXT ANY MORE. The obvious build (an
 * absolutely-positioned bar inside the phrase, grown with `transform: scaleX`)
 * is compositor-cheap and silently wrong. An abspos child of an inline element
 * takes the *union* of that element's line fragments as its containing block,
 * so the moment the phrase wraps, the "highlight" becomes one rectangle drawn
 * across two lines and the gap between them. That is the failure every naive
 * highlighter ships with, and it only shows up at the widths nobody tested.
 *
 * The ink is now the inline element's own background, with
 * `box-decoration-break: clone`, so the browser paints a complete stroke on
 * every line fragment for free and wrapping is correct by construction. The
 * cost of that correctness is honest: `background-size` is a paint property,
 * not a composited one. It is a sub-second animation on one short inline box
 * that runs once when the phrase scrolls into view, which is a trade worth
 * naming rather than hiding.
 *
 * WHY THE STROKE IS NOT A ROUNDED RECTANGLE. A chisel tip lays ink unevenly:
 * the band swells and thins along its length, the two overlapping passes leave
 * a darker core, and the ends do not match: the entry is a short bite, the
 * lift-off drags. That is drawn with three stacked gradients and a blend mode,
 * so the ink reads as absorbed into the surface rather than painted on top of
 * it. See `--oui-highlight-*` in the stylesheet.
 *
 * RESTING STATE. The finished stroke is the *declared* state; the sweep is an
 * animation away from it. The previous version rested at `scaleX(0)` and only
 * drew on a class the client sets, so a reader with no JavaScript got no
 * highlight at all while the comment above it claimed otherwise. Now the mark
 * is only hidden once an effect has proven the observer is actually running.
 */
export const Highlight = React.forwardRef<HTMLSpanElement, HighlightProps>(
  ({ className, children, color = "color-mix(in srgb, var(--style-accent, #6d4aff) 66%, transparent)", duration = 0.62, delay = 0, thickness = 0.62, repeat = false, tone = "ink", style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLSpanElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLSpanElement);
    const reduced = useHydratedReducedMotion();
    const [armed, setArmed] = React.useState(false);
    const [drawn, setDrawn] = React.useState(false);

    React.useEffect(() => {
      const node = localRef.current;
      if (!node) return;
      // No observer, or a reader who asked for less motion: leave the stroke in
      // its declared, finished state and never arm the hide.
      if (reduced || typeof IntersectionObserver === "undefined") { setArmed(false); setDrawn(false); return; }
      setArmed(true);
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setDrawn(true); if (!repeat) observer.unobserve(entry.target); }
          else if (repeat) setDrawn(false);
        }
      }, { threshold: 0.6 });
      observer.observe(node);
      return () => observer.disconnect();
    }, [reduced, repeat]);

    return (
      <span
        ref={localRef}
        data-open-ui="highlight"
        data-tone={tone}
        data-armed={armed || undefined}
        data-drawn={drawn || undefined}
        className={cn("oui-highlight", className)}
        style={{
          "--oui-highlight-ink": color,
          "--oui-highlight-duration": `${duration}s`,
          "--oui-highlight-delay": `${delay}s`,
          "--oui-highlight-thickness": `${clamp01(thickness) * 100}%`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </span>
    );
  },
);
Highlight.displayName = "Highlight";

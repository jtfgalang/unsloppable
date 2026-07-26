"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ScrollVelocitySkewProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Degrees of skew at full speed. */
  max?: number;
}

/**
 * Content that leans slightly with the speed of the scroll.
 *
 * Velocity is sampled per frame and decays back toward zero, so the lean settles
 * the moment scrolling stops instead of sticking at an angle. The skew is
 * clamped, because unbounded velocity mapping is what turns this effect from a
 * flourish into an unreadable smear on a fast flick.
 */
export const ScrollVelocitySkew = React.forwardRef<HTMLDivElement, ScrollVelocitySkewProps>(
  ({ className, children, max = 4, style, ...props }, ref) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      const node = hostRef.current;
      if (!node) return;
      let last = window.scrollY;
      let velocity = 0;
      let frame = requestAnimationFrame(function tick() {
        const now = window.scrollY;
        velocity = velocity * 0.86 + (now - last) * 0.14;
        last = now;
        const skew = Math.max(-max, Math.min(max, velocity));
        node.style.setProperty("--oui-skew", `${skew.toFixed(2)}deg`);
        frame = requestAnimationFrame(tick);
      });
      return () => cancelAnimationFrame(frame);
    }, [max]);

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-open-ui="scroll-velocity-skew"
        className={cn("oui-skew", className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ScrollVelocitySkew.displayName = "ScrollVelocitySkew";

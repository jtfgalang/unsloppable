"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface LightSweepProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Sheen color. */
  color?: string;
  /** Sweep duration in seconds. */
  duration?: number;
  /** Delay before the sweep begins, in seconds. */
  delay?: number;
  /** Sweep angle in degrees. */
  angle?: number;
  /** Replay the sweep every time the surface re-enters the viewport. */
  repeat?: boolean;
}

export const LightSweep = React.forwardRef<HTMLDivElement, LightSweepProps>(
  ({ className, children, color = "rgba(255,255,255,.42)", duration = 1.1, delay = 0.15, angle = 118, repeat = false, style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();
    const [swept, setSwept] = React.useState(false);

    React.useEffect(() => {
      const element = localRef.current;
      if (!element || reduced || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSwept(true);
            if (!repeat) observer.unobserve(entry.target);
          } else if (repeat) setSwept(false);
        }
      }, { threshold: 0.35 });
      observer.observe(element);
      return () => observer.disconnect();
    }, [reduced, repeat]);

    return <div
      ref={localRef}
      data-open-ui="light-sweep"
      data-swept={swept || undefined}
      className={cn("oui-light-sweep relative overflow-hidden", className)}
      style={{
        "--oui-sweep-color": color,
        "--oui-sweep-duration": `${duration}s`,
        "--oui-sweep-delay": `${delay}s`,
        "--oui-sweep-angle": `${angle}deg`,
        ...style,
      } as React.CSSProperties}
      {...props}
    >
      {children}
      {!reduced && <i aria-hidden className="oui-light-sweep__sheen" />}
    </div>;
  },
);
LightSweep.displayName = "LightSweep";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface ProgressRingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Verified current value. */
  value: number;
  /** Value representing a complete ring. */
  max?: number;
  /** Outer diameter in pixels. */
  size?: number;
  /** Stroke width in pixels. */
  thickness?: number;
  /** Arc color. */
  color?: string;
  /** Remaining-track color. */
  trackColor?: string;
  /** Fill duration in seconds. */
  duration?: number;
  /** Content rendered inside the ring. Defaults to the rounded value. */
  children?: React.ReactNode;
  /** Accessible name for the measurement. */
  label?: string;
}

export const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ className, value, max = 100, size = 132, thickness = 8, color = "currentColor", trackColor = "color-mix(in srgb, currentColor 14%, transparent)", duration = 1.1, children, label = "Progress", style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();
    const [filled, setFilled] = React.useState(false);

    const safeMax = max > 0 ? max : 100;
    const clamped = Math.min(Math.max(value, 0), safeMax);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = clamped / safeMax;

    React.useEffect(() => {
      const element = localRef.current;
      if (!element) return;
      if (reduced || typeof IntersectionObserver === "undefined") { setFilled(true); return; }
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) { setFilled(true); observer.unobserve(entry.target); }
      }, { threshold: 0.4 });
      observer.observe(element);
      return () => observer.disconnect();
    }, [reduced]);

    return <div
      ref={localRef}
      data-open-ui="progress-ring"
      role="img"
      aria-label={`${label}: ${clamped} of ${safeMax}`}
      className={cn("oui-progress-ring relative inline-grid place-items-center", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (filled ? progress : 0))}
          style={{ transition: reduced ? "none" : `stroke-dashoffset ${duration}s cubic-bezier(.16,1,.3,1)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children ?? <strong className="text-2xl tracking-[-.04em] tabular-nums">{Math.round(clamped)}</strong>}</div>
    </div>;
  },
);
ProgressRing.displayName = "ProgressRing";

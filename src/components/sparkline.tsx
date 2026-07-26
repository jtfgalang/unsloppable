"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface SparklineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Ordered, real measurements. At least two points are required to draw. */
  data: number[];
  /** Accessible summary of what the trend represents. */
  label: string;
  /** Drawn width in pixels. */
  width?: number;
  /** Drawn height in pixels. */
  height?: number;
  /** Line color. */
  color?: string;
  /** Whether the area beneath the line is filled. */
  area?: boolean;
  /** Draw duration in seconds. */
  duration?: number;
  /** Whether the final point is marked. */
  marker?: boolean;
}

export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  ({ className, data, label, width = 168, height = 46, color = "currentColor", area = true, duration = 1.05, marker = true, style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();
    const [drawn, setDrawn] = React.useState(false);

    const points = React.useMemo(() => {
      const finite = data.filter((value) => Number.isFinite(value));
      if (finite.length < 2) return [];
      const min = Math.min(...finite);
      const max = Math.max(...finite);
      const span = max - min || 1;
      const inset = 3;
      return finite.map((value, index) => [
        inset + (index / (finite.length - 1)) * (width - inset * 2),
        height - inset - ((value - min) / span) * (height - inset * 2),
      ] as const);
    }, [data, width, height]);

    React.useEffect(() => {
      const element = localRef.current;
      if (!element) return;
      if (reduced || typeof IntersectionObserver === "undefined") { setDrawn(true); return; }
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) { setDrawn(true); observer.unobserve(entry.target); }
      }, { threshold: 0.4 });
      observer.observe(element);
      return () => observer.disconnect();
    }, [reduced]);

    if (!points.length) return null;

    const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const last = points[points.length - 1];
    const first = data.find((value) => Number.isFinite(value)) ?? 0;
    const latest = [...data].reverse().find((value) => Number.isFinite(value)) ?? 0;
    const direction = latest > first ? "rising" : latest < first ? "falling" : "flat";

    return <div
      ref={localRef}
      data-open-ui="sparkline"
      role="img"
      aria-label={`${label}: ${direction} from ${first} to ${latest} across ${points.length} points.`}
      className={cn("oui-sparkline inline-block", className)}
      style={style}
      {...props}
    >
      <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {area && <path
          d={`${line} L${last[0].toFixed(2)} ${height} L${points[0][0].toFixed(2)} ${height} Z`}
          fill={color} opacity={drawn ? 0.1 : 0}
          style={{ transition: reduced ? "none" : `opacity ${duration}s ease ${duration * 0.4}s` }}
        />}
        <path
          d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={drawn ? 0 : 1}
          style={{ transition: reduced ? "none" : `stroke-dashoffset ${duration}s cubic-bezier(.16,1,.3,1)` }}
        />
        {marker && <circle
          cx={last[0]} cy={last[1]} r={2.6} fill={color} opacity={drawn ? 1 : 0}
          style={{ transition: reduced ? "none" : `opacity .3s ease ${duration * 0.75}s` }}
        />}
      </svg>
    </div>;
  },
);
Sparkline.displayName = "Sparkline";

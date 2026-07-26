import * as React from "react";
import { cn } from "../lib/utils";

export interface HalftoneFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dot spacing in pixels. */
  gap?: number;
  /** Dot diameter in pixels. */
  dotSize?: number;
  /** One full drift cycle in seconds. */
  duration?: number;
  /** Field opacity between 0 and 1. */
  intensity?: number;
}

/**
 * A halftone screen that drifts.
 *
 * The screen is one tiled layer and only its `transform` animates, so the
 * compositor handles the whole effect. An earlier version emitted ~600 SVG
 * circles and transformed the group, which forced the entire subtree to
 * re-rasterize every frame.
 *
 * The dot itself is drawn with a hard-stopped `radial-gradient`, the same
 * technique `DotField` already uses — a repeating shape rather than a blend.
 */
export const HalftoneField = React.forwardRef<HTMLDivElement, HalftoneFieldProps>(
  ({ className, gap = 22, dotSize = 2.4, duration = 22, intensity = 0.3, style, ...props }, ref) => <div
    ref={ref}
    aria-hidden
    data-open-ui="halftone-field"
    className={cn("oui-halftone pointer-events-none absolute inset-0 overflow-hidden", className)}
    style={{
      "--oui-halftone-gap": `${gap}px`,
      "--oui-halftone-dot": `${dotSize / 2}px`,
      "--oui-halftone-duration": `${duration}s`,
      "--oui-halftone-opacity": intensity,
      ...style,
    } as React.CSSProperties}
    {...props}
  ><i className="oui-halftone__screen" /></div>,
);
HalftoneField.displayName = "HalftoneField";

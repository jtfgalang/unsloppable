"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface GlassLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Backdrop blur in pixels. */
  blur?: number;
  /** Surface tint, 0 to 1. */
  tint?: number;
  /** Lit top edge and inner highlight. */
  lit?: boolean;
}

/**
 * A pane of frosted glass over whatever sits behind it.
 *
 * Real glass is three things, not one: a backdrop blur, a slight tint so the
 * pane has substance, and a lit top edge where light catches the bevel. Blur
 * alone reads as a smudge. Saturation is nudged up with the blur, because
 * blurring alone desaturates what shows through and makes the glass look grey.
 */
export const GlassLayer = React.forwardRef<HTMLDivElement, GlassLayerProps>(
  ({ className, children, blur = 20, tint = 0.12, lit = true, style, ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="glass-layer"
      data-lit={lit || undefined}
      className={cn("oui-glass", className)}
      style={{ "--oui-glass-blur": `${blur}px`, "--oui-glass-tint": tint, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  ),
);
GlassLayer.displayName = "GlassLayer";

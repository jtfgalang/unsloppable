"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface WeightShiftProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /** Resting weight. */
  from?: number;
  /** Weight reached on hover or focus. */
  to?: number;
  as?: React.ElementType;
}

/**
 * Text that gains weight on intent without moving.
 *
 * The trick is reserving the heavy width up front: a hidden copy of the string
 * set at the target weight fixes the box, and the visible text is absolutely
 * positioned inside it. Animating `font-variation-settings` alone would reflow
 * the line and shove everything after it sideways on every hover.
 */
export const WeightShift = React.forwardRef<HTMLSpanElement, WeightShiftProps>(
  ({ className, children, from = 400, to = 750, as: Tag = "span", style, ...props }, ref) => (
    <Tag
      ref={ref}
      data-open-ui="weight-shift"
      className={cn("oui-weight", className)}
      style={{ "--oui-weight-from": from, "--oui-weight-to": to, ...style } as React.CSSProperties}
      tabIndex={0}
      {...props}
    >
      <span className="oui-weight__ghost" aria-hidden="true">{children}</span>
      <span className="oui-weight__ink">{children}</span>
    </Tag>
  ),
);
WeightShift.displayName = "WeightShift";

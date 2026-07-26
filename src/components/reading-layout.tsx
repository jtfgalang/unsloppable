"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ReadingLayoutProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Measure of the text column in characters. */
  measure?: number;
  as?: React.ElementType;
}

/**
 * A long-form reading column with the typographic details set once.
 *
 * The measure is capped in `ch`, so the line length holds a comfortable 60-ish
 * characters regardless of viewport, which is the single biggest lever on
 * legibility and the one most layouts skip. Wide children, figures and code and
 * tables, are allowed to break the measure and run full width via a `bleed`
 * class, so evidence is not crushed into the text column.
 */
export const ReadingLayout = React.forwardRef<HTMLElement, ReadingLayoutProps>(
  ({ className, children, measure = 66, as: Tag = "article", style, ...props }, ref) => (
    <Tag
      ref={ref}
      data-open-ui="reading-layout"
      className={cn("oui-reading", className)}
      style={{ "--oui-reading-measure": `${measure}ch`, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </Tag>
  ),
);
ReadingLayout.displayName = "ReadingLayout";

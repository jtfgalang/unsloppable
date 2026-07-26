"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type DividerShape = "line" | "label" | "wave" | "notch";

export interface SectionDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: DividerShape;
  /** Centre label for the label shape. */
  label?: string;
}

/**
 * A divider between two sections, beyond a bare horizontal rule.
 *
 * The shaped variants are drawn with SVG, not a background image, so they stay
 * crisp at any width and take the theme colour. When it carries a label it is a
 * real separator with an accessible name; the purely decorative shapes are
 * hidden from assistive technology, since a wave tells a screen reader nothing.
 */
export const SectionDivider = React.forwardRef<HTMLDivElement, SectionDividerProps>(
  ({ className, shape = "line", label, ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="section-divider"
      data-shape={shape}
      className={cn("oui-divider", className)}
      role={label ? "separator" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {shape === "label" && label ? (
        <><span className="oui-divider__rule" /><span className="oui-divider__label">{label}</span><span className="oui-divider__rule" /></>
      ) : shape === "wave" ? (
        <svg className="oui-divider__art" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 20 Q 150 0 300 20 T 600 20 T 900 20 T 1200 20" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      ) : shape === "notch" ? (
        <svg className="oui-divider__art" viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0 20 H540 l30 -14 l30 14 H1200" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      ) : (
        <span className="oui-divider__rule" />
      )}
    </div>
  ),
);
SectionDivider.displayName = "SectionDivider";

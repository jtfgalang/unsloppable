"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ChromaticEdgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
  /** Separation in pixels at rest. */
  offset?: number;
  /** Split only on hover and focus. */
  onIntent?: boolean;
  as?: React.ElementType;
}

/**
 * Chromatic aberration on a short string, as two offset colour ghosts.
 *
 * Both ghosts are `aria-hidden` copies behind the real text, so the phrase is
 * announced once rather than three times. The real text stays fully opaque on
 * top, which means the effect never costs legibility even at full separation.
 */
export const ChromaticEdge = React.forwardRef<HTMLSpanElement, ChromaticEdgeProps>(
  ({ className, children, offset = 2, onIntent = false, as: Tag = "span", style, ...props }, ref) => (
    <Tag
      ref={ref}
      data-open-ui="chromatic-edge"
      data-intent={onIntent || undefined}
      className={cn("oui-chroma", className)}
      style={{ "--oui-chroma-offset": `${offset}px`, ...style } as React.CSSProperties}
      {...props}
    >
      <span className="oui-chroma__ghost" data-channel="r" aria-hidden="true">{children}</span>
      <span className="oui-chroma__ghost" data-channel="b" aria-hidden="true">{children}</span>
      <span className="oui-chroma__ink">{children}</span>
    </Tag>
  ),
);
ChromaticEdge.displayName = "ChromaticEdge";

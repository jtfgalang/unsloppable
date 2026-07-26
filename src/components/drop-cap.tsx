"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface DropCapProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: string;
  /** Lines the cap should span. */
  lines?: 2 | 3 | 4;
}

/**
 * An editorial drop cap that sits on the correct baseline.
 *
 * The cap is set with `initial-letter` where supported, which is the only way to
 * get true optical baseline alignment; browsers without it fall back to a
 * floated cap sized from the line height, which lands close enough that the
 * paragraph never looks broken.
 *
 * The letter stays part of the sentence rather than being split into its own
 * element, so the text is still selectable and readable as one string.
 */
export const DropCap = React.forwardRef<HTMLParagraphElement, DropCapProps>(
  ({ className, children, lines = 3, style, ...props }, ref) => (
    <p
      ref={ref}
      data-open-ui="drop-cap"
      className={cn("oui-dropcap", className)}
      style={{ "--oui-dropcap-lines": lines, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </p>
  ),
);
DropCap.displayName = "DropCap";

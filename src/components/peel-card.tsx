"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface PeelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Revealed as the corner lifts. */
  under: React.ReactNode;
  /** Corner size in pixels. */
  size?: number;
  label?: string;
}

/**
 * A card whose corner peels back to show what is underneath.
 *
 * The peel is a clipped triangle plus a shadow along the fold, so it reads as
 * paper lifting rather than a square sliding away. It is driven by hover and
 * focus on a real button, so keyboard users can peel it too.
 */
export const PeelCard = React.forwardRef<HTMLDivElement, PeelCardProps>(
  ({ className, children, under, size = 96, label = "Peel the corner", style, ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="peel-card"
      className={cn("oui-peel", className)}
      style={{ "--oui-peel-size": `${size}px`, ...style } as React.CSSProperties}
      {...props}
    >
      <div className="oui-peel__under" aria-hidden="true">{under}</div>
      <div className="oui-peel__face">{children}</div>
      <button type="button" className="oui-peel__corner" aria-label={label}>
        <span className="oui-peel__fold" aria-hidden="true" />
      </button>
    </div>
  ),
);
PeelCard.displayName = "PeelCard";

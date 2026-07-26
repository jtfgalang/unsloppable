"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type SkeletonShape = "avatar" | "title" | "line" | "block" | "chip";

export interface SkeletonBloomProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The placeholder layout, top to bottom. */
  shapes?: readonly SkeletonShape[];
  /** Swap the placeholders for real content. */
  loading?: boolean;
  /** Seconds between each row resolving. */
  stagger?: number;
  children?: React.ReactNode;
  /** Announced while the placeholders are showing. */
  label?: string;
}

const DEFAULT_SHAPES: readonly SkeletonShape[] = ["avatar", "title", "line", "line", "chip"];

/**
 * Placeholders that resolve in sequence rather than all at once.
 *
 * The sweep is a masked highlight travelling across each row on its own delay,
 * so the block reads as filling in from the top instead of pulsing as one slab.
 * When `loading` flips, the real content crossfades in on the same stagger, so
 * the arrival has the same rhythm as the wait.
 *
 * The placeholder region is `aria-busy` and hidden from the accessibility tree,
 * so a screen reader is told the content is loading rather than being read a
 * list of meaningless boxes.
 */
export const SkeletonBloom = React.forwardRef<HTMLDivElement, SkeletonBloomProps>(
  ({ className, shapes = DEFAULT_SHAPES, loading = true, stagger = 0.12, children, label = "Loading content", ...props }, forwardedRef) => {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="skeleton-bloom"
        data-loading={loading || undefined}
        className={cn("oui-bloom", className)}
        aria-busy={loading || undefined}
      >
        {loading ? (
          <div className="oui-bloom__set" aria-hidden="true">
            <span className="oui-bloom__sr">{label}</span>
            {shapes.map((shape, index) => (
              <span
                key={index}
                className="oui-bloom__shape"
                data-shape={shape}
                style={{ "--oui-bloom-delay": `${index * stagger}s` } as React.CSSProperties}
              />
            ))}
          </div>
        ) : (
          <div className="oui-bloom__content" style={{ "--oui-bloom-stagger": `${stagger}s` } as React.CSSProperties}>
            {children}
          </div>
        )}
      </div>
    );
  },
);
SkeletonBloom.displayName = "SkeletonBloom";

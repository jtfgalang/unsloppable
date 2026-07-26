"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface PixelDissolveProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Grid resolution. Higher is finer and costs more cells. */
  columns?: number;
  rows?: number;
  /** Dissolve away instead of in. */
  out?: boolean;
  /** Seconds the whole dissolve takes. */
  duration?: number;
}

/**
 * Content that resolves through a grid of dissolving cells.
 *
 * Cell delays come from a deterministic hash of the cell index rather than
 * `Math.random`, so the pattern looks scattered but is identical on server and
 * client. Random delays would produce a hydration mismatch on every load.
 *
 * The overlay is decorative and vanishes when the dissolve ends, so it never
 * intercepts a click meant for the content underneath.
 */
export const PixelDissolve = React.forwardRef<HTMLDivElement, PixelDissolveProps>(
  ({ className, children, columns = 14, rows = 8, out = false, duration = 1.1, style, ...props }, ref) => {
    const cells = React.useMemo(() => {
      const total = columns * rows;
      return Array.from({ length: total }, (_, index) => {
        // Deterministic scatter: a cheap integer hash, not Math.random.
        const hash = ((index * 2654435761) % 1000) / 1000;
        return { index, delay: hash * duration * 0.7 };
      });
    }, [columns, rows, duration]);

    return (
      <div
        ref={ref}
        data-open-ui="pixel-dissolve"
        data-out={out || undefined}
        className={cn("oui-dissolve", className)}
        style={{ "--oui-dissolve-cols": columns, "--oui-dissolve-rows": rows, "--oui-dissolve-duration": `${duration}s`, ...style } as React.CSSProperties}
        {...props}
      >
        <div className="oui-dissolve__content">{children}</div>
        <span className="oui-dissolve__grid" aria-hidden="true">
          {cells.map((cell) => (
            <i key={cell.index} style={{ "--oui-dissolve-delay": `${cell.delay}s` } as React.CSSProperties} />
          ))}
        </span>
      </div>
    );
  },
);
PixelDissolve.displayName = "PixelDissolve";

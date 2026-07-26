"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export type CascadeCol = { id: string; content: React.ReactNode };

export interface ColumnCascadeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  columns: readonly CascadeCol[];
  /** Seconds between each column arriving. */
  stagger?: number;
  label?: string;
}

/**
 * Columns that rise into place in sequence when the row scrolls in.
 *
 * The entrance is gated on an IntersectionObserver so it plays when seen rather
 * than on mount, and each column's resting state is its final position: if the
 * observer never fires the row is simply already there. The stagger is a CSS
 * delay, so no per-column timer runs.
 */
export const ColumnCascade = React.forwardRef<HTMLDivElement, ColumnCascadeProps>(
  ({ className, columns, stagger = 0.09, label = "Columns", ...props }, ref) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);
    const reduced = useHydratedReducedMotion();
    const [shown, setShown] = React.useState(false);

    React.useEffect(() => {
      const node = hostRef.current;
      if (!node || reduced || typeof IntersectionObserver === "undefined") { setShown(true); return; }
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setShown(true); observer.unobserve(entry.target); } },
        { threshold: 0.3 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, [reduced]);

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-open-ui="column-cascade"
        data-shown={shown || undefined}
        className={cn("oui-cascadecol", className)}
        style={{ "--oui-cascadecol-cols": columns.length } as React.CSSProperties}
        role="group"
        aria-label={label}
        {...props}
      >
        {columns.map((column, index) => (
          <div className="oui-cascadecol__col" key={column.id} style={{ "--oui-cascadecol-delay": `${index * stagger}s` } as React.CSSProperties}>
            {column.content}
          </div>
        ))}
      </div>
    );
  },
);
ColumnCascade.displayName = "ColumnCascade";

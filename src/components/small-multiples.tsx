"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type MultipleSeries = { id: string; label: string; values: readonly number[]; caption?: string };

export interface SmallMultiplesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  series: readonly MultipleSeries[];
  /** Share one y-scale across every panel so the set is comparable. */
  sharedScale?: boolean;
  /** Columns at the widest breakpoint. */
  columns?: 2 | 3 | 4;
  label?: string;
}

function path(values: readonly number[], min: number, max: number) {
  if (values.length < 2) return "";
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

/**
 * A grid of small charts read as one figure.
 *
 * The point of small multiples is comparison, so by default every panel shares a
 * single y-scale computed across the whole set. Scaling each panel to its own
 * range makes them look alike no matter how different they are, which is the
 * exact lie this layout exists to avoid; `sharedScale={false}` is available but
 * is the wrong default.
 *
 * Each panel exposes its own label and range as text, so the shape is a summary
 * rather than the only way to read the data.
 */
export const SmallMultiples = React.forwardRef<HTMLDivElement, SmallMultiplesProps>(
  ({ className, series, sharedScale = true, columns = 3, label = "Trends", ...props }, forwardedRef) => {
    const bounds = React.useMemo(() => {
      const all = series.flatMap((entry) => [...entry.values]);
      return { min: Math.min(...all), max: Math.max(...all) };
    }, [series]);

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="small-multiples"
        className={cn("oui-lattice", className)}
        style={{ "--oui-lattice-cols": columns } as React.CSSProperties}
        role="group"
        aria-label={label}
      >
        {series.map((entry, index) => {
          const min = sharedScale ? bounds.min : Math.min(...entry.values);
          const max = sharedScale ? bounds.max : Math.max(...entry.values);
          const last = entry.values[entry.values.length - 1];
          const first = entry.values[0];
          const up = last >= first;
          return (
            <figure
              className="oui-lattice__panel"
              key={entry.id}
              data-up={up || undefined}
              style={{ "--oui-lattice-i": index } as React.CSSProperties}
            >
              <figcaption className="oui-lattice__head">
                <span className="oui-lattice__label">{entry.label}</span>
                <span className="oui-lattice__value">{last}</span>
              </figcaption>
              <svg className="oui-lattice__chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className="oui-lattice__area" d={`${path(entry.values, min, max)} L 100 100 L 0 100 Z`} />
                <path className="oui-lattice__line" d={path(entry.values, min, max)} pathLength={1} />
              </svg>
              <span className="oui-lattice__caption">
                {entry.caption ?? `${min} to ${max}`}
              </span>
            </figure>
          );
        })}
      </div>
    );
  },
);
SmallMultiples.displayName = "SmallMultiples";

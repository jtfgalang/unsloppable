"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface MetricDeltaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  value: string;
  /** Percentage change. Sign carries the direction. */
  delta?: number;
  /** Set when a fall is the good outcome, for example bounce rate. */
  lowerIsBetter?: boolean;
  /** Sparkline behind the figure. */
  series?: readonly number[];
  caption?: string;
}

function sparkPath(values: readonly number[]) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
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
 * A single metric with its change and the shape behind it.
 *
 * Direction and sentiment are separated on purpose: an arrow shows which way the
 * number moved, while the colour comes from `lowerIsBetter`, so a fall in bounce
 * rate reads as good rather than as a loss. Colour is never the only signal, as
 * the sign and the arrow both carry it.
 *
 * The sparkline is decorative and hidden from assistive technology; the figure,
 * the change, and the caption are all real text.
 */
export const MetricDelta = React.forwardRef<HTMLDivElement, MetricDeltaProps>(
  ({ className, label, value, delta, lowerIsBetter = false, series, caption, ...props }, forwardedRef) => {
    const rose = (delta ?? 0) > 0;
    const flat = (delta ?? 0) === 0;
    const good = flat ? undefined : lowerIsBetter ? !rose : rose;

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="metric-delta"
        data-good={good === undefined ? undefined : good}
        className={cn("oui-delta", className)}
      >
        {series?.length ? (
          <svg className="oui-delta__spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="oui-delta__area" d={`${sparkPath(series)} L 100 100 L 0 100 Z`} />
            <path className="oui-delta__line" d={sparkPath(series)} />
          </svg>
        ) : null}

        <span className="oui-delta__label">{label}</span>
        <strong className="oui-delta__value">{value}</strong>

        {delta !== undefined ? (
          <span className="oui-delta__change">
            <i aria-hidden="true">{flat ? "→" : rose ? "↑" : "↓"}</i>
            {`${rose ? "+" : ""}${delta}%`}
          </span>
        ) : null}

        {caption ? <span className="oui-delta__caption">{caption}</span> : null}
      </div>
    );
  },
);
MetricDelta.displayName = "MetricDelta";

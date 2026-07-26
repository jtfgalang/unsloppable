"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ComparePair = {
  id: string;
  label: string;
  before: number;
  after: number;
  /** Set when a lower number is the better outcome, for example load time. */
  lowerIsBetter?: boolean;
};

export interface CompareBarsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  pairs: readonly ComparePair[];
  beforeLabel?: string;
  afterLabel?: string;
  unit?: string;
  label?: string;
}

/**
 * Paired before and after bars on one shared scale.
 *
 * Both bars in a row are measured against the largest value across the whole
 * set, so a row cannot flatter itself by being scaled to its own maximum. The
 * verdict per row is computed from `lowerIsBetter`, which means a drop in load
 * time reads as a win rather than a loss.
 *
 * Every row states its own numbers and its own direction in text, so the bars
 * are a summary of the comparison, never the comparison itself.
 */
export const CompareBars = React.forwardRef<HTMLDivElement, CompareBarsProps>(
  ({ className, pairs, beforeLabel = "Before", afterLabel = "After", unit = "", label = "Before and after", ...props }, forwardedRef) => {
    const max = React.useMemo(
      () => Math.max(...pairs.flatMap((pair) => [pair.before, pair.after]), 1),
      [pairs],
    );

    return (
      <div {...props} ref={forwardedRef} data-open-ui="compare-bars" className={cn("oui-verdict", className)} role="group" aria-label={label}>
        <div className="oui-verdict__key" aria-hidden="true">
          <span data-key="before">{beforeLabel}</span>
          <span data-key="after">{afterLabel}</span>
        </div>

        <ul className="oui-verdict__rows">
          {pairs.map((pair, index) => {
            const improved = pair.lowerIsBetter ? pair.after < pair.before : pair.after > pair.before;
            const delta = pair.after - pair.before;
            const percent = pair.before === 0 ? 0 : Math.round((delta / pair.before) * 100);
            return (
              <li key={pair.id} data-improved={improved || undefined} style={{ "--oui-verdict-i": index } as React.CSSProperties}>
                <span className="oui-verdict__label">{pair.label}</span>
                <span className="oui-verdict__track">
                  <i data-bar="before" style={{ "--oui-verdict-w": `${(pair.before / max) * 100}%` } as React.CSSProperties} />
                  <i data-bar="after" style={{ "--oui-verdict-w": `${(pair.after / max) * 100}%` } as React.CSSProperties} />
                </span>
                <span className="oui-verdict__numbers">
                  <b>{pair.before}{unit}</b>
                  <em aria-hidden="true">→</em>
                  <b>{pair.after}{unit}</b>
                  <span className="oui-verdict__delta">
                    {percent > 0 ? "+" : ""}{percent}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
CompareBars.displayName = "CompareBars";

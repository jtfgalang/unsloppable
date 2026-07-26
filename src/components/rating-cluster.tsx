"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface RatingClusterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Out of `outOf`. Fractional values render a partial star. */
  value: number;
  outOf?: number;
  /** Number of ratings behind the score. */
  count?: number;
  /** Small source wordmarks, for example review sites. */
  sources?: readonly string[];
  label?: string;
}

/**
 * A star score with the sample size beside it.
 *
 * The count is not optional decoration: a 5.0 from three people and a 4.6 from
 * eleven thousand are different claims, and showing the score alone quietly
 * hides which one you have. Partial stars are clipped by width rather than
 * rounded, so 4.6 does not silently become 5.
 */
export const RatingCluster = React.forwardRef<HTMLDivElement, RatingClusterProps>(
  ({ className, value, outOf = 5, count, sources, label = "Average rating", ...props }, ref) => {
    const clamped = Math.max(0, Math.min(outOf, value));
    return (
      <div
        ref={ref}
        data-open-ui="rating-cluster"
        className={cn("oui-rating", className)}
        role="img"
        aria-label={`${label}: ${clamped} out of ${outOf}${count ? `, from ${count} ratings` : ""}`}
        {...props}
      >
        <span className="oui-rating__stars" aria-hidden="true">
          <span className="oui-rating__fill" style={{ width: `${(clamped / outOf) * 100}%` }}>
            {Array.from({ length: outOf }, (_, i) => <i key={i} />)}
          </span>
          {Array.from({ length: outOf }, (_, i) => <i key={i} />)}
        </span>
        <strong className="oui-rating__score">{clamped.toFixed(1)}</strong>
        {count ? <span className="oui-rating__count">{count.toLocaleString("en-US")} ratings</span> : null}
        {sources?.length ? (
          <span className="oui-rating__sources">{sources.map((source) => <em key={source}>{source}</em>)}</span>
        ) : null}
      </div>
    );
  },
);
RatingCluster.displayName = "RatingCluster";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ActivityCell = { id: string; level: 0 | 1 | 2 | 3 | 4; label?: string };

export interface ActivityGridProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Oldest first. Laid out in columns of `rows`, so it reads left to right. */
  cells: readonly ActivityCell[];
  rows?: number;
  label?: string;
  /** Legend captions for the least and most active ends. */
  legend?: [string, string];
  /** Summary line above the grid. */
  summary?: string;
}

/**
 * An activity grid, the contribution-graph pattern.
 *
 * Level is an explicit 0 to 4 rather than a raw count, because the mapping from
 * value to shade is a judgement the caller owns: bucketing it here would quietly
 * flatten or exaggerate whatever data arrived.
 *
 * Every cell exposes a title, and the grid keeps a text summary, so the pattern
 * is never the only way to read it. Cells fade in on a diagonal so the grid
 * assembles rather than blinking into place.
 */
export const ActivityGrid = React.forwardRef<HTMLDivElement, ActivityGridProps>(
  ({ className, cells, rows = 7, label = "Activity", legend = ["Less", "More"], summary, ...props }, forwardedRef) => {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="activity-grid"
        className={cn("oui-tempo", className)}
        role="img"
        aria-label={summary ? `${label}. ${summary}` : label}
      >
        {summary ? <p className="oui-tempo__summary">{summary}</p> : null}

        <div className="oui-tempo__grid" style={{ "--oui-tempo-rows": rows } as React.CSSProperties}>
          {cells.map((cell, index) => (
            <span
              key={cell.id}
              className="oui-tempo__cell"
              data-level={cell.level}
              title={cell.label}
              style={{ "--oui-tempo-i": Math.floor(index / rows) + (index % rows) } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="oui-tempo__legend" aria-hidden="true">
          <span>{legend[0]}</span>
          {[0, 1, 2, 3, 4].map((level) => <i key={level} data-level={level} />)}
          <span>{legend[1]}</span>
        </div>
      </div>
    );
  },
);
ActivityGrid.displayName = "ActivityGrid";

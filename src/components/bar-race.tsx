"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type RaceEntry = { id: string; label: string; value: number };

export interface BarRaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Ordered frames. Each is a full standings snapshot. */
  frames: readonly { label: string; entries: readonly RaceEntry[] }[];
  /** Seconds each frame holds. */
  interval?: number;
  /** Advance automatically. */
  autoPlay?: boolean;
  label?: string;
}

/**
 * Ranked bars that reorder as the series advances.
 *
 * Rows are keyed by entry id and positioned by `translateY`, so a bar that
 * changes rank slides to its new row rather than the whole list re-rendering
 * underneath. That movement is the entire point of a bar race.
 *
 * Playback runs on `setInterval`, not rAF, so a hidden tab does not silently
 * freeze the sequence, and the current frame is announced politely.
 */
export const BarRace = React.forwardRef<HTMLDivElement, BarRaceProps>(
  ({ className, frames, interval = 1.6, autoPlay = true, label = "Standings over time", ...props }, ref) => {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
      if (!autoPlay || frames.length < 2) return;
      const id = window.setInterval(() => setIndex((i) => (i + 1) % frames.length), interval * 1000);
      return () => window.clearInterval(id);
    }, [autoPlay, frames.length, interval]);

    const frame = frames[Math.min(index, frames.length - 1)];
    const ranked = React.useMemo(() => [...(frame?.entries ?? [])].sort((a, b) => b.value - a.value), [frame]);
    const max = Math.max(...ranked.map((entry) => entry.value), 1);

    return (
      <div ref={ref} data-open-ui="bar-race" className={cn("oui-race", className)} aria-label={label} {...props}>
        <div className="oui-race__frame" role="status" aria-live="polite">{frame?.label}</div>
        <div className="oui-race__rows" style={{ "--oui-race-count": ranked.length } as React.CSSProperties}>
          {ranked.map((entry, rank) => (
            <div className="oui-race__row" key={entry.id} style={{ "--oui-race-rank": rank } as React.CSSProperties}>
              <span className="oui-race__label">{entry.label}</span>
              <span className="oui-race__bar" style={{ "--oui-race-w": `${(entry.value / max) * 100}%` } as React.CSSProperties} />
              <span className="oui-race__value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
BarRace.displayName = "BarRace";

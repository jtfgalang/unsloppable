"use client";

import * as React from "react";
import { cn } from "../lib/utils";

/** A band drawn on the track, so the number has context to be judged against. */
export type GaugeBand = { upTo: number; tone: "danger" | "warning" | "good" };

export interface GaugeMeterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  /** Ordered low to high. The last band should reach `max`. */
  bands?: readonly GaugeBand[];
  /** Target marker drawn on the track. */
  target?: number;
  size?: number;
}

const DEFAULT_BANDS: readonly GaugeBand[] = [
  { upTo: 50, tone: "danger" },
  { upTo: 75, tone: "warning" },
  { upTo: 100, tone: "good" },
];

/** 270 degrees of sweep, opened at the bottom. */
const SWEEP = 0.75;

export const GaugeMeter = React.forwardRef<HTMLDivElement, GaugeMeterProps>(
  ({ className, value, max = 100, label, unit, bands = DEFAULT_BANDS, target, size = 168, ...props }, forwardedRef) => {
    const safe = Math.max(0, Math.min(max, value));
    const fraction = max === 0 ? 0 : safe / max;

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="gauge-meter"
        className={cn("oui-gauge", className)}
        style={{ "--oui-gauge-size": `${size}px` } as React.CSSProperties}
        role="meter"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        aria-valuetext={`${safe}${unit ? ` ${unit}` : ""} of ${max}`}
      >
        <svg className="oui-gauge__dial" viewBox="0 0 100 100" aria-hidden="true">
          {/* Bands sit under the value arc, so the reading is judged in context. */}
          {bands.map((band, index) => {
            const from = index === 0 ? 0 : (bands[index - 1].upTo / max) * SWEEP;
            const to = (band.upTo / max) * SWEEP;
            return (
              <circle
                key={band.tone + band.upTo}
                className="oui-gauge__band"
                data-tone={band.tone}
                cx="50" cy="50" r="40"
                pathLength={1}
                strokeDasharray={`${Math.max(0, to - from)} 1`}
                strokeDashoffset={-from}
              />
            );
          })}
          <circle
            className="oui-gauge__value"
            cx="50" cy="50" r="40"
            pathLength={1}
            strokeDasharray={`${fraction * SWEEP} 1`}
            strokeDashoffset={0}
          />
          {target !== undefined ? (
            <circle
              className="oui-gauge__target"
              cx="50" cy="50" r="40"
              pathLength={1}
              strokeDasharray={`0.004 1`}
              strokeDashoffset={-((target / max) * SWEEP)}
            />
          ) : null}
        </svg>

        <div className="oui-gauge__readout">
          <strong>{safe}{unit ? <em>{unit}</em> : null}</strong>
          <span>{label}</span>
        </div>
      </div>
    );
  },
);
GaugeMeter.displayName = "GaugeMeter";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type VitalState = "operational" | "degraded" | "down" | "maintenance";

export interface StatusPulseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  status: VitalState;
  label?: string;
  /** Oldest first. Rendered as a bar per window, newest at the right. */
  history?: readonly VitalState[];
  /** Caption under the history, for example the window it covers. */
  caption?: string;
  /** Uptime figure shown beside the label. */
  uptime?: string;
}

const COPY: Record<VitalState, string> = {
  operational: "All systems operational",
  degraded: "Degraded performance",
  down: "Major outage",
  maintenance: "Under maintenance",
};

/**
 * A live status light with its own recent history.
 *
 * The pulse is a ring expanding out of the dot rather than the dot itself
 * blinking, so the indicator never disappears: at any frozen moment the state is
 * still readable. State is carried by an icon-free colour plus a real text
 * label, so it never depends on colour alone, and the history bars each expose
 * their own title for the same reason.
 */
export const StatusPulse = React.forwardRef<HTMLDivElement, StatusPulseProps>(
  ({ className, status, label, history = [], caption, uptime, ...props }, forwardedRef) => {
    const text = label ?? COPY[status];

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="status-pulse"
        data-status={status}
        className={cn("oui-vitals", className)}
      >
        <div className="oui-vitals__head">
          <span className="oui-vitals__dot" aria-hidden="true"><i /></span>
          <strong className="oui-vitals__label" role="status">{text}</strong>
          {uptime ? <span className="oui-vitals__uptime">{uptime}</span> : null}
        </div>

        {history.length ? (
          <div className="oui-vitals__history">
            {history.map((entry, index) => (
              <span
                key={index}
                className="oui-vitals__bar"
                data-status={entry}
                style={{ "--oui-vital-i": index } as React.CSSProperties}
                title={COPY[entry]}
              />
            ))}
          </div>
        ) : null}

        {caption ? <span className="oui-vitals__caption">{caption}</span> : null}
      </div>
    );
  },
);
StatusPulse.displayName = "StatusPulse";

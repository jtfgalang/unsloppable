"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface SavePulseProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  state: SaveState;
  /** Shown when idle, for example the last saved time. */
  idleLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
}

/**
 * The quiet confirmation that a change was written.
 *
 * Autosave has no button to press, so the only feedback is this: a state that
 * settles from saving to saved and then recedes to a timestamp. The saved pulse
 * fires once rather than looping, because a permanently animating indicator
 * reads as "still working" and undoes the reassurance it exists to give.
 *
 * The region is polite, so it is announced without interrupting typing.
 */
export const SavePulse = React.forwardRef<HTMLSpanElement, SavePulseProps>(
  ({ className, state, idleLabel = "All changes saved", savingLabel = "Saving", savedLabel = "Saved", errorLabel = "Could not save", ...props }, ref) => {
    const label = state === "saving" ? savingLabel : state === "saved" ? savedLabel : state === "error" ? errorLabel : idleLabel;
    return (
      <span
        ref={ref}
        data-open-ui="save-pulse"
        data-state={state}
        className={cn("oui-save", className)}
        role="status"
        aria-live="polite"
        {...props}
      >
        <span className="oui-save__mark" aria-hidden="true">
          {state === "error" ? (
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M8 4.4v4.4M8 11.1v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="m3.5 8.3 3 3 6-6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </span>
        {label}
      </span>
    );
  },
);
SavePulse.displayName = "SavePulse";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface OptimisticCheckProps extends Omit<React.HTMLAttributes<HTMLLabelElement>, "onChange"> {
  label: string;
  defaultChecked?: boolean;
  /** Resolve to commit, reject to roll the tick back. */
  onCommit?: (next: boolean) => void | Promise<unknown>;
  hint?: string;
}

/**
 * A tick that commits immediately and rolls back if the write fails.
 *
 * The optimistic part is the point: the box flips the instant it is pressed, so
 * the interface never feels like it is asking permission. If `onCommit` rejects,
 * the tick returns to where it was and an error is announced, which is the half
 * that optimistic UI usually forgets.
 *
 * It is a native checkbox, so keyboard, form participation, and semantics all
 * come for free.
 */
export const OptimisticCheck = React.forwardRef<HTMLInputElement, OptimisticCheckProps>(
  ({ className, label, defaultChecked = false, onCommit, hint, ...props }, ref) => {
    const [checked, setChecked] = React.useState(defaultChecked);
    const [state, setState] = React.useState<"idle" | "saving" | "failed">("idle");

    const toggle = async (next: boolean) => {
      const previous = checked;
      setChecked(next);
      setState("saving");
      try {
        await onCommit?.(next);
        setState("idle");
      } catch {
        setChecked(previous);
        setState("failed");
      }
    };

    return (
      <label
        data-open-ui="optimistic-check"
        data-state={state}
        className={cn("oui-optimistic", className)}
        {...props}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(event) => void toggle(event.target.checked)}
        />
        <span className="oui-optimistic__box" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="m3.5 8.3 3 3 6-6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className="oui-optimistic__copy">
          <span className="oui-optimistic__label">{label}</span>
          {state === "failed"
            ? <span className="oui-optimistic__error" role="alert">Could not save. Put back.</span>
            : hint ? <span className="oui-optimistic__hint">{hint}</span> : null}
        </span>
      </label>
    );
  },
);
OptimisticCheck.displayName = "OptimisticCheck";

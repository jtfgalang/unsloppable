"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface WaitlistRowProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  label?: string;
  placeholder?: string;
  actionLabel?: string;
  /** Resolve to show the confirmation, reject to surface an error. */
  onJoin?: (email: string) => void | Promise<unknown>;
  /** Shown under the row once accepted. */
  successLabel?: string;
  hint?: string;
}

/**
 * A single-field capture row that reports what happened.
 *
 * The three states that actually matter are all here: pending while the request
 * is in flight, accepted, and failed. Most capture rows ship only the first,
 * which leaves a reader unsure whether pressing again would sign them up twice.
 *
 * Validation is left to the native email input, and the result is announced
 * politely rather than replacing the form outright.
 */
export const WaitlistRow = React.forwardRef<HTMLFormElement, WaitlistRowProps>(
  ({ className, label = "Email address", placeholder = "you@company.com", actionLabel = "Join the waitlist", onJoin, successLabel = "You are on the list.", hint, ...props }, ref) => {
    const [state, setState] = React.useState<"idle" | "pending" | "done" | "error">("idle");
    const id = React.useId().replace(/:/g, "");

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (state === "pending") return;
      const email = new FormData(event.currentTarget).get("email");
      setState("pending");
      try {
        await onJoin?.(String(email ?? ""));
        setState("done");
      } catch {
        setState("error");
      }
    };

    return (
      <form
        ref={ref}
        data-open-ui="waitlist-row"
        data-state={state}
        className={cn("oui-waitlist", className)}
        onSubmit={submit}
        {...props}
      >
        <div className="oui-waitlist__row">
          <label className="oui-waitlist__sr" htmlFor={`${id}-email`}>{label}</label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            placeholder={placeholder}
            disabled={state === "done"}
          />
          <button type="submit" disabled={state === "pending" || state === "done"}>
            {state === "pending" ? "Joining" : state === "done" ? "Joined" : actionLabel}
          </button>
        </div>
        <p className="oui-waitlist__note" role="status" aria-live="polite">
          {state === "done" ? successLabel : state === "error" ? "That did not go through. Try again." : hint}
        </p>
      </form>
    );
  },
);
WaitlistRow.displayName = "WaitlistRow";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface UndoBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What just happened, phrased in the past tense. */
  message: string;
  /** Seconds before the action is committed. */
  duration?: number;
  /** Show the bar. Hiding it stops and resets the countdown. */
  open?: boolean;
  onUndo?: () => void;
  /** Fires when the window closes without an undo. */
  onExpire?: () => void;
  undoLabel?: string;
}

/**
 * The grace period after a destructive action, made visible.
 *
 * The countdown is a ring that empties rather than a number ticking down, so the
 * remaining time is legible at a glance without being read. It runs on
 * `setInterval` rather than `requestAnimationFrame` on purpose: rAF is suspended
 * in a hidden tab, which would silently freeze the window and commit the action
 * late; an interval keeps real time.
 *
 * Undo is a real button and the message is announced politely, so the escape
 * hatch is reachable by keyboard and audible to a screen reader before it lapses.
 */
export const UndoBar = React.forwardRef<HTMLDivElement, UndoBarProps>(
  ({ className, message, duration = 6, open = true, onUndo, onExpire, undoLabel = "Undo", ...props }, forwardedRef) => {
    const reduced = useHydratedReducedMotion();
    const [remaining, setRemaining] = React.useState(duration);
    const expiredRef = React.useRef(false);

    React.useEffect(() => {
      if (!open) { setRemaining(duration); expiredRef.current = false; return; }
      setRemaining(duration);
      expiredRef.current = false;
      const started = Date.now();
      const id = window.setInterval(() => {
        const left = Math.max(0, duration - (Date.now() - started) / 1000);
        setRemaining(left);
        if (left <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          window.clearInterval(id);
          onExpire?.();
        }
      }, 100);
      return () => window.clearInterval(id);
      // onExpire is intentionally not a dependency; the window restarts on open.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, duration]);

    if (!open) return null;

    const progress = Math.max(0, Math.min(1, remaining / duration));
    const seconds = Math.ceil(remaining);

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="undo-bar"
        className={cn("oui-grace", className)}
        role="status"
        aria-live="polite"
      >
        <span className="oui-grace__ring" aria-hidden="true">
          <svg viewBox="0 0 36 36">
            <circle className="oui-grace__track" cx="18" cy="18" r="15.5" />
            <circle
              className="oui-grace__fill"
              cx="18"
              cy="18"
              r="15.5"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
              style={reduced ? undefined : { transition: "stroke-dashoffset .12s linear" }}
            />
          </svg>
          <b>{seconds}</b>
        </span>

        <span className="oui-grace__message">{message}</span>

        <button type="button" className="oui-grace__undo" onClick={onUndo}>{undoLabel}</button>
      </div>
    );
  },
);
UndoBar.displayName = "UndoBar";

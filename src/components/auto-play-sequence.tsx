"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type SequenceStep = { id: string; label: string; body?: React.ReactNode };

export interface AutoPlaySequenceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  steps: readonly SequenceStep[];
  /** Seconds each step holds. */
  interval?: number;
  label?: string;
}

/**
 * A sequence that advances itself, with a progress bar per step.
 *
 * It pauses on hover and on focus, because an auto-advancing panel that moves
 * while you are reading it is worse than no motion at all. Steps are also real
 * buttons, so the sequence can be driven manually and never traps a reader in
 * someone else's pacing.
 *
 * Playback is a timer rather than rAF, so a hidden tab does not desynchronise
 * the bar from the content.
 */
export const AutoPlaySequence = React.forwardRef<HTMLDivElement, AutoPlaySequenceProps>(
  ({ className, steps, interval = 4, label = "Sequence", ...props }, ref) => {
    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);

    React.useEffect(() => {
      if (paused || steps.length < 2) return;
      const id = window.setInterval(() => setIndex((i) => (i + 1) % steps.length), interval * 1000);
      return () => window.clearInterval(id);
    }, [paused, steps.length, interval]);

    return (
      <div
        ref={ref}
        data-open-ui="auto-play-sequence"
        data-paused={paused || undefined}
        className={cn("oui-sequence", className)}
        style={{ "--oui-sequence-interval": `${interval}s` } as React.CSSProperties}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        aria-label={label}
        {...props}
      >
        <div className="oui-sequence__steps">
          {steps.map((step, i) => (
            <button
              key={step.id}
              type="button"
              className="oui-sequence__step"
              data-state={i === index ? "current" : i < index ? "done" : "upcoming"}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
            >
              <span className="oui-sequence__rail"><i /></span>
              {step.label}
            </button>
          ))}
        </div>
        <div className="oui-sequence__panel" key={steps[index]?.id}>{steps[index]?.body}</div>
      </div>
    );
  },
);
AutoPlaySequence.displayName = "AutoPlaySequence";

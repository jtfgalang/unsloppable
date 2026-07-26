"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SplitPaneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  start: React.ReactNode;
  end: React.ReactNode;
  /** Controlled split, 10 to 90 percent. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  startLabel?: string;
  endLabel?: string;
  label?: string;
  min?: number;
  max?: number;
}

/**
 * Two panes divided by a handle the reader can move.
 *
 * The handle is a native range input rather than a pointer-drag div. That single
 * choice gets keyboard support, arrow-key stepping, Home and End, touch, and the
 * correct slider semantics for free, where a hand-rolled drag would have to
 * reimplement all of it and usually reimplements none of it.
 *
 * The input is visually collapsed onto the divider but never hidden from the
 * accessibility tree, so it stays focusable and announces its position.
 */
export const SplitPane = React.forwardRef<HTMLDivElement, SplitPaneProps>(
  ({ className, start, end, value, defaultValue = 50, onValueChange, startLabel = "Before", endLabel = "After", label = "Split view", min = 10, max = 90, ...props }, forwardedRef) => {
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue);
    const split = Math.max(min, Math.min(max, controlled ? (value as number) : internal));

    const commit = (next: number) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    };

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="split-pane"
        className={cn("oui-cleave", className)}
        style={{ "--oui-cleave-split": `${split}%` } as React.CSSProperties}
      >
        <div className="oui-cleave__pane" data-side="start">
          <span className="oui-cleave__tag">{startLabel}</span>
          <div className="oui-cleave__content">{start}</div>
        </div>

        <div className="oui-cleave__pane" data-side="end">
          <span className="oui-cleave__tag">{endLabel}</span>
          <div className="oui-cleave__content">{end}</div>
        </div>

        <div className="oui-cleave__divider" aria-hidden="true"><span /></div>

        <input
          className="oui-cleave__range"
          type="range"
          min={min}
          max={max}
          step={1}
          value={split}
          aria-label={label}
          aria-valuetext={`${split}% ${startLabel}, ${100 - split}% ${endLabel}`}
          onChange={(event) => commit(Number(event.target.value))}
        />
      </div>
    );
  },
);
SplitPane.displayName = "SplitPane";

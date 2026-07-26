"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ScrubNumberProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * A number you can drag sideways to change, as designers expect from a scrubber.
 *
 * The drag uses pointer capture, so the gesture keeps working when the cursor
 * leaves the element, which is the failure every hand-rolled scrubber has. It is
 * paired with a real number input, so the same value is typeable, tabbable, and
 * arrow-key adjustable rather than being drag-only.
 */
export const ScrubNumber = React.forwardRef<HTMLInputElement, ScrubNumberProps>(
  ({ className, label, value, defaultValue = 0, onValueChange, min = -Infinity, max = Infinity, step = 1, unit, ...props }, ref) => {
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue);
    const current = controlled ? (value as number) : internal;
    const drag = React.useRef<{ x: number; from: number } | null>(null);
    const id = React.useId().replace(/:/g, "");

    const commit = (next: number) => {
      const clamped = Math.min(max, Math.max(min, Math.round(next / step) * step));
      if (!controlled) setInternal(clamped);
      onValueChange?.(clamped);
    };

    return (
      <div data-open-ui="scrub-number" className={cn("oui-scrub", className)} {...props}>
        <label
          className="oui-scrub__label"
          htmlFor={`${id}-input`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, from: current };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            event.preventDefault();
            commit(drag.current.from + (event.clientX - drag.current.x) * step);
          }}
          onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); drag.current = null; }}
        >
          {label}
        </label>
        <span className="oui-scrub__field">
          <input
            ref={ref}
            id={`${id}-input`}
            type="number"
            step={step}
            value={Number.isFinite(current) ? current : 0}
            onChange={(event) => commit(Number(event.target.value))}
          />
          {unit ? <em>{unit}</em> : null}
        </span>
      </div>
    );
  },
);
ScrubNumber.displayName = "ScrubNumber";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface OdometerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The verified value to display. */
  value: number;
  /** Group thousands with separators. */
  group?: boolean;
  /** Roll duration in seconds. */
  duration?: number;
  /** Extra seconds each successive digit lags, giving the reels their cascade. */
  stagger?: number;
  /** Leading label, for example a currency symbol. */
  prefix?: string;
  /** Trailing label, for example a unit. */
  suffix?: string;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A mechanical counter: each digit is a reel of 0 through 9 that rolls to its
 * place, where Reckon interpolates the value as text.
 *
 * The reels move on a CSS `transform` transition rather than an animation loop,
 * so there is no per-frame JavaScript and nothing to strand in a hidden tab. The
 * committed value is rendered for assistive tech and the reels are decorative,
 * which means the real number is exposed once and never announced digit by digit
 * as it spins.
 */
export const Odometer = React.forwardRef<HTMLSpanElement, OdometerProps>(
  ({ className, value, group = true, duration = 1.1, stagger = 0.06, prefix, suffix, style, ...props }, forwardedRef) => {
    const reduced = useHydratedReducedMotion();
    const safe = Number.isFinite(value) ? Math.trunc(Math.abs(value)) : 0;
    const text = group ? safe.toLocaleString("en-US") : String(safe);
    const characters = React.useMemo(() => text.split(""), [text]);

    // Reels start parked at zero and roll to the value once mounted, so the
    // motion is the arrival rather than a loop. Reduced motion skips straight
    // to the committed digits.
    const [rolled, setRolled] = React.useState(false);
    React.useEffect(() => {
      if (reduced) { setRolled(true); return; }
      const id = window.setTimeout(() => setRolled(true), 60);
      return () => window.clearTimeout(id);
    }, [reduced, text]);

    let digitIndex = -1;

    return (
      <span
        ref={forwardedRef}
        data-open-ui="odometer"
        className={cn("oui-odometer", className)}
        style={{ "--oui-odo-duration": `${duration}s`, ...style } as React.CSSProperties}
        {...props}
      >
        <span className="oui-odometer__sr">
          {prefix}
          {text}
          {suffix}
        </span>

        <span className="oui-odometer__reels" aria-hidden="true">
          {prefix ? <span className="oui-odometer__fixed">{prefix}</span> : null}
          {characters.map((char, index) => {
            if (!/\d/.test(char)) {
              return (
                <span className="oui-odometer__fixed" key={`sep-${index}`}>
                  {char}
                </span>
              );
            }
            digitIndex += 1;
            const target = rolled ? Number(char) : 0;
            return (
              <span className="oui-odometer__reel" key={`digit-${index}`}>
                <span
                  className="oui-odometer__strip"
                  style={{
                    transform: `translateY(${-target * 10}%)`,
                    transitionDelay: reduced ? "0s" : `${digitIndex * stagger}s`,
                  }}
                >
                  {DIGITS.map((digit) => (
                    <span className="oui-odometer__digit" key={digit}>
                      {digit}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
          {suffix ? <span className="oui-odometer__fixed">{suffix}</span> : null}
        </span>
      </span>
    );
  },
);
Odometer.displayName = "Odometer";

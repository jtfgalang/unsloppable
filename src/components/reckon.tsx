"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface ReckonProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children" | "prefix"> {
  /** The verified value. The count lands on exactly this number. */
  value: number;
  /**
   * Visible decimal places. Leave it out and the value's own precision is used,
   * so a figure is never quietly rounded to something it is not.
   */
  decimals?: number;
  /** Leading label, for example a currency symbol. */
  prefix?: string;
  /** Trailing label, for example a unit. */
  suffix?: string;
  /** Seconds for the count. */
  duration?: number;
  /** Draw the ledger rule that closes under the figure. */
  rule?: boolean;
}

/** Decimal places the value actually carries, so inference never invents any. */
const precisionOf = (value: number) => {
  const text = String(value);
  const point = text.indexOf(".");
  return point === -1 || text.includes("e") || text.includes("E") ? 0 : text.length - point - 1;
};

/**
 * A figure that reckons: it counts to a verified number and then rules itself
 * off the way a total is closed in a ledger, with a hairline under the count and
 * a second hairline that arrives only at the landing.
 *
 * **The count is CSS, not JavaScript.** A registered `<integer>` custom property
 * is animated by a keyframe and printed through `counter()`. That buys three
 * things the frame-loop version could not:
 *
 * - It cannot drift off the value. The end keyframe *is* the number, so the
 *   figure lands on it by construction rather than by an interpolation that
 *   happens to round well. Nothing here ever renders a value the caller did not
 *   supply, and the committed number is formatted once, from the prop.
 * - It survives a background tab and an embedded preview, which suspend
 *   animation frames and leave a JavaScript counter frozen on a number that was
 *   never true.
 * - It costs no frames. There is no subscription, no per-frame write, and no
 *   React render after the first.
 *
 * Two consequences, both deliberate. The visible digits are generated content,
 * so the committed value is carried as real text for assistive tech and the
 * digits are hidden from it, the same split Odometer makes. And a value carried
 * to three or more decimal places is presented rather than counted: CSS counters
 * are integers, a count at that precision is unreadable anyway, and a wrong
 * count is worse than none.
 *
 * The digit box is reserved at the width of the final figure, so a number
 * growing from one digit to four never reflows the line it sits in.
 */
export const Reckon = React.forwardRef<HTMLSpanElement, ReckonProps>(
  ({ className, value, decimals, prefix, suffix, duration = 1.1, rule = true, style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLSpanElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLSpanElement);
    const reduced = useHydratedReducedMotion();

    const finite = Number.isFinite(value) ? value : 0;
    // A number JavaScript writes in exponent form, 1e-7 or 2e+21, has no honest
    // fixed-point form at an inferred precision: rounding it to nothing and
    // printing "0" would be the exact failure this component refuses. Unless the
    // caller names a precision, such a value is printed as itself.
    const exponential = decimals === undefined && /e/i.test(String(Math.abs(finite)));
    const precision = exponential ? 0 : Math.max(0, Math.min(decimals ?? precisionOf(finite), 20));
    // Split the formatted string rather than the float: 86.4 * 10 is 863.9999…
    // in binary, and a fraction derived that way would print the wrong digits.
    const fixed = exponential ? String(Math.abs(finite)) : Math.abs(finite).toFixed(precision);
    const [whole, fraction = ""] = fixed.split(".");
    const countable = !exponential && precision <= 2 && Number.isFinite(value) && whole.length <= 9;

    React.useEffect(() => {
      const node = localRef.current;
      if (!node) return;

      /*
        Everything that cannot be counted honestly is simply presented: reduced
        motion, a precision CSS counters cannot carry, no observer to start on,
        and a hidden document, which delivers no observations and would paint a
        count frozen on its first frame. A figure nobody asked to animate is
        still the right figure; a zero held under a caption that says 86 is not.
      */
      if (reduced || !countable || typeof IntersectionObserver === "undefined" || document.visibilityState === "hidden") {
        node.dataset.state = "rested";
        return;
      }

      // Counting to a figure nobody has scrolled to is animation spent on an
      // empty room. The observer also restarts the count when the value itself
      // changes, because its callback lands after the style flush that took the
      // element back to `armed`.
      node.dataset.state = "armed";
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.state = "lit";
          observer.disconnect();
        }
      }, { threshold: 0.4 });
      observer.observe(node);
      return () => observer.disconnect();
    }, [countable, fixed, reduced]);

    return (
      <span
        ref={localRef}
        data-open-ui="reckon"
        className={cn("oui-reckon", className)}
        style={{
          // The resting value of the animated properties is the committed
          // figure, so an unarmed, unstyled or un-run component shows the truth
          // rather than a zero waiting to be corrected.
          "--oui-reckon-int": countable ? Number(whole) : 0,
          "--oui-reckon-frac": countable && fraction ? Number(fraction) : 0,
          "--oui-reckon-to-int": countable ? Number(whole) : 0,
          "--oui-reckon-to-frac": countable && fraction ? Number(fraction) : 0,
          "--oui-reckon-span": `${whole.length}ch`,
          "--oui-reckon-duration": `${duration}s`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {/* Sign first, then any prefix, so the spoken figure reads in the order
            the figure is drawn: -$5, never $-5. */}
        <span className="oui-reckon__sr">{`${finite < 0 ? "-" : ""}${prefix ?? ""}${fixed}${suffix ?? ""}`}</span>

        <span className="oui-reckon__figure" aria-hidden="true">
          {finite < 0 ? <i className="oui-reckon__affix">-</i> : null}
          {prefix ? <i className="oui-reckon__affix">{prefix}</i> : null}
          {countable ? (
            <>
              <i className="oui-reckon__int" />
              {precision > 0 ? (
                <>
                  <i className="oui-reckon__point">.</i>
                  {/* Two decimal places need their leading zero: 0.04 counts to a
                      frac of 4 and must still print as "04". */}
                  <i className={cn("oui-reckon__frac", precision === 2 && "oui-reckon__frac--padded")} />
                </>
              ) : null}
            </>
          ) : (
            <i className="oui-reckon__still">{fixed}</i>
          )}
          {suffix ? <i className="oui-reckon__affix">{suffix}</i> : null}
          {rule ? (
            <>
              <b className="oui-reckon__rule" />
              <b className="oui-reckon__rule oui-reckon__rule--total" />
            </>
          ) : null}
        </span>
      </span>
    );
  },
);
Reckon.displayName = "Reckon";

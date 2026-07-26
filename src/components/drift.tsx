import * as React from "react";
import { cn } from "../lib/utils";

export interface DriftProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short, self-contained items. The list is repeated once to close the loop. */
  items: React.ReactNode[];
  /** Seconds for one full pass of the band. */
  duration?: number;
  /** Send the band the other way. */
  reverse?: boolean;
  /** Hold the band while a pointer rests on it. Focus holds it either way. */
  pauseOnHover?: boolean;
  /** How far the deepest item sits behind the front of the band, in pixels. `0` flattens it. */
  depth?: number;
  /** Accessible name for the band. */
  label?: string;
}

/**
 * The golden angle in radians. Sampling a sine at this step gives every index a
 * different depth without ever repeating a short cycle, so the band never falls
 * into a visible sawtooth the way `index % 3` does. It is arithmetic on the
 * index alone, so server and client agree and nothing here needs `Math.random`.
 */
const GOLDEN_ANGLE = 2.399963229728653;

const depthAt = (index: number) => Math.round((0.5 + Math.sin(index * GOLDEN_ANGLE) / 2) * 1000) / 1000;

/** The list is laid twice: the band the reader sees, and the twin that closes the loop. */
const COPIES = ["front", "echo"] as const;

/**
 * A band of short items travelling through space, rather than a strip sliding
 * sideways behind a window.
 *
 * The depth is real perspective, not a fake: the frame carries the `perspective`,
 * the rail preserves 3D, and each item holds a fixed `translateZ`. A projected
 * translation moves a far item a shorter screen distance than a near one, so a
 * single composited animation on the rail buys genuine parallax, and the far
 * items are smaller and dimmer because they are further away rather than because
 * something scaled them.
 *
 * The obvious alternative was one animation per item at its own rate. It was
 * rejected twice over: it costs a compositor layer and a timeline per item, and
 * lanes running at different rates cannot share a loop point, so the seam stops
 * being seamless. Here the list is duplicated exactly once and the rail travels
 * exactly -50%, which puts every item back on the geometry its twin just left.
 *
 * Depth is decorative; the second copy is hidden from assistive tech and the
 * band carries one accessible name.
 */
export const Drift = React.forwardRef<HTMLDivElement, DriftProps>(
  ({ className, items, duration = 28, reverse = false, pauseOnHover = true, depth = 130, label = "Drifting content", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-open-ui="drift"
        role="group"
        aria-label={label}
        /*
          Focusable on purpose. Hover pauses the band for a mouse, and WCAG 2.2.2
          wants the same escape for everyone else; focus is the keyboard's hover.
          Under reduced motion the frame becomes a real scroller, where a tab stop
          is the only way to reach the items past the fold.
        */
        tabIndex={0}
        className={cn("oui-drift", pauseOnHover && "oui-drift--pause", className)}
        style={{
          "--oui-drift-duration": `${duration}s`,
          "--oui-drift-depth": depth,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <div className={cn("oui-drift__track", reverse && "oui-drift__track--reverse")}>
          {COPIES.flatMap((copy) =>
            items.map((item, index) => (
              <span
                key={`${copy}-${index}`}
                className={cn("oui-drift__item", copy === "echo" && "oui-drift__item--echo")}
                aria-hidden={copy === "echo" || undefined}
                /* Depth keys off the item index, not the flattened position, so
                   an item and its twin sit at the same distance and the loop
                   point is pixel-identical. */
                style={{ "--oui-drift-t": depthAt(index) } as React.CSSProperties}
              >
                {item}
              </span>
            )),
          )}
        </div>
      </div>
    );
  },
);
Drift.displayName = "Drift";

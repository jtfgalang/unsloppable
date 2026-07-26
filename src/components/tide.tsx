"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export type TideItem = {
  id: string | number;
  node: React.ReactNode;
};

export interface TideProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  items: readonly TideItem[];
  /** Seconds for the feed to work through one full pass of the set. */
  speed?: number;
  /** Gap between rows in pixels. */
  gap?: number;
  /** Most rows the window will hold. The feed shows fewer if fewer fit. */
  visible?: number;
  /** Hold the queue while the pointer is over the feed, so a row can be read. */
  pauseOnHover?: boolean;
  /** Accessible name for the feed. */
  label?: string;
}

/** Clear band above the first row, so a landed row never rests inside the top fade. */
const CREST_EDGE = 8;
/** Band at the foot of the box the ebbing row recedes through. Kept clear of resting rows. */
const EBB_EDGE = 20;
/** Settle duration. The arrival overshoots slightly and comes back, which is the weight. */
const SETTLE = 660;

/**
 * A feed where each event washes in at the top and the column settles under it.
 *
 * The predecessor was a marquee: the whole set rendered twice and translated
 * forever, so nothing ever *arrived*: rows drifted past at a constant speed and
 * the reader had no way to tell a new event from an old one. This version has a
 * beat. One row lands, the column settles under it, and the oldest row spends
 * the rest of the beat receding out of the bottom of the box.
 *
 * WHY THE WINDOW IS MEASURED AND NOT ASSUMED. `visible` used to be a DOM budget
 * with no relationship to the box the feed was given, and the box is the
 * caller's. The two disagreeing is what made this component look broken: at
 * 360x300 the spare row surfaced as an 11%-tall sliver, at 850x370 it sat fully
 * legible and permanently half-masked (which is how a *disabled* row is drawn),
 * and at 486x166 two entire rows rendered outside the box where the ebb could
 * not be seen at all. So the window is now measured: `visible` is a maximum, and
 * the feed shows however many whole rows actually fit between the two edge
 * bands. One measurement per resize, never per frame.
 *
 * WHY A WINDOW, NOT THE WHOLE LIST. Only `slots + 1` rows are ever in the DOM,
 * so a feed of four hundred events costs the same as a feed of six. The marquee
 * paid twice `items.length` nodes and animated a track as tall as the whole set.
 *
 * WHY THE OLDEST ROW HAS ITS OWN ANIMATION. It used to have none: it was simply
 * parked under a container mask, dimmed to a constant fraction and motionless
 * for the 2.2s between arrivals. A static partial opacity on a readable row is
 * the universal drawing of "disabled", so the row read as switched off rather
 * than as leaving. It now recedes for the whole beat, under its own opacity and
 * transform, and reaches zero before it is unmounted. Nothing ever comes to rest
 * part-lit.
 *
 * WHY ONE `.animate()` PER ARRIVAL AND NOT A CSS LOOP. The settle has to travel
 * exactly the height of the row that just landed, and rows are caller-authored,
 * so that distance is only knowable at runtime. One measurement of one element
 * per arrival is O(1); walking the column every frame would make the component
 * slower the more useful it got. The animation itself is a single composited
 * `translateY` on the track, so cost is independent of row count.
 *
 * WHY A TIMER AND NOT `requestAnimationFrame`. rAF is suspended in a hidden tab
 * and in embedded previews. A feed that silently stops advancing looks broken;
 * an interval keeps the queue honest and the arrival is CSS from there.
 *
 * ACCESSIBILITY. The moving track is decorative and `aria-hidden`. A static list
 * holding every item exactly once sits behind it and carries the accessible
 * name. The visible track must never be the named one, or the name lands on
 * the copy assistive tech is told to ignore. Nothing here is a live region: the
 * static list never changes, so no arrival is ever announced.
 */
export const Tide = React.forwardRef<HTMLDivElement, TideProps>(
  ({ className, items, speed = 22, gap = 12, visible = 4, pauseOnHover = true, label = "Activity feed", style, onPointerEnter, onPointerLeave, ...props }, forwardedRef) => {
    const reduced = useHydratedReducedMotion();
    const count = items.length;

    const hostRef = React.useRef<HTMLDivElement>(null);
    const trackRef = React.useRef<HTMLUListElement>(null);
    const freshRef = React.useRef<HTMLLIElement>(null);
    const held = React.useRef(false);

    // `head` is an ever-increasing arrival counter, not an index. It gives every
    // landed row a key that has never existed before, which is what makes the
    // browser run the landing animation on mount instead of reusing a node.
    const [head, setHead] = React.useState(0);
    // How many whole rows the box can actually show. Null until measured, and in
    // any engine without ResizeObserver it stays null and `visible` stands.
    const [fits, setFits] = React.useState<number | null>(null);

    const slots = Math.max(1, Math.min(visible, count, fits ?? visible));
    const beat = Math.max(600, (speed * 1000) / Math.max(1, count));

    const setRef = React.useCallback((node: HTMLDivElement | null) => {
      hostRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    // The window follows the box. Re-entrancy is bounded rather than guarded:
    // a box that sizes to its own content settles at `visible` and stops, since
    // `slots` is capped there and each pass can only add one row.
    React.useEffect(() => {
      const host = hostRef.current;
      if (!host || typeof ResizeObserver === "undefined") return;
      const measure = () => {
        const row = trackRef.current?.firstElementChild;
        const rowHeight = row instanceof HTMLElement ? row.getBoundingClientRect().height : 0;
        const band = host.clientHeight - CREST_EDGE - EBB_EDGE;
        if (rowHeight <= 0 || band <= 0) return;
        const next = Math.max(1, Math.floor((band + gap) / (rowHeight + gap)));
        setFits((previous) => (previous === next ? previous : next));
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(host);
      return () => observer.disconnect();
    }, [gap]);

    React.useEffect(() => {
      if (reduced || count < 2) return;
      const id = window.setInterval(() => {
        if (!held.current) setHead((previous) => previous + 1);
      }, beat);
      return () => window.clearInterval(id);
    }, [beat, count, reduced]);

    React.useLayoutEffect(() => {
      if (head === 0 || reduced) return;
      const track = trackRef.current;
      const fresh = freshRef.current;
      // jsdom and very old engines have no WAAPI; the row is simply already in
      // place there, which is the same frame the animation ends on.
      if (!track || !fresh || typeof track.animate !== "function") return;
      const lift = fresh.getBoundingClientRect().height + gap;
      track.animate(
        [{ transform: `translate3d(0, ${-lift}px, 0)` }, { transform: "translate3d(0, 0, 0)" }],
        // The tail of this curve passes zero and comes back, so the column lands
        // instead of gliding to a stop. Overshoot is a few pixels, not a bounce.
        { duration: SETTLE, easing: "cubic-bezier(.2, .92, .28, 1.08)" },
      );
    }, [gap, head, reduced]);

    const frame = React.useMemo(() => {
      if (reduced || count === 0) return items.map((item, index) => ({ item, key: `${item.id}-${index}` }));
      // One extra row hangs below the fold. It is the row on its way out, and it
      // is animating the whole time it is there. A single-item feed never
      // advances, so it gets no outgoing row to recede.
      return Array.from({ length: count > 1 ? slots + 1 : slots }, (_, offset) => {
        const arrival = head - offset;
        const item = items[((arrival % count) + count) % count];
        return { item, key: `${item.id}-${arrival}` };
      });
    }, [count, head, items, reduced, slots]);

    const hold = (next: boolean) => { if (pauseOnHover) held.current = next; };

    return (
      <div
        ref={setRef}
        data-open-ui="tide"
        data-static={reduced || undefined}
        className={cn("oui-tide", className)}
        style={{
          "--oui-tide-gap": `${gap}px`,
          "--oui-tide-crest-edge": `${CREST_EDGE}px`,
          "--oui-tide-ebb-edge": `${EBB_EDGE}px`,
          // The ebb is exactly one beat long, so the row is gone at the frame the
          // next arrival unmounts it and the bottom of the box is never half-lit.
          "--oui-tide-beat": `${Math.round(beat)}ms`,
          "--oui-tide-settle": `${SETTLE}ms`,
          ...style,
        } as React.CSSProperties}
        onPointerEnter={(event) => { hold(true); onPointerEnter?.(event); }}
        onPointerLeave={(event) => { hold(false); onPointerLeave?.(event); }}
        {...props}
      >
        {/* The authoritative, static list, and the only one with a name, since
            the visible track is aria-hidden. An earlier version accepted and
            defaulted `label` and then never applied it, so every caller that
            set one got an unnamed list and no warning about it. */}
        <ul className="oui-tide__a11y" aria-label={label}>
          {items.map((item, index) => <li key={`a11y-${item.id}-${index}`}>{item.node}</li>)}
        </ul>
        <ul ref={trackRef} className="oui-tide__track" aria-hidden="true">
          {frame.map(({ item, key }, index) => (
            <li
              key={key}
              ref={index === 0 ? freshRef : undefined}
              className="oui-tide__row"
              data-fresh={!reduced && index === 0 && head > 0 ? "" : undefined}
              data-ebb={!reduced && index > 0 && index === frame.length - 1 ? "" : undefined}
            >
              <span className="oui-tide__crest" aria-hidden="true" />
              {item.node}
            </li>
          ))}
        </ul>
      </div>
    );
  },
);
Tide.displayName = "Tide";

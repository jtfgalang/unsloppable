"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface WickProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "role" | "children"> {
  /** Controlled burn, 0 to 1. Left out, the wick reads the scroll itself. */
  progress?: number;
  /** Scope the read to one element instead of the page. */
  target?: React.RefObject<HTMLElement | null>;
  /** Accessible name, and the visible caption. */
  label?: string;
  /** Optional milestones, listed in reading order. */
  sections?: string[];
  /** Controlled milestone index. Derived from the burn when left out. */
  activeSection?: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Reading progress as a fuse burning down, not a bar filling up.
 *
 * The inversion is the point. A progress bar accumulates: the more you read, the
 * more there is. A wick is consumed, so the cord here starts whole and is eaten
 * from the left, with an ember riding the burn line that lights when reading
 * starts and goes out when the cord runs out. What the reader sees is how much
 * is left, which is the question they actually have.
 *
 * **One number drives everything.** `--oui-wick-burn` is a registered custom
 * property, and the cord, the ember and the milestones are all `calc()` off it.
 * That leaves three ways to set it, picked once on mount:
 *
 * - Controlled: React writes the value and CSS eases it. A prop that changes
 *   every second or two has no business running a frame loop.
 * - Uncontrolled on the page: a scroll-driven CSS animation, so the browser
 *   ties the wick to the scroller and no JavaScript runs while scrolling at all.
 * - Anything else (a `target`, or a browser without scroll timelines): one
 *   passive listener. It reads `scrollY` and nothing else; the element geometry
 *   is measured on mount and on resize, never in the scroll handler, so
 *   scrolling can never force a synchronous layout.
 *
 * The previous build measured through the animation library's scroll hook on
 * every frame of every scroll and drove a spring behind it, for a readout that
 * moves a few pixels.
 */
export const Wick = React.forwardRef<HTMLDivElement, WickProps>(
  ({ className, progress, target, label = "Reading progress", sections = [], activeSection, style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();

    const controlled = progress !== undefined;
    const burn = clamp01(progress ?? 0);
    const percent = Math.round(burn * 100);

    React.useEffect(() => {
      const node = localRef.current;
      if (!node || controlled) return;

      // A scroll timeline is the cheapest possible version of this: the browser
      // owns the link between scroll offset and the animation, so there is no
      // listener, no frame loop, and nothing to desync. It cannot express a
      // range scoped to one element here, so a target falls through to the
      // listener.
      if (!target && typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()")) {
        node.dataset.source = "scroll";
        return;
      }

      node.dataset.source = "read";

      let origin = 0;
      let span = 1;
      const measure = () => {
        const element = target?.current;
        if (element) {
          const box = element.getBoundingClientRect();
          origin = box.top + window.scrollY;
          span = Math.max(1, box.height - window.innerHeight);
          return;
        }
        origin = 0;
        span = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      };
      const write = () => node.style.setProperty("--oui-wick-burn", clamp01((window.scrollY - origin) / span).toFixed(4));
      const remeasure = () => { measure(); write(); };

      // Seeded here, because a scroll subscription never fires on a page nobody
      // has scrolled yet and would leave a half-read article showing an untouched
      // cord.
      remeasure();

      window.addEventListener("scroll", write, { passive: true });
      window.addEventListener("resize", remeasure, { passive: true });
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remeasure);
      observer?.observe(target?.current ?? document.documentElement);

      return () => {
        window.removeEventListener("scroll", write);
        window.removeEventListener("resize", remeasure);
        observer?.disconnect();
      };
    }, [controlled, target]);

    return (
      <div
        ref={localRef}
        data-open-ui="wick"
        data-source={controlled ? "value" : undefined}
        className={cn("oui-wick", className)}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={controlled ? percent : undefined}
        style={{ ...(controlled ? { "--oui-wick-burn": burn } : null), ...style } as React.CSSProperties}
        {...props}
      >
        <header>
          <span>{label}</span>
          {controlled ? <output>{percent}%</output> : null}
        </header>

        <div className="oui-wick__cord" aria-hidden="true">
          <i className="oui-wick__fuse" />
          {/* A full-width carriage, so the ember can be placed as a percentage of
              the cord rather than of its own tiny box. The heat around it is a
              real element and is simply never created when motion is not wanted,
              rather than created and then told to hold still. */}
          <span className="oui-wick__front">
            <i className="oui-wick__ember">{reduced ? null : <i className="oui-wick__halo" />}</i>
          </span>
        </div>

        {sections.length > 0 ? (
          <ol>
            {sections.map((section, index) => (
              <li
                key={section}
                /* The milestone knows where it sits on the cord and lights itself
                   from the same number the ember rides, so nothing has to be
                   recomputed in JavaScript as the reader moves. */
                style={{ "--oui-wick-mark": index / sections.length } as React.CSSProperties}
                data-lit={(activeSection !== undefined && index <= activeSection) || undefined}
              >
                <i />
                <span>{section}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    );
  },
);
Wick.displayName = "Wick";

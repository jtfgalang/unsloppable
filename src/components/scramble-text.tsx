"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface ScrambleTextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The phrase to resolve to. */
  children: string;
  /** Milliseconds between scramble frames. */
  tick?: number;
  /** Frames each character churns before it locks. */
  churn?: number;
  /** Delay before decoding starts, in ms. */
  delay?: number;
  /** Glyphs used while a character is unresolved. */
  glyphs?: string;
  /** Re-run the decode whenever the phrase re-enters the viewport. */
  repeat?: boolean;
}

const DEFAULT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/\\<>*+=-_";

/**
 * A phrase that decodes into place, one character at a time.
 *
 * State is seeded with the final text, not an empty string, so the server render
 * and the no-JS state are both the real sentence. The scramble is driven by
 * `setInterval` rather than `requestAnimationFrame` on purpose: rAF is suspended
 * in a hidden tab, which would strand the phrase mid-decode, whereas an interval
 * still advances and the text lands correctly.
 *
 * Whitespace never scrambles, so word shape and line breaks stay stable and the
 * layout never jitters.
 */
export const ScrambleText = React.forwardRef<HTMLSpanElement, ScrambleTextProps>(
  ({ className, children, tick = 38, churn = 3, delay = 120, glyphs = DEFAULT_GLYPHS, repeat = false, style, ...props }, forwardedRef) => {
    const target = String(children ?? "");
    const localRef = React.useRef<HTMLSpanElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLSpanElement);
    const reduced = useHydratedReducedMotion();
    const [display, setDisplay] = React.useState(target);
    const [armed, setArmed] = React.useState(false);

    // Only decode once the phrase is actually on screen.
    React.useEffect(() => {
      const node = localRef.current;
      if (!node) return;
      if (reduced || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setArmed(true);
              if (!repeat) observer.unobserve(entry.target);
            } else if (repeat) {
              setArmed(false);
            }
          }
        },
        { threshold: 0.5 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, [reduced, repeat]);

    React.useEffect(() => {
      if (reduced || !armed) { setDisplay(target); return; }

      let frame = 0;
      const total = target.length * churn;
      const start = window.setTimeout(() => {
        const id = window.setInterval(() => {
          frame += 1;
          const revealed = Math.floor(frame / churn);
          let next = "";
          for (let i = 0; i < target.length; i += 1) {
            const char = target[i];
            if (char === " " || char === "\n" || i < revealed) next += char;
            else next += glyphs[Math.floor(Math.random() * glyphs.length)];
          }
          setDisplay(next);
          if (frame >= total) {
            window.clearInterval(id);
            setDisplay(target);
          }
        }, tick);
        cleanup = () => window.clearInterval(id);
      }, delay);

      let cleanup = () => undefined as void;
      return () => {
        window.clearTimeout(start);
        cleanup();
      };
    }, [armed, churn, delay, glyphs, reduced, target, tick]);

    return (
      <span
        ref={localRef}
        data-open-ui="scramble-text"
        className={cn("oui-scramble", className)}
        style={style}
        {...props}
      >
        {/* The true phrase stays in the accessibility tree while the glyphs churn. */}
        <span className="oui-scramble__sr">{target}</span>
        <span className="oui-scramble__glyphs" aria-hidden="true">{display}</span>
      </span>
    );
  },
);
ScrambleText.displayName = "ScrambleText";

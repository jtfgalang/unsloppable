"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../lib/utils";
import { OPEN_UI_MOTION } from "./motion-tokens";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface WordSwapProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Words cycled through the slot. */
  words: string[];
  /** Seconds each word is held. */
  interval?: number;
  /** Travel distance in pixels for the entering and leaving word. */
  distance?: number;
  /** Pause cycling. The current word stays visible. */
  paused?: boolean;
}

export const WordSwap = React.forwardRef<HTMLSpanElement, WordSwapProps>(
  ({ className, words, interval = 2.6, distance = 14, paused = false, ...props }, ref) => {
    const reduced = useHydratedReducedMotion();
    const [index, setIndex] = React.useState(0);
    const usable = React.useMemo(() => words.filter(Boolean), [words]);

    React.useEffect(() => {
      if (paused || usable.length < 2) return;
      const timer = setInterval(() => setIndex((current) => (current + 1) % usable.length), Math.max(600, interval * 1000));
      return () => clearInterval(timer);
    }, [paused, interval, usable.length]);

    if (!usable.length) return null;
    const current = usable[index % usable.length];
    const transition = { duration: reduced ? 0 : 0.46, ease: OPEN_UI_MOTION.ease };

    return <span ref={ref} data-open-ui="word-swap" className={cn("oui-word-swap", className)} {...props}>
      <span className="sr-only">{current}</span>
      {/*
        The slot animates to each word's own width rather than reserving the
        widest. Reserving left a large trailing gap after short entries, and the
        surrounding line still never reflows because the width is animated.
      */}
      <motion.span
        aria-hidden
        layout={reduced ? false : "size"}
        transition={transition}
        className="oui-word-swap__slot"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={current}
            className="oui-word-swap__word"
            initial={reduced ? false : { y: distance, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: -distance, opacity: 0 }}
            transition={transition}
          >{current}</motion.span>
        </AnimatePresence>
      </motion.span>
    </span>;
  },
);
WordSwap.displayName = "WordSwap";

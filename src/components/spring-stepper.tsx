"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface SpringStepperProps extends Omit<HTMLMotionProps<"div">, "children" | "onChange"> {
  /** Controlled numeric value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Amount added or removed per press. */
  step?: number;
  /** Called whenever the value changes. */
  onValueChange?: (value: number) => void;
  /** Accessible name for the control. */
  label?: string;
}

export const SpringStepper = React.forwardRef<HTMLDivElement, SpringStepperProps>(
  ({ className, value, defaultValue = 1, min = 0, max = 99, step = 1, onValueChange, label = "Quantity", ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue);
    const [direction, setDirection] = React.useState(1);
    const reduced = useSafeReducedMotion();
    const current = value ?? internal;
    const update = (next: number) => {
      const clamped = Math.min(max, Math.max(min, next));
      setDirection(clamped >= current ? 1 : -1);
      if (value === undefined) setInternal(clamped);
      onValueChange?.(clamped);
    };
    return (
      <motion.div ref={ref} role="group" aria-label={label} className={cn("inline-grid grid-cols-[48px_84px_48px] items-center overflow-hidden rounded-2xl border border-neutral-300 bg-white text-neutral-950 shadow-sm dark:border-white/15 dark:bg-neutral-950 dark:text-white", className)} {...props}>
        <motion.button type="button" aria-label="Decrease" disabled={current <= min} className="grid h-14 place-items-center border-r border-neutral-200 text-xl outline-none focus-visible:bg-neutral-100 disabled:opacity-30 dark:border-white/10 dark:focus-visible:bg-white/10" whileTap={reduced ? undefined : { scale: 0.82 }} onClick={() => update(current - step)}>−</motion.button>
        <div className="relative grid h-14 place-items-center overflow-hidden" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.output key={current} custom={direction} initial={reduced ? false : { y: direction * 28, opacity: 0, filter: "blur(4px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={reduced ? undefined : { y: direction * -28, opacity: 0, filter: "blur(4px)" }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28, mass: 0.45 }} className="absolute text-xl font-semibold tabular-nums">{current}</motion.output>
          </AnimatePresence>
        </div>
        <motion.button type="button" aria-label="Increase" disabled={current >= max} className="grid h-14 place-items-center border-l border-neutral-200 text-xl outline-none focus-visible:bg-neutral-100 disabled:opacity-30 dark:border-white/10 dark:focus-visible:bg-white/10" whileTap={reduced ? undefined : { scale: 0.82 }} onClick={() => update(current + step)}>+</motion.button>
      </motion.div>
    );
  },
);
SpringStepper.displayName = "SpringStepper";

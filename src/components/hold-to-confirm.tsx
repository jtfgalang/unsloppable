"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface HoldToConfirmProps extends Omit<HTMLMotionProps<"button">, "children" | "onComplete"> {
  children?: React.ReactNode;
  /** Hold duration in milliseconds before confirmation. */
  holdFor?: number;
  /** Called after a complete uninterrupted hold. */
  onComplete?: () => void;
  /** Text announced while holding. */
  holdingLabel?: string;
}

export const HoldToConfirm = React.forwardRef<HTMLButtonElement, HoldToConfirmProps>(
  ({ className, children = "Hold to confirm", holdFor = 1100, onComplete, holdingLabel = "Keep holding", onPointerDown, onPointerUp, onPointerLeave, type = "button", ...props }, ref) => {
    const [holding, setHolding] = React.useState(false);
    const [complete, setComplete] = React.useState(false);
    const reduced = useSafeReducedMotion();
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const stop = React.useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setHolding(false);
    }, []);
    React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
    const start = () => {
      if (complete) return;
      setHolding(true);
      timerRef.current = setTimeout(() => {
        setHolding(false); setComplete(true); onComplete?.();
      }, reduced ? 500 : holdFor);
    };
    return (
      <motion.button ref={ref} type={type} className={cn("relative inline-flex min-h-13 min-w-52 select-none items-center justify-center overflow-hidden rounded-xl border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:border-white/15 dark:bg-neutral-950 dark:text-white", className)} onPointerDown={(event) => { onPointerDown?.(event); if (!event.defaultPrevented) start(); }} onPointerUp={(event) => { onPointerUp?.(event); stop(); }} onPointerLeave={(event) => { onPointerLeave?.(event); stop(); }} onKeyDown={(event) => { if ((event.key === " " || event.key === "Enter") && !event.repeat) start(); }} onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") stop(); }} whileTap={reduced ? undefined : { scale: 0.98 }} {...props}>
        <motion.span aria-hidden className="absolute inset-0 origin-left bg-neutral-950 dark:bg-white" animate={{ scaleX: holding || complete ? 1 : 0 }} transition={holding ? { duration: reduced ? 0 : holdFor / 1000, ease: "linear" } : { type: "spring", stiffness: 360, damping: 30 }} />
        <span className={cn("relative z-10 transition-colors", holding && "text-white mix-blend-difference", complete && "text-white mix-blend-difference")}>{complete ? "Confirmed ✓" : holding ? holdingLabel : children}</span>
      </motion.button>
    );
  },
);
HoldToConfirm.displayName = "HoldToConfirm";

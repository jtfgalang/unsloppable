"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface MorphIconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called when the icon changes state. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible action name. */
  label?: string;
}

export const MorphIconButton = React.forwardRef<HTMLButtonElement, MorphIconButtonProps>(
  ({ className, open, defaultOpen = false, onOpenChange, label = "Toggle menu", onClick, type = "button", ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultOpen);
    const reduced = useSafeReducedMotion();
    const active = open ?? internal;
    const update = (next: boolean) => { if (open === undefined) setInternal(next); onOpenChange?.(next); };
    const transition = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 360, damping: 25 };
    return (
      <motion.button ref={ref} type={type} aria-label={label} aria-expanded={active} className={cn("relative grid size-14 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:border-white/15 dark:bg-neutral-950 dark:text-white", className)} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) update(!active); }} whileTap={reduced ? undefined : { scale: 0.9 }} {...props}>
        <span className="relative block h-5 w-6">
          <motion.i className="absolute left-0 top-1/2 h-0.5 w-6 rounded-full bg-current" animate={{ y: active ? 0 : -6, rotate: active ? 45 : 0 }} transition={transition} />
          <motion.i className="absolute left-0 top-1/2 h-0.5 w-6 rounded-full bg-current" animate={{ opacity: active ? 0 : 1, scaleX: active ? 0.2 : 1 }} transition={transition} />
          <motion.i className="absolute left-0 top-1/2 h-0.5 w-6 rounded-full bg-current" animate={{ y: active ? 0 : 6, rotate: active ? -45 : 0 }} transition={transition} />
        </span>
      </motion.button>
    );
  },
);
MorphIconButton.displayName = "MorphIconButton";

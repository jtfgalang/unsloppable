"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export type TactileSegment = { id: string; label: React.ReactNode };
export interface TactileSegmentedControlProps extends Omit<HTMLMotionProps<"div">, "children" | "onChange"> {
  /** Segments displayed by the control. */
  items: TactileSegment[];
  /** Controlled selected id. */
  value?: string;
  /** Initial id when uncontrolled. */
  defaultValue?: string;
  /** Called after selection. */
  onValueChange?: (id: string) => void;
  /** Unique shared-layout namespace. */
  layoutId?: string;
}

export const TactileSegmentedControl = React.forwardRef<HTMLDivElement, TactileSegmentedControlProps>(
  ({ className, items, value, defaultValue, onValueChange, layoutId = "tactile-segment", ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.id);
    const reduced = useSafeReducedMotion();
    const active = value ?? internal;
    const select = (id: string) => { if (value === undefined) setInternal(id); onValueChange?.(id); };
    return (
      <motion.div ref={ref} role="tablist" className={cn("inline-flex rounded-2xl border border-neutral-200 bg-neutral-100 p-1.5 shadow-inner dark:border-white/10 dark:bg-neutral-900", className)} {...props}>
        {items.map((item) => { const selected = item.id === active; return <motion.button key={item.id} type="button" role="tab" aria-selected={selected} className="relative min-w-24 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:text-neutral-400" onClick={() => select(item.id)} whileTap={reduced ? undefined : { scale: 0.94, y: 1 }}>
          {selected && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-white shadow-[0_5px_16px_-7px_rgba(0,0,0,.35)] dark:bg-neutral-700" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 390, damping: 30, mass: 0.55 }} />}
          <span className={cn("relative z-10", selected && "text-neutral-950 dark:text-white")}>{item.label}</span>
        </motion.button>; })}
      </motion.div>
    );
  },
);
TactileSegmentedControl.displayName = "TactileSegmentedControl";

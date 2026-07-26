"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface ElasticToggleProps extends Omit<HTMLMotionProps<"button">, "children" | "onChange"> {
  /** Controlled pressed state. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called whenever the state changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible text for the switch. */
  label?: string;
}

export const ElasticToggle = React.forwardRef<HTMLButtonElement, ElasticToggleProps>(
  ({ className, checked, defaultChecked = false, onCheckedChange, label = "Toggle setting", onClick, disabled, type = "button", ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultChecked);
    const reduced = useSafeReducedMotion();
    const active = checked ?? internal;
    const setActive = (next: boolean) => {
      if (checked === undefined) setInternal(next);
      onCheckedChange?.(next);
    };
    return (
      <motion.button
        ref={ref}
        type={type}
        role="switch"
        aria-label={label}
        aria-checked={active}
        disabled={disabled}
        className={cn("relative h-9 w-[68px] rounded-full border border-neutral-300 bg-neutral-200 p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-500 data-[checked=true]:bg-neutral-950 dark:border-white/15 dark:bg-neutral-800 dark:data-[checked=true]:bg-white", className)}
        data-checked={active}
        onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) setActive(!active); }}
        whileTap={reduced ? undefined : { scale: 0.96 }}
        {...props}
      >
        <motion.span
          className="block size-7 rounded-full bg-white shadow-[0_3px_10px_rgba(0,0,0,.24)] dark:bg-neutral-950"
          animate={{ x: active ? 32 : 0, scaleX: reduced ? 1 : active ? [1.2, 1] : [1.16, 1] }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24, mass: 0.55 }}
        />
      </motion.button>
    );
  },
);
ElasticToggle.displayName = "ElasticToggle";

"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

type Ripple = { id: number; x: number; y: number; size: number };
export interface LiquidRippleButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  /** Ripple color. Defaults to a tint of the label color so it stays visible on either surface. */
  rippleColor?: string;
  /** Ripple expansion duration in seconds. */
  duration?: number;
}

export const LiquidRippleButton = React.forwardRef<HTMLButtonElement, LiquidRippleButtonProps>(
  // The shell inverts with the color scheme, so the ripple is derived from the label
  // color rather than hard-coded white, which disappeared on the light-surface variant.
  ({ className, children, rippleColor = "color-mix(in srgb, currentColor 26%, transparent)", duration = 0.62, onPointerDown, type = "button", ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const reduced = useSafeReducedMotion();
    const idRef = React.useRef(0);
    return (
      <motion.button
        ref={ref}
        type={type}
        // Stays dark in both color schemes. Inverting the shell made the label
        // color flip too, which is what the currentColor-derived ripple follows.
        className={cn("relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-xl bg-neutral-950 px-7 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-neutral-500", className)}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (reduced || event.defaultPrevented) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const size = Math.hypot(bounds.width, bounds.height) * 2;
          const id = ++idRef.current;
          setRipples((current) => [...current, { id, x: event.clientX - bounds.left, y: event.clientY - bounds.top, size }]);
          window.setTimeout(() => setRipples((current) => current.filter((ripple) => ripple.id !== id)), duration * 1000 + 120);
        }}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <AnimatePresence>{ripples.map((ripple) => <motion.span aria-hidden key={ripple.id} className="pointer-events-none absolute rounded-full" style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size, background: rippleColor, translateX: "-50%", translateY: "-50%" }} initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 1, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration, ease: [0.16, 1, 0.3, 1] }} />)}</AnimatePresence>
      </motion.button>
    );
  },
);
LiquidRippleButton.displayName = "LiquidRippleButton";

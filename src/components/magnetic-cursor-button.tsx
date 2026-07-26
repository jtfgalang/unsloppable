"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface MagneticCursorButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  /** Maximum shell travel in pixels. */
  pull?: number;
  /** Diameter of the cursor follower in pixels. */
  cursorSize?: number;
}

export const MagneticCursorButton = React.forwardRef<HTMLButtonElement, MagneticCursorButtonProps>(
  ({ className, children, pull = 16, cursorSize = 26, onPointerMove, onPointerEnter, onPointerLeave, type = "button", ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLButtonElement);
    const reduced = useSafeReducedMotion();
    const [inside, setInside] = React.useState(false);
    const rawX = useMotionValue(0); const rawY = useMotionValue(0);
    const cursorX = useSpring(rawX, { stiffness: 480, damping: 30, mass: 0.25 });
    const cursorY = useSpring(rawY, { stiffness: 480, damping: 30, mass: 0.25 });
    const shellX = useSpring(useMotionValue(0), { stiffness: 210, damping: 24, mass: 0.5 });
    const shellY = useSpring(useMotionValue(0), { stiffness: 210, damping: 24, mass: 0.5 });
    const reset = () => { setInside(false); rawX.set(0); rawY.set(0); shellX.set(0); shellY.set(0); };
    return (
      <motion.button ref={localRef} type={type} className={cn("relative inline-flex min-h-14 min-w-52 cursor-none items-center justify-between overflow-hidden rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:border-white/15 dark:bg-neutral-950 dark:text-white", className)} style={reduced ? undefined : { x: shellX, y: shellY }} onPointerEnter={(event) => { onPointerEnter?.(event); if (!reduced && event.pointerType !== "touch") setInside(true); }} onPointerMove={(event) => { onPointerMove?.(event); if (reduced || event.pointerType === "touch") return; const bounds = localRef.current?.getBoundingClientRect(); if (!bounds) return; const x = event.clientX - bounds.left - bounds.width / 2; const y = event.clientY - bounds.top - bounds.height / 2; rawX.set(x); rawY.set(y); shellX.set((x / bounds.width) * pull); shellY.set((y / bounds.height) * pull); }} onPointerLeave={(event) => { onPointerLeave?.(event); reset(); }} whileTap={reduced ? undefined : { scale: 0.96 }} {...props}>
        <span>{children}</span><span aria-hidden>↗</span>
        <motion.span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-neutral-950 mix-blend-difference dark:bg-white" style={{ width: cursorSize, height: cursorSize, x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }} animate={reduced ? undefined : { scale: inside ? 1 : 0, opacity: inside ? 1 : 0 }} transition={reduced ? undefined : { type: "spring", stiffness: 360, damping: 24 }} />
      </motion.button>
    );
  },
);
MagneticCursorButton.displayName = "MagneticCursorButton";

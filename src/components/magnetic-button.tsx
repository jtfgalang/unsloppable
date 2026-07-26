"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import { OPEN_UI_MOTION } from "./motion-tokens";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface MagneticButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  /** Fraction of pointer distance applied to the button shell. */
  strength?: number;
  /** Maximum distance in pixels at which the magnetic pull engages. */
  radius?: number;
  /** Additional pointer pull applied to the label for parallax depth. */
  childStrength?: number;
}

export const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ className, children, strength = OPEN_UI_MOTION.magneticStrength, radius = OPEN_UI_MOTION.magneticRadius, childStrength = OPEN_UI_MOTION.magneticChildStrength, onPointerMove, onPointerLeave, type = "button", ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLButtonElement);
    const reduced = useSafeReducedMotion();
    const shellX = useMotionValue(0);
    const shellY = useMotionValue(0);
    const labelX = useMotionValue(0);
    const labelY = useMotionValue(0);
    const spring = { stiffness: 240, damping: 22, mass: 0.45 } as const;
    const x = useSpring(shellX, spring);
    const y = useSpring(shellY, spring);
    const childX = useSpring(labelX, spring);
    const childY = useSpring(labelY, spring);

    const reset = () => {
      shellX.set(0); shellY.set(0); labelX.set(0); labelY.set(0);
    };

    return (
      <motion.button
        ref={localRef}
        type={type}
        className={cn("oui-magnetic group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full bg-neutral-950 px-7 text-sm font-semibold text-white shadow-[0_16px_45px_-18px_rgba(0,0,0,.75)] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:pointer-events-none disabled:opacity-45", className)}
        style={reduced ? undefined : { x, y }}
        whileTap={reduced ? undefined : { scale: 0.95 }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          if (reduced || event.pointerType === "touch") return;
          const bounds = localRef.current?.getBoundingClientRect();
          if (!bounds) return;
          const dx = event.clientX - bounds.left - bounds.width / 2;
          const dy = event.clientY - bounds.top - bounds.height / 2;
          if (Math.hypot(dx, dy) > radius) return reset();
          shellX.set(dx * strength); shellY.set(dy * strength);
          labelX.set(dx * childStrength); labelY.set(dy * childStrength);
        }}
        onPointerLeave={(event) => { onPointerLeave?.(event); reset(); }}
        {...props}
      >
        <motion.span className="relative z-10" style={reduced ? undefined : { x: childX, y: childY }}>{children}</motion.span>
      </motion.button>
    );
  },
);
MagneticButton.displayName = "MagneticButton";

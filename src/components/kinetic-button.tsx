"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

type KineticButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  strength?: number;
};

export function KineticButton({ children, className, strength = 12, onPointerMove, onPointerLeave, type = "button", ...props }: KineticButtonProps) {
  const reduceMotion = useHydratedReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 320, damping: 24, mass: 0.45 });
  const y = useSpring(useMotionValue(0), { stiffness: 320, damping: 24, mass: 0.45 });

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(event);
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * strength);
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * strength);
  };
  const leave = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(event);
    x.set(0);
    y.set(0);
  };

  return <motion.button type={type} className={`oui-kinetic-button ${className ?? ""}`} style={{ x, y }} onPointerMove={move} onPointerLeave={leave} whileTap={reduceMotion ? undefined : { scale: 0.97 }} {...props}>
    <span>{children}</span><i aria-hidden="true">↗</i>
  </motion.button>;
}

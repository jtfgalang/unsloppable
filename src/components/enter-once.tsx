"use client";

import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

type EnterOnceProps = HTMLMotionProps<"div"> & {
  distance?: number;
  delay?: number;
  amount?: number;
};

export function EnterOnce({ children, className, distance = 18, delay = 0, amount = 0.35, ...props }: EnterOnceProps) {
  const reduceMotion = useHydratedReducedMotion();
  return <motion.div
    className={`oui-enter-once ${className ?? ""}`}
    initial={reduceMotion ? false : { opacity: 0, y: distance }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount }}
    transition={reduceMotion ? { duration: 0 } : { delay, duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
    {...props}
  >{children}</motion.div>;
}

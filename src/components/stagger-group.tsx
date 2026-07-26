"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

type StaggerGroupProps = {
  children: ReactNode[];
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
};

export function StaggerGroup({ children, className, stagger = 0.08, delay = 0, amount = 0.25 }: StaggerGroupProps) {
  const reduceMotion = useHydratedReducedMotion();
  const container = { hidden: {}, visible: { transition: { delayChildren: delay, staggerChildren: reduceMotion ? 0 : stagger } } };
  const item = reduceMotion ? { hidden: {}, visible: {} } : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } };
  return <motion.div className={`oui-stagger-group ${className ?? ""}`} variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount }}>
    {children.map((child, index) => <motion.div className="oui-stagger-group__item" variants={item} key={index}>{child}</motion.div>)}
  </motion.div>;
}

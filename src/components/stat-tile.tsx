"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

type StatTileProps = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  source?: string;
  className?: string;
};

export function StatTile({ label, value, prefix = "", suffix = "", trend, source, className }: StatTileProps) {
  const reduceMotion = useHydratedReducedMotion();
  const count = useMotionValue(reduceMotion ? value : 0);
  const display = useTransform(count, (current) => `${prefix}${Math.round(current).toLocaleString()}${suffix}`);
  useEffect(() => {
    const controls = animate(count, value, { duration: reduceMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [count, reduceMotion, value]);
  return <div className={`oui-stat-tile ${className ?? ""}`}><span>{label}</span><div><motion.strong>{display}</motion.strong>{trend !== undefined && <em className={trend < 0 ? "down" : "up"}>{trend > 0 ? "+" : ""}{trend}%</em>}</div>{source && <small>{source}</small>}</div>;
}

"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export type GooeyReaction = { id: string; emoji: string; label: string };
export interface GooeyReactionBarProps extends Omit<HTMLMotionProps<"div">, "children" | "onChange"> {
  /** Available reactions. */
  reactions?: GooeyReaction[];
  /** Controlled selected reaction. */
  value?: string;
  /** Initial reaction when uncontrolled. */
  defaultValue?: string;
  /** Called when a reaction is selected. */
  onValueChange?: (id: string) => void;
}

const defaults: GooeyReaction[] = [
  { id: "sharp", emoji: "✦", label: "Sharp" },
  { id: "useful", emoji: "↑", label: "Useful" },
  { id: "love", emoji: "♥", label: "Love" },
  { id: "bold", emoji: "●", label: "Bold" },
];

export const GooeyReactionBar = React.forwardRef<HTMLDivElement, GooeyReactionBarProps>(
  ({ className, reactions = defaults, value, defaultValue, onValueChange, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue);
    const reduced = useSafeReducedMotion();
    const selected = value ?? internal;
    const choose = (id: string) => { if (value === undefined) setInternal(id); onValueChange?.(id); };
    const filterId = React.useId().replaceAll(":", "");
    return (
      <motion.div ref={ref} role="toolbar" aria-label="Reactions" className={cn("relative inline-flex items-center gap-1 rounded-full bg-neutral-950 p-2 text-white dark:bg-white dark:text-neutral-950", className)} style={reduced ? undefined : { filter: `url(#${filterId})` }} {...props}>
        <svg aria-hidden className="absolute size-0"><filter id={filterId}><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" /><feComposite in="SourceGraphic" in2="goo" operator="atop" /></filter></svg>
        {reactions.map((reaction) => <motion.button key={reaction.id} type="button" aria-label={reaction.label} aria-pressed={selected === reaction.id} className="relative grid size-10 place-items-center rounded-full bg-neutral-800 text-base outline-none focus-visible:ring-2 focus-visible:ring-white dark:bg-neutral-200 dark:focus-visible:ring-neutral-950" onClick={() => choose(reaction.id)} animate={{ scale: selected === reaction.id ? 1.18 : 1, y: selected === reaction.id ? -4 : 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 20 }}>{reaction.emoji}</motion.button>)}
      </motion.div>
    );
  },
);
GooeyReactionBar.displayName = "GooeyReactionBar";

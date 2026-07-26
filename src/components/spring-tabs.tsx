"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface SpringTab { id: string; label: React.ReactNode }
export interface SpringTabsProps extends Omit<HTMLMotionProps<"div">, "children" | "onChange"> {
  /** Tab ids and visible labels. */
  tabs?: SpringTab[];
  /** Initial selection when uncontrolled. */
  defaultTab?: string;
  /** Controlled selection. */
  value?: string;
  /** Called when a tab is requested. */
  onValueChange?: (id: string) => void;
  /** Optional shared-layout namespace. A per-instance id is used by default. */
  layoutGroupId?: string;
}

export const SpringTabs = React.forwardRef<HTMLDivElement, SpringTabsProps>(
  ({ tabs = [], defaultTab, value, onValueChange, layoutGroupId, className, ...props }, ref) => {
    const generatedId = React.useId();
    const groupId = layoutGroupId ?? generatedId;
    const reduced = useSafeReducedMotion();
    const [internal, setInternal] = React.useState(defaultTab ?? tabs[0]?.id);
    const active = value ?? internal;
    const select = (id: string) => { if (value === undefined) setInternal(id); onValueChange?.(id); };
    const moveFocus = (currentIndex: number, direction: number) => {
      if (tabs.length === 0) return;
      const next = (currentIndex + direction + tabs.length) % tabs.length;
      select(tabs[next]?.id ?? "");
    };

    return <motion.div ref={ref} role="tablist" className={cn("oui-tabs relative inline-flex items-center gap-1 rounded-2xl border border-neutral-200 bg-neutral-100 p-1.5", className)} {...props}>
      {tabs.map((tab, index) => {
        const selected = tab.id === active;
        return <button key={tab.id} type="button" role="tab" aria-selected={selected} tabIndex={selected || active === undefined ? 0 : -1} onClick={() => select(tab.id)} onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); moveFocus(index, 1); }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); moveFocus(index, -1); }
        }} className="oui-tab relative rounded-xl px-4 py-2 text-sm font-medium text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500">
          {selected && <motion.span layoutId={`${groupId}-pill`} className="oui-tab-active absolute inset-0 rounded-xl bg-white shadow-[0_5px_16px_-7px_rgba(0,0,0,.35)]" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30, mass: 0.55 }} />}
          <span className={cn("relative z-10", selected && "text-neutral-950")}>{tab.label}</span>
        </button>;
      })}
    </motion.div>;
  },
);
SpringTabs.displayName = "SpringTabs";

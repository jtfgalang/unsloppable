"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type HTMLMotionProps, type MotionValue } from "motion/react";
import { cn } from "../lib/utils";

const DEFAULT_SIZE = 44;
const DEFAULT_MAGNIFICATION = 76;
const DEFAULT_DISTANCE = 132;
const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

type DockConfig = { mouseX: MotionValue<number>; iconSize: number; magnification: number; distance: number; reduced: boolean };
const DockContext = React.createContext<DockConfig | null>(null);

export interface DockProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  /** Resting icon size in pixels. */
  iconSize?: number;
  /** Peak icon size beneath the pointer. */
  magnification?: number;
  /** Horizontal falloff distance in pixels. */
  distance?: number;
}

export const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ className, children, iconSize = DEFAULT_SIZE, magnification = DEFAULT_MAGNIFICATION, distance = DEFAULT_DISTANCE, onPointerMove, onPointerLeave, ...props }, ref) => {
    const mouseX = useMotionValue(Infinity);
    const reduced = useSafeReducedMotion();
    const config = React.useMemo(() => ({ mouseX, iconSize, magnification, distance, reduced }), [mouseX, iconSize, magnification, distance, reduced]);
    return <DockContext.Provider value={config}><motion.div ref={ref} className={cn("oui-dock mx-auto flex h-20 items-end gap-2 rounded-[22px] border border-neutral-200 bg-white/85 px-3 pb-3 shadow-[0_18px_50px_-22px_rgba(0,0,0,.45)] backdrop-blur-xl", className)} onPointerMove={(event) => { onPointerMove?.(event); if (!reduced && event.pointerType !== "touch") mouseX.set(event.clientX); }} onPointerLeave={(event) => { onPointerLeave?.(event); mouseX.set(Infinity); }} {...props}>{children}</motion.div></DockContext.Provider>;
  },
);
Dock.displayName = "Dock";

export interface DockIconProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  /** Per-icon resting size override. */
  iconSize?: number;
  /** Per-icon peak size override. */
  magnification?: number;
  /** Per-icon falloff distance override. */
  distance?: number;
}

export const DockIcon = React.forwardRef<HTMLDivElement, DockIconProps>(
  ({ className, children, iconSize, magnification, distance, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const context = React.useContext(DockContext);
    const localReduced = useSafeReducedMotion();
    const fallbackMouseX = useMotionValue(Infinity);
    const mouseX = context?.mouseX ?? fallbackMouseX;
    const base = iconSize ?? context?.iconSize ?? DEFAULT_SIZE;
    const peak = magnification ?? context?.magnification ?? DEFAULT_MAGNIFICATION;
    const falloff = distance ?? context?.distance ?? DEFAULT_DISTANCE;
    const reduced = context?.reduced ?? localReduced;
    const cursorDistance = useTransform(mouseX, (position) => {
      const bounds = localRef.current?.getBoundingClientRect();
      return bounds ? position - bounds.left - bounds.width / 2 : falloff + 1;
    });
    const target = useTransform(cursorDistance, [-falloff, 0, falloff], reduced ? [base, base, base] : [base, peak, base]);
    const size = useSpring(target, { stiffness: 230, damping: 18, mass: 0.42 });
    return <motion.div ref={localRef} className={cn("oui-dock-icon flex aspect-square shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-semibold text-white shadow-md", className)} style={{ width: size, height: size }} {...props}>{children}</motion.div>;
  },
);
DockIcon.displayName = "DockIcon";

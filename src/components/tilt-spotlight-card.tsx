"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import { OPEN_UI_MOTION } from "./motion-tokens";

const subscribe = () => () => undefined;
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return React.useSyncExternalStore(subscribe, () => true, () => false) && Boolean(reduced);
};

export interface TiltSpotlightCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  /** Maximum rotation in degrees on either axis. */
  maxTilt?: number;
  /** Color used by the pointer-tracked radial light. */
  spotlightColor?: string;
  /** Whether the pointer-tracked glare layer is rendered. */
  glare?: boolean;
  /** Z-axis lift applied to authored content in pixels. */
  contentDepth?: number;
}

export const TiltSpotlightCard = React.forwardRef<HTMLDivElement, TiltSpotlightCardProps>(
  ({ className, children, maxTilt = OPEN_UI_MOTION.maxTilt, spotlightColor = "rgba(255,255,255,.24)", glare = true, contentDepth = 36, onPointerMove, onPointerLeave, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useSafeReducedMotion();
    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    const spring = { stiffness: 170, damping: 22, mass: 0.5 } as const;
    const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), spring);
    const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), spring);
    const spotX = useTransform(px, (value) => `${value * 100}%`);
    const spotY = useTransform(py, (value) => `${value * 100}%`);
    const spotlight = useMotionTemplate`radial-gradient(circle at ${spotX} ${spotY}, ${spotlightColor}, transparent 62%)`;
    const reset = () => { px.set(0.5); py.set(0.5); };

    return <motion.div
      ref={localRef}
      className={cn("oui-tilt group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 p-7 text-white shadow-[0_32px_90px_-32px_rgba(0,0,0,.8)]", className)}
      style={reduced ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 900 }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (reduced || event.pointerType === "touch") return;
        const bounds = localRef.current?.getBoundingClientRect();
        if (!bounds || bounds.width === 0 || bounds.height === 0) return;
        px.set((event.clientX - bounds.left) / bounds.width);
        py.set((event.clientY - bounds.top) / bounds.height);
      }}
      onPointerLeave={(event) => { onPointerLeave?.(event); reset(); }}
      {...props}
    >
      <div className="relative z-10" style={reduced ? undefined : { transform: `translateZ(${contentDepth}px)` }}>{children}</div>
      {glare && <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={reduced ? undefined : { background: spotlight }} />}
    </motion.div>;
  },
);
TiltSpotlightCard.displayName = "TiltSpotlightCard";

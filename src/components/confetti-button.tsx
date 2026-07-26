"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useHydrated = () => React.useSyncExternalStore(subscribe, () => true, () => false);
const useSafeReducedMotion = () => {
  const reduced = useReducedMotion();
  return useHydrated() && Boolean(reduced);
};

/** Burst shapes. `cannon` fires an upward cone, `fireworks` a full sphere, `fountain` a tight jet. */
export type ConfettiPreset = "cannon" | "fireworks" | "fountain";

type PresetConfig = {
  particleCount: number;
  spread: number;
  startVelocity: number;
  gravity: number;
  /** Degrees, with -90 pointing straight up. */
  angle: number;
};

const PRESETS: Record<ConfettiPreset, PresetConfig> = {
  cannon: { particleCount: 90, spread: 105, startVelocity: 26, gravity: 0.42, angle: -90 },
  fireworks: { particleCount: 120, spread: 360, startVelocity: 21, gravity: 0.3, angle: -90 },
  fountain: { particleCount: 80, spread: 42, startVelocity: 33, gravity: 0.52, angle: -90 },
};

/** Classic party palette. Pass `colors` to swap it for a brand set. */
export const CONFETTI_CLASSIC_COLORS = [
  "#FF3B5C",
  "#FF9F1C",
  "#FFD23F",
  "#2EC4B6",
  "#3A86FF",
  "#8338EC",
  "#FF5FA2",
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  tilt: number;
  vtilt: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
  life: number;
};

export interface ConfettiButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  children?: React.ReactNode;
  /** Shown while the button holds its success state. */
  successLabel?: React.ReactNode;
  /** How long the success state holds before easing back, in ms. */
  successDuration?: number;
  /** Burst shape. The individual knobs below override the preset. */
  preset?: ConfettiPreset;
  particleCount?: number;
  /** Cone width in degrees. */
  spread?: number;
  startVelocity?: number;
  gravity?: number;
  colors?: string[];
  /** Fire once on mount so the effect is seen without a click, then stay interactive. */
  autoFire?: boolean;
  /** Delay before the auto fire, in ms. */
  autoFireDelay?: number;
  /** Called as each burst begins. */
  onCelebrate?: () => void;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <path
        d="m3.5 8.4 3 3 6-6.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A success action that emits a real confetti burst.
 *
 * Particles run on a fixed, pointer-events-none canvas portalled to the body, so
 * they are never clipped by an ancestor's overflow and fall across the page the
 * way physical confetti would. Each piece carries its own velocity, gravity,
 * spin, and tilt, and the tilt is drawn as a vertical squash so the paper reads
 * as tumbling rather than sliding.
 *
 * The button morphs to a success state and eases back, so a single press shows
 * the whole interaction. Both labels stay mounted in one grid cell, which keeps
 * the button's width fixed across the swap.
 */
export const ConfettiButton = React.forwardRef<HTMLButtonElement, ConfettiButtonProps>(
  function ConfettiButton(
    {
      className,
      children = "Celebrate",
      successLabel = "Done",
      successDuration = 1900,
      preset = "cannon",
      particleCount,
      spread,
      startVelocity,
      gravity,
      colors = CONFETTI_CLASSIC_COLORS,
      autoFire = false,
      autoFireDelay = 550,
      onCelebrate,
      onClick,
      type = "button",
      ...props
    },
    forwardedRef,
  ) {
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const particlesRef = React.useRef<Particle[]>([]);
    const rafRef = React.useRef<number | null>(null);
    const lastRef = React.useRef(0);
    const resetRef = React.useRef<number | null>(null);
    const [active, setActive] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const hydrated = useHydrated();
    const reduced = useSafeReducedMotion();

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const config = React.useMemo(() => {
      const base = PRESETS[preset] ?? PRESETS.cannon;
      return {
        particleCount: Math.max(0, Math.round(particleCount ?? base.particleCount)),
        spread: spread ?? base.spread,
        startVelocity: startVelocity ?? base.startVelocity,
        gravity: gravity ?? base.gravity,
        angle: base.angle,
      };
    }, [preset, particleCount, spread, startVelocity, gravity]);

    const stop = React.useCallback(() => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }, []);

    React.useEffect(
      () => () => {
        stop();
        if (resetRef.current !== null) window.clearTimeout(resetRef.current);
      },
      [stop],
    );

    const seed = React.useCallback(() => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const palette = colors.length ? colors : CONFETTI_CLASSIC_COLORS;
      const next: Particle[] = [];

      for (let i = 0; i < config.particleCount; i += 1) {
        // Jitter across the cone so the edges do not band.
        const offset = (Math.random() - 0.5) * config.spread;
        const theta = ((config.angle + offset) * Math.PI) / 180;
        const speed = config.startVelocity * (0.55 + Math.random() * 0.65);
        const round = Math.random() < 0.22;
        const size = 6 + Math.random() * 5;
        next.push({
          x: originX + (Math.random() - 0.5) * rect.width * 0.6,
          y: originY,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.34,
          tilt: Math.random() * Math.PI * 2,
          vtilt: 0.1 + Math.random() * 0.14,
          w: round ? size * 0.62 : size,
          h: round ? size * 0.62 : size * (0.45 + Math.random() * 0.5),
          color: palette[Math.floor(Math.random() * palette.length)] ?? CONFETTI_CLASSIC_COLORS[0],
          round,
          life: 1,
        });
      }

      particlesRef.current = particlesRef.current.concat(next);
    }, [colors, config]);

    // Physics and paint. Runs only while particles are alive.
    React.useEffect(() => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const size = () => {
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      size();
      window.addEventListener("resize", size);
      lastRef.current = performance.now();

      const frame = (now: number) => {
        // Normalized to 60fps steps, so physics is frame-rate independent.
        const dt = Math.min(2.6, (now - lastRef.current) / 16.667);
        lastRef.current = now;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const alive: Particle[] = [];
        for (const p of particlesRef.current) {
          p.vy += config.gravity * dt;
          p.vx *= 0.992;
          p.vy *= 0.996;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vrot * dt;
          p.tilt += p.vtilt * dt;
          p.life -= 0.0075 * dt;

          if (p.life <= 0 || p.y - 40 > window.innerHeight) continue;
          alive.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          // A vertical squash reads as paper tumbling edge-on.
          ctx.scale(1, Math.cos(p.tilt));
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.32));
          ctx.fillStyle = p.color;
          if (p.round) {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
          ctx.restore();
        }

        particlesRef.current = alive;
        if (alive.length === 0) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          setActive(false);
          return;
        }
        rafRef.current = requestAnimationFrame(frame);
      };

      rafRef.current = requestAnimationFrame(frame);
      return () => {
        window.removeEventListener("resize", size);
        stop();
      };
    }, [active, config.gravity, stop]);

    const fire = React.useCallback(() => {
      onCelebrate?.();
      setSuccess(true);
      if (resetRef.current !== null) window.clearTimeout(resetRef.current);
      resetRef.current = window.setTimeout(() => setSuccess(false), successDuration);
      if (reduced) return;
      seed();
      setActive(true);
    }, [onCelebrate, reduced, seed, successDuration]);

    // One automatic press on mount so the effect is seen without interaction.
    React.useEffect(() => {
      if (!autoFire || !hydrated) return;
      const id = window.setTimeout(fire, autoFireDelay);
      return () => window.clearTimeout(id);
      // Intentionally fires once per mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFire, hydrated]);

    return (
      <>
        <button
          {...props}
          ref={setRefs}
          type={type}
          data-state={success ? "success" : "idle"}
          className={cn(
            "oui-confetti-btn relative inline-flex min-h-12 select-none items-center justify-center rounded-full px-7 text-sm font-semibold text-white outline-none",
            "bg-neutral-950 shadow-[0_1px_2px_rgba(0,0,0,.18),0_14px_30px_-14px_rgba(0,0,0,.55)]",
            "transition-[background-color,transform,box-shadow] duration-300 ease-out",
            "hover:-translate-y-px active:translate-y-0 active:scale-[.97]",
            "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
            "data-[state=success]:bg-emerald-600 data-[state=success]:shadow-[0_1px_2px_rgba(0,0,0,.18),0_16px_34px_-14px_rgba(5,150,105,.6)]",
            className,
          )}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) fire();
          }}
        >
          {/* Both labels share one grid cell, so the width never jumps on swap.
              The outgoing label clears out before the incoming one arrives, so
              the two never sit on top of each other as a half-opacity smudge. */}
          <span className="grid">
            <span
              className={cn(
                "col-start-1 row-start-1 ease-out",
                success
                  ? "-translate-y-2 opacity-0 transition-all duration-100"
                  : "translate-y-0 opacity-100 transition-all delay-100 duration-150",
              )}
            >
              {children}
            </span>
            <span
              aria-hidden={!success}
              className={cn(
                "col-start-1 row-start-1 flex items-center justify-center gap-2 ease-out",
                success
                  ? "translate-y-0 opacity-100 transition-all delay-100 duration-150"
                  : "translate-y-2 opacity-0 transition-all duration-100",
              )}
            >
              <CheckIcon />
              {successLabel}
            </span>
          </span>
        </button>

        {hydrated && active
          ? createPortal(
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-[9999] h-full w-full"
              />,
              document.body,
            )
          : null}
      </>
    );
  },
);

ConfettiButton.displayName = "ConfettiButton";

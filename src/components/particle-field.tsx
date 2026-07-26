"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface ParticleFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of particles. */
  count?: number;
  /** Particle color. Defaults to the current text color. */
  color?: string;
  /** Base drift cycle in seconds; each particle varies around it. */
  speed?: number;
  /** Maximum parallax shift in pixels as the pointer crosses the field. */
  parallax?: number;
}

/**
 * An ambient field of fine particles that drift slowly and lean a few pixels
 * toward the pointer as a parallax whole. Positions, sizes, and drift phases
 * derive from each particle's index, so the server and client render the same
 * field with no hydration flicker and no random jump on mount.
 *
 * Drift is a CSS keyframe and the parallax is a CSS variable, so neither
 * triggers a React render, and a hidden tab leaves the field intact rather than
 * frozen mid-jump. Under reduced motion the particles are present but still.
 */
export const ParticleField = React.forwardRef<HTMLDivElement, ParticleFieldProps>(
  ({ className, count = 48, color = "currentColor", speed = 14, parallax = 18, style, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();

    // The field is pointer-events:none so it never blocks the content it sits
    // behind — which also means it cannot receive its own pointer events. So the
    // parallax listens on the window and reacts whenever the pointer is over the
    // field's box.
    React.useEffect(() => {
      const node = localRef.current;
      if (!node || reduced) return;
      const onMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        const bounds = node.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) return;
        const withinX = (event.clientX - bounds.left) / bounds.width;
        const withinY = (event.clientY - bounds.top) / bounds.height;
        const inside = withinX >= -0.15 && withinX <= 1.15 && withinY >= -0.15 && withinY <= 1.15;
        node.style.setProperty("--oui-particle-px", inside ? `${(withinX - 0.5) * 2}` : "0");
        node.style.setProperty("--oui-particle-py", inside ? `${(withinY - 0.5) * 2}` : "0");
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }, [reduced]);

    const particles = React.useMemo(
      () => Array.from({ length: Math.max(0, count) }, (_, index) => {
        const x = ((index * 0.61803398875) % 1) * 100;
        const y = ((index * 0.75487766625) % 1) * 100;
        const size = 1 + ((index * 0.271) % 1) * 2.2;
        const depth = 0.35 + ((index * 0.393) % 1) * 0.65;
        const duration = speed * (0.6 + ((index * 0.517) % 1) * 0.7);
        const delay = -((index * 0.813) % 1) * duration;
        const drift = 14 + ((index * 0.147) % 1) * 26;
        return { x, y, size, depth, duration, delay, drift, index };
      }),
      [count, speed],
    );

    return (
      <div
        ref={localRef}
        data-open-ui="particle-field"
        aria-hidden="true"
        className={cn("oui-particle-field", className)}
        style={{ "--oui-particle-color": color, "--oui-particle-parallax": `${parallax}px`, ...style } as React.CSSProperties}
        {...props}
      >
        {particles.map((particle) => (
          <span
            key={particle.index}
            className="oui-particle-field__dot"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.depth * 0.7,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              "--oui-particle-depth": particle.depth,
              "--oui-particle-drift": `${particle.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  },
);
ParticleField.displayName = "ParticleField";

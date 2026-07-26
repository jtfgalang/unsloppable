import * as React from "react";
import { cn } from "../lib/utils";

export interface ShootingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of streaks in flight across one cycle. */
  count?: number;
  /** Travel angle in degrees; 45 falls toward the lower right. */
  angle?: number;
  /** Seconds for one streak to cross. */
  duration?: number;
  /** Streak color. Defaults to a soft white. */
  color?: string;
  /** Length of the tail in pixels. */
  trailLength?: number;
}

/**
 * A quiet field of shooting stars: a bright head pulling a tapering tail across
 * the surface at a shared angle, each streak on its own staggered, deterministic
 * schedule. This is the restrained reading of a meteor shower — a few crossings
 * at a time rather than a storm.
 *
 * Start positions and delays derive from the streak index, so the server and
 * client render identically with no hydration flicker. The animation is pure
 * CSS; under reduced motion the field is empty and still.
 */
export const ShootingStars = React.forwardRef<HTMLDivElement, ShootingStarsProps>(
  ({ className, count = 8, angle = 42, duration = 3.2, color = "rgba(255,255,255,.92)", trailLength = 120, style, ...props }, ref) => {
    const streaks = Array.from({ length: Math.max(0, count) }, (_, index) => {
      // Deterministic spread: golden-ratio hop keeps starts from clustering.
      const hop = (index * 0.618034) % 1;
      const startX = -12 + hop * 118;
      const startY = -10 - ((index * 0.382) % 1) * 24;
      const delay = -(index / Math.max(1, count)) * duration - hop * duration;
      const scale = 0.7 + ((index * 0.271) % 1) * 0.6;
      return { startX, startY, delay, scale, index };
    });

    return (
      <div
        ref={ref}
        data-open-ui="shooting-stars"
        aria-hidden="true"
        className={cn("oui-shooting-stars", className)}
        style={{ "--oui-star-angle": `${angle}deg`, "--oui-star-color": color, "--oui-star-trail": `${trailLength}px`, ...style } as React.CSSProperties}
        {...props}
      >
        {streaks.map((streak) => (
          <span
            key={streak.index}
            className="oui-shooting-stars__streak"
            style={{
              left: `${streak.startX}%`,
              top: `${streak.startY}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${streak.delay}s`,
              "--oui-star-scale": streak.scale,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  },
);
ShootingStars.displayName = "ShootingStars";

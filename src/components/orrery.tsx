import * as React from "react";
import { cn } from "../lib/utils";

export type OrbitItem = {
  /** Node content: an icon, initial, or short glyph. */
  node: React.ReactNode;
  /** Fraction (0-1) around the orbit where the body starts. Defaults to even spacing. */
  at?: number;
  /** Give this body a soft accent glow and pulse ring. */
  pulse?: boolean;
};

export type OrbitRing = {
  /** Orbit radius in pixels, measured in the orbital plane. */
  radius: number;
  /** Seconds for one revolution. Defaults to a period derived from the radius. */
  duration?: number;
  /** Reverse the direction of travel. */
  reverse?: boolean;
  items: readonly OrbitItem[];
};

export interface OrreryProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orbits drawn from the centre outward. */
  rings: readonly OrbitRing[];
  /** Content pinned at the centre. */
  center?: React.ReactNode;
  /** Overall diameter in pixels. Defaults to fit the widest orbit. */
  size?: number;
  /** Draw the faint orbit paths. */
  showPaths?: boolean;
  /** How far the orbital planes are tipped away from the screen, in degrees. 0 is plan view, 90 is edge on. */
  tilt?: number;
}

/** Period of the innermost orbit in seconds; everything else is scaled off it. */
const BASE_PERIOD = 15;

/**
 * A clockwork model: bodies on real ellipses around a common centre.
 *
 * Two things separate this from a rotating div, and both are physics rather than
 * decoration.
 *
 * The ellipses are honest. Each orbit is a true circle living in a plane that is
 * tipped away from the screen, and a tipped circle under a perspective camera
 * projects to an ellipse. Drawing a flat ellipse instead would force every body
 * to shear as it travelled, because an anisotropic scale cannot be undone by a
 * rotation. Here the whole scene is one `preserve-3d` context, so a body in
 * front of the hub genuinely occludes it, a body behind it is genuinely hidden,
 * and near bodies are larger than far ones without a single extra animation.
 *
 * The speeds are honest. Kepler's third law puts the period at the three-halves
 * power of the radius, so an outer orbit is not merely slower, it is slower by
 * the right amount. A shared angular velocity is the exact tell that a ring of
 * icons is one spinning element, and this is the cheapest way to lose it.
 *
 * The motion is two CSS rotations per body, one on the orbit and one cancelling
 * it so the glyph stays upright. There is no per-frame JavaScript, nothing to
 * desync, and a hidden tab resumes at the correct phase. At rest every body sits
 * at its authored position on a drawn path, which is a composed diagram rather
 * than a stalled animation.
 *
 * Decorative throughout; give meaningful bodies their own labels.
 */
export const Orrery = React.forwardRef<HTMLDivElement, OrreryProps>(
  ({ className, rings, center, size, showPaths = true, tilt = 58, style, ...props }, ref) => {
    const maxRadius = rings.reduce((max, ring) => Math.max(max, ring.radius), 0);
    const innerRadius = rings.reduce((min, ring) => Math.min(min, ring.radius), Infinity) || 1;
    const diameter = size ?? maxRadius * 2 + 56;

    return (
      <div
        ref={ref}
        data-open-ui="orrery"
        className={cn("oui-orrery", className)}
        style={{ width: diameter, height: diameter, ...style }}
        {...props}
      >
        {rings.map((ring, ringIndex) => {
          const duration = ring.duration ?? Math.round(BASE_PERIOD * (ring.radius / innerRadius) ** 1.5 * 10) / 10;
          // Real orbits are not coplanar. A few degrees of inclination and a turn
          // of the line of nodes per orbit is what stops concentric rings from
          // reading as one flat target.
          const planeTilt = Math.max(24, tilt - ringIndex * 3);
          const planeSwing = ringIndex * 9;
          const direction = ring.reverse ? "reverse" : "normal";
          const plane = `rotateZ(${planeSwing}deg) rotateX(${planeTilt}deg)`;

          return (
            <div
              key={ringIndex}
              className="oui-orrery__plane"
              aria-hidden="true"
              style={{ width: ring.radius * 2, height: ring.radius * 2, transform: plane }}
            >
              {showPaths ? <span className="oui-orrery__path" /> : null}
              <div className="oui-orrery__ring" style={{ animationDuration: `${duration}s`, animationDirection: direction }}>
                {ring.items.map((item, itemIndex) => {
                  const fraction = item.at ?? itemIndex / ring.items.length;
                  // The exact inverse of everything above this body: its own place on
                  // the orbit, the plane's inclination, and the plane's node. Undo one
                  // of the three and the glyph shears into an ellipse, which is what a
                  // ring of icons that only cancels the spin actually looks like.
                  const billboard = `rotateZ(${-fraction * 360}deg) rotateX(${-planeTilt}deg) rotateZ(${-planeSwing}deg)`;
                  return (
                    <span
                      key={itemIndex}
                      className="oui-orrery__slot"
                      style={{ transform: `rotate(${fraction * 360}deg) translateY(-${ring.radius}px)` }}
                    >
                      <span
                        className={cn("oui-orrery__node", item.pulse && "oui-orrery__node--pulse")}
                        style={{ animationDuration: `${duration}s`, animationDirection: direction, transform: billboard }}
                      >
                        {item.node}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
        {center ? <div className="oui-orrery__center">{center}</div> : null}
      </div>
    );
  },
);
Orrery.displayName = "Orrery";

import * as React from "react";
import { cn } from "../lib/utils";

export type TerraNode = {
  /** Latitude in degrees, -90 (south) to 90 (north). */
  lat: number;
  /** Longitude in degrees, -180 to 180. */
  lng: number;
  /** Slowly pulse this node to read as a live location. */
  pulse?: boolean;
  /** Optional short label rendered beside the node. */
  label?: string;
};

export interface TerraProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Diameter in pixels. */
  size?: number;
  /** Longitude rings forming the cage. */
  meridians?: number;
  /** Latitude rings forming the cage. */
  parallels?: number;
  /** Surface points that ride the rotation. */
  nodes?: readonly TerraNode[];
  /** Seconds for one full rotation. */
  duration?: number;
  /** Line and node color. Defaults to the current text color. */
  color?: string;
  /** Reverse the spin direction. */
  reverse?: boolean;
  /** Axial tilt in degrees. Earth's own obliquity is the default. */
  tilt?: number;
}

/** Coarse coastlines as [longitude, latitude] rings. Deliberately blunt: the grid below is ~830km a cell, so anything finer would be thrown away. */
type Ring = readonly (readonly [number, number])[];

const AFRICA: Ring = [
  [-17, 14], [-17, 21], [-10, 27], [-6, 36], [10, 37], [20, 32], [32, 31], [35, 23], [39, 15], [43, 11],
  [51, 12], [48, 5], [41, -2], [40, -10], [35, -20], [33, -26], [28, -33], [20, -34.5], [15, -27], [12, -18],
  [13, -6], [9, 0], [9, 4], [3, 6], [-4, 5], [-8, 4.5], [-13, 9],
];

const EURASIA: Ring = [
  [-9, 38], [-9, 43], [-1, 46], [-4, 48], [2, 51], [8, 54], [10, 57], [5, 60], [11, 64], [15, 68],
  [22, 70], [30, 70], [40, 68], [60, 70], [70, 72], [80, 74], [105, 77], [113, 74], [130, 72], [145, 72],
  [160, 69], [170, 66], [180, 65], [178, 62], [163, 58], [155, 55], [140, 52], [135, 45], [128, 40], [122, 38],
  [122, 31], [110, 20], [105, 10], [100, 6], [98, 10], [95, 16], [90, 22], [88, 20], [80, 12], [77, 8],
  [73, 18], [70, 22], [62, 25], [57, 26], [50, 29], [55, 23], [59, 22], [52, 17], [45, 13], [43, 17],
  [38, 22], [34, 28], [35, 31], [36, 36], [30, 36], [27, 38], [24, 40], [19, 41], [13, 45], [3, 43],
  [-1, 39], [-6, 36],
];

const NORTH_AMERICA: Ring = [
  [-168, 66], [-162, 70], [-140, 70], [-125, 70], [-115, 68], [-95, 68], [-94, 58], [-88, 56], [-80, 55], [-78, 60],
  [-78, 64], [-72, 62], [-65, 60], [-56, 52], [-66, 45], [-70, 42], [-75, 37], [-81, 31], [-80, 25], [-84, 30],
  [-94, 29], [-97, 26], [-97, 20], [-92, 18], [-88, 21], [-87, 16], [-83, 10], [-79, 9], [-85, 13], [-92, 15],
  [-96, 16], [-105, 20], [-110, 24], [-114, 28], [-117, 32], [-122, 37], [-124, 44], [-124, 48], [-130, 54], [-136, 58],
  [-145, 60], [-152, 58], [-160, 56], [-165, 60],
];

const SOUTH_AMERICA: Ring = [
  [-77, 1], [-75, 6], [-72, 11], [-62, 10], [-52, 5], [-44, -2], [-38, -5], [-35, -8], [-39, -16], [-42, -22],
  [-48, -26], [-54, -34], [-57, -38], [-62, -40], [-65, -45], [-68, -52], [-70, -55], [-74, -50], [-73, -42], [-71, -33],
  [-70, -23], [-75, -15], [-81, -6], [-80, 0],
];

const GREENLAND: Ring = [[-45, 60], [-20, 70], [-22, 76], [-35, 83], [-60, 80], [-55, 70], [-50, 64]];
const AUSTRALIA: Ring = [
  [114, -22], [113, -26], [115, -32], [118, -35], [129, -32], [138, -35], [141, -38], [147, -38], [150, -35], [153, -28],
  [146, -19], [142, -11], [136, -12], [132, -11], [129, -15], [122, -18],
];
const BRITAIN: Ring = [[-5, 50], [-3, 53], [-3, 58], [-5, 58], [-6, 55], [-6, 51]];
const JAPAN: Ring = [[130, 32], [136, 34], [141, 40], [142, 45], [140, 42], [135, 34], [131, 31]];
const MADAGASCAR: Ring = [[43, -13], [50, -15], [48, -25], [44, -21]];
const NEW_GUINEA: Ring = [[131, -1], [141, -3], [150, -9], [143, -9], [134, -8]];
const SUMATRA: Ring = [[95, 6], [99, 4], [106, -6], [102, -6], [97, 1]];
const BORNEO: Ring = [[109, 2], [117, 4], [118, -3], [110, -3]];
const NEW_ZEALAND: Ring = [[173, -35], [178, -38], [174, -41], [170, -46], [167, -46], [171, -41]];

const COASTS: readonly Ring[] = [
  AFRICA, EURASIA, NORTH_AMERICA, SOUTH_AMERICA, GREENLAND, AUSTRALIA,
  BRITAIN, JAPAN, MADAGASCAR, NEW_GUINEA, SUMATRA, BORNEO, NEW_ZEALAND,
];

/** Ray casting. Rings are authored well clear of the antimeridian, so no wrapping case exists. */
function inside(lng: number, lat: number, ring: Ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const LAT_STEP = 7.5;
const EQUATOR_CELLS = 48;

/**
 * The land grid, rasterised once when the module loads.
 *
 * Cells per band follow the cosine of the latitude, so the grid is roughly equal
 * area and the dots do not bunch into a knot at the poles. Nothing here depends
 * on a prop, so the whole set is a module constant and rendering it is a map over
 * frozen style objects rather than any geometry at render time.
 */
const LAND = (() => {
  const cells: React.CSSProperties[] = [];
  for (let band = 0; band < 180 / LAT_STEP; band += 1) {
    const lat = 90 - LAT_STEP * (band + 0.5);
    const count = Math.max(6, Math.round(EQUATOR_CELLS * Math.cos((lat * Math.PI) / 180)));
    for (let cell = 0; cell < count; cell += 1) {
      const lng = -180 + (360 * (cell + 0.5)) / count;
      // Antarctica is a cap rather than a coastline, and drawing it as one keeps
      // the southern ice from needing forty vertices to say "everything below here".
      if (lat > -62 && !COASTS.some((ring) => inside(lng, lat, ring))) continue;
      cells.push({ "--oui-o": Math.round(lng * 100) / 100, "--oui-a": Math.round(lat * 100) / 100 } as React.CSSProperties);
    }
  }
  return cells;
})();

/**
 * The earth, drawn.
 *
 * Every landmass is a plate laid tangent to the sphere at its own latitude and
 * longitude, `rotateY(lng) rotateX(-lat) translateZ(r)`, which is the real
 * spherical placement and not a projection of one. Three things fall out of that
 * for free, and they are what make it read as a globe rather than a spinning
 * circle:
 *
 *   the far side hides itself, because a plate turned away from you has no front
 *   face and `backface-visibility` culls it. No sorting, no masks, no maths.
 *
 *   the limb foreshortens, because a plate seen at a glancing angle collapses to
 *   a sliver on its own. Land compresses toward the edge exactly as a sphere's
 *   surface does.
 *
 *   the poles converge, because the grid carries fewer cells per band as the
 *   cosine of the latitude falls.
 *
 * The daylight mask is a fixed screen-space falloff rather than something that
 * turns with the globe, which is the correct physics: the sun does not orbit the
 * planet, so the terminator stays put and the earth rotates under it.
 *
 * A texture map or a WebGL sphere would both be easier and both are out. This
 * retints from `currentColor`, stays crisp at any size, adds no asset weight, and
 * ships as markup. There is no per-frame JavaScript at all: one composited CSS
 * rotation drives everything, so a hidden tab resumes at the right longitude and
 * reduced motion leaves a composed globe rather than a stalled one.
 *
 * Decorative; give meaningful nodes their own labels.
 */
export const Terra = React.forwardRef<HTMLDivElement, TerraProps>(
  ({ className, size = 340, meridians = 9, parallels = 5, nodes = [], duration = 26, color = "currentColor", reverse = false, tilt = 23.4, style, ...props }, ref) => {
    const radius = size / 2;

    const meridianRings = Array.from({ length: meridians }, (_, index) => (index * 180) / meridians);

    // Parallels are horizontal circles: radius shrinks toward the poles.
    const parallelRings = Array.from({ length: parallels }, (_, index) => {
      const latitude = -90 + ((index + 1) * 180) / (parallels + 1);
      const rad = (latitude * Math.PI) / 180;
      return { ringRadius: Math.cos(rad) * radius, offsetY: Math.sin(rad) * radius };
    });

    return (
      <div
        ref={ref}
        data-open-ui="terra"
        className={cn("oui-terra", className)}
        style={{
          width: size,
          height: size,
          "--oui-terra-color": color,
          "--oui-terra-duration": `${duration}s`,
          "--oui-terra-spin": reverse ? "reverse" : "normal",
          "--oui-terra-r": `${radius}px`,
          "--oui-terra-tilt": `${-tilt}deg`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <span className="oui-terra__rim" aria-hidden="true" />
        {/* The mask lives on this wrapper rather than on the sphere: a mask on an
            element that is itself `preserve-3d` flattens the whole scene. */}
        <div className="oui-terra__globe" aria-hidden="true">
          <div className="oui-terra__axis">
            <div className="oui-terra__sphere">
              {LAND.map((tile, index) => (
                <i key={`l${index}`} className="oui-terra__land" style={tile} />
              ))}
              {meridianRings.map((angle, index) => (
                <span key={`m${index}`} className="oui-terra__meridian" style={{ transform: `rotateY(${angle}deg)` }} />
              ))}
              {parallelRings.map((ring, index) => (
                <span
                  key={`p${index}`}
                  className="oui-terra__parallel"
                  style={{
                    width: ring.ringRadius * 2,
                    height: ring.ringRadius * 2,
                    transform: `translateY(${ring.offsetY}px) rotateX(90deg)`,
                  }}
                />
              ))}
              {nodes.map((node, index) => (
                <span
                  key={`n${index}`}
                  className={cn("oui-terra__node", node.pulse && "oui-terra__node--pulse")}
                  style={{ transform: `rotateY(${node.lng}deg) rotateX(${-node.lat}deg) translateZ(${radius}px)` }}
                >
                  {node.label ? <em className="oui-terra__label">{node.label}</em> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
Terra.displayName = "Terra";

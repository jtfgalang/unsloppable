import type { CSSProperties, HTMLAttributes } from "react";

type ConvergeProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Status line under the field. */
  label?: string;
  /** How many particles assemble the ring. */
  count?: number;
  /** Radius of the assembled ring in pixels. */
  radius?: number;
  /** One assemble-and-scatter cycle in seconds. */
  duration?: number;
  /** Accent for the particles. Defaults to the theme accent. */
  accent?: string;
};

const GOLDEN = 0.6180339887;

/**
 * Scattered particles that fly in, lock into a ring, hold, then disperse.
 *
 * Each particle carries its own scatter origin and ring seat as custom
 * properties, so one shared keyframe interpolates between two fixed points per
 * dot rather than needing an animation per particle. The scatter is derived from
 * the golden ratio instead of Math.random, which keeps server and client markup
 * identical. Reduced motion shows the ring already assembled.
 */
export function Converge({
  label = "Assembling your workspace",
  count = 44,
  radius = 70,
  duration = 3.4,
  accent,
  className,
  style,
  ...props
}: ConvergeProps) {
  const total = Math.max(8, Math.round(count));
  const particles = Array.from({ length: total }, (_, index) => {
    const angle = (index / total) * Math.PI * 2;
    const spread = 1.35 + ((index * GOLDEN) % 1) * 0.55;
    return {
      tx: Math.round(Math.cos(angle) * radius),
      ty: Math.round(Math.sin(angle) * radius),
      fx: Math.round(Math.cos(angle) * radius * spread),
      fy: Math.round(Math.sin(angle) * radius * spread),
      delay: ((index * GOLDEN) % 1) * 0.35,
    };
  });

  return <div
    {...props}
    role="status"
    aria-label={label}
    className={`oui-loader oui-converge ${className ?? ""}`.trim()}
    style={{
      ...style,
      "--oui-loader-duration": `${duration}s`,
      ...(accent ? { "--oui-loader-accent": accent } : {}),
    } as CSSProperties}
  >
    <div className="oui-converge__field" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          className="oui-converge__dot"
          key={index}
          style={{
            "--oui-tx": `${particle.tx}px`,
            "--oui-ty": `${particle.ty}px`,
            "--oui-fx": `${particle.fx}px`,
            "--oui-fy": `${particle.fy}px`,
            "--oui-delay": `${particle.delay.toFixed(3)}s`,
          } as CSSProperties}
        />
      ))}
      <span className="oui-converge__core" />
    </div>
    <span className="oui-converge__label" aria-hidden="true">{label}</span>
  </div>;
}

export default Converge;

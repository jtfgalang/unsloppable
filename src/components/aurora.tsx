import type { CSSProperties, HTMLAttributes } from "react";

type AuroraProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Status line under the ring. */
  label?: string;
  /** One fill cycle in seconds. */
  duration?: number;
  /** Accent for the mesh and ring. Defaults to the theme accent. */
  accent?: string;
};

/**
 * The calm one. A gradient mesh breathes behind a conic progress ring while a
 * single sheen crosses the field.
 *
 * The ring is a conic gradient whose sweep angle is a registered custom property,
 * so the progress interpolates as a real angle instead of stepping. Everything is
 * declarative CSS, which keeps the fill honest when the tab is backgrounded, and
 * reduced motion holds the ring complete.
 */
export function Aurora({
  label = "Preparing your review",
  duration = 3.6,
  accent,
  className,
  style,
  ...props
}: AuroraProps) {
  return <div
    {...props}
    role="status"
    aria-label={label}
    className={`oui-loader oui-aurora ${className ?? ""}`.trim()}
    style={{
      ...style,
      "--oui-loader-duration": `${duration}s`,
      ...(accent ? { "--oui-loader-accent": accent } : {}),
    } as CSSProperties}
  >
    <div className="oui-aurora__mesh" aria-hidden="true"><span /><span /><span /></div>
    <span className="oui-aurora__sheen" aria-hidden="true" />
    <div className="oui-aurora__stack" aria-hidden="true">
      <span className="oui-aurora__ring" />
      <span className="oui-aurora__label">{label}</span>
    </div>
  </div>;
}

export default Aurora;

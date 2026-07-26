import type { CSSProperties, HTMLAttributes } from "react";

type IrisProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Status line under the aperture. */
  label?: string;
  /** One open-and-close cycle in seconds. */
  duration?: number;
  /** Number of blade seams around the housing. */
  blades?: number;
  /** Accent for the aperture core. Defaults to the theme accent. */
  accent?: string;
};

/**
 * A camera aperture that twists open, holds, and closes again.
 *
 * The housing is a conic gradient of alternating blade faces that turns slowly
 * against the aperture, and the core is a hexagon that scales and rotates as it
 * opens, so the two motions read as one mechanism. Reduced motion leaves the
 * aperture open on its finished frame.
 */
export function Iris({
  label = "Opening",
  duration = 3,
  blades = 8,
  accent,
  className,
  style,
  ...props
}: IrisProps) {
  const count = Math.max(3, Math.round(blades));

  return <div
    {...props}
    role="status"
    aria-label={label}
    className={`oui-loader oui-iris ${className ?? ""}`.trim()}
    style={{
      ...style,
      "--oui-loader-duration": `${duration}s`,
      ...(accent ? { "--oui-loader-accent": accent } : {}),
    } as CSSProperties}
  >
    <div className="oui-iris__housing" aria-hidden="true">
      <span className="oui-iris__blades" />
      {Array.from({ length: count }, (_, index) => (
        <span className="oui-iris__seam" key={index} style={{ "--oui-rot": `${(360 / count) * index}deg` } as CSSProperties} />
      ))}
      <span className="oui-iris__core" />
    </div>
    <span className="oui-iris__label" aria-hidden="true">{label}</span>
  </div>;
}

export default Iris;

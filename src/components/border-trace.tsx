import type { CSSProperties, HTMLAttributes } from "react";

type BorderTraceProps = HTMLAttributes<HTMLDivElement> & {
  /** One full lap in seconds. */
  duration?: number;
  /** Trace color. Defaults to the inherited ink. */
  color?: string;
  /** Stroke width in pixels. */
  thickness?: number;
  /** Corner radius in pixels. Should match the surface it outlines. */
  radius?: number;
  /** Fraction of the perimeter the traveling segment covers. */
  segment?: number;
  /** Opacity of the resting outline the segment travels along. */
  trackOpacity?: number;
};

/**
 * A segment travels the real border path. The earlier version spun a conic
 * gradient behind a clipped box, which blurred at the corners and could not
 * follow a radius.
 *
 * `pathLength={1}` normalizes the perimeter so `segment` reads as a fraction of
 * it at any size. Both dash values are set as SVG attributes rather than CSS
 * custom properties: a bare number in a custom property resolves to `0.18px`,
 * which defeats the normalization and paints a sub-pixel dash.
 */
export function BorderTrace({
  children,
  className,
  duration = 4.8,
  color = "currentColor",
  thickness = 1.5,
  radius = 14,
  segment = 0.18,
  trackOpacity = 0.14,
  style,
  ...props
}: BorderTraceProps) {
  const inset = thickness / 2;
  const geometry = {
    x: inset,
    y: inset,
    width: `calc(100% - ${thickness}px)`,
    height: `calc(100% - ${thickness}px)`,
    rx: radius,
    ry: radius,
    pathLength: 1,
  } as const;

  return <div
    className={`oui-border-trace ${className ?? ""}`}
    style={{
      ...style,
      "--oui-trace-duration": `${duration}s`,
      "--oui-trace-color": color,
      "--oui-trace-thickness": `${thickness}px`,
      "--oui-trace-radius": `${radius}px`,
      "--oui-trace-track": trackOpacity,
    } as CSSProperties}
    {...props}
  >
    <svg className="oui-border-trace__line" aria-hidden="true">
      <rect {...geometry} className="oui-border-trace__track" />
      <rect {...geometry} className="oui-border-trace__runner" strokeDasharray={`${segment} ${1 - segment}`} />
    </svg>
    <div className="oui-border-trace__content">{children}</div>
  </div>;
}

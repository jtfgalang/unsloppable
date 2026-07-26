import type { CSSProperties, HTMLAttributes } from "react";

type EtchProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Status line under the mark. */
  label?: string;
  /** One draw cycle in seconds. */
  duration?: number;
  /** Accent for the stroke. Defaults to the theme accent. */
  accent?: string;
};

/**
 * A verification mark that draws itself: the ring travels first, the check
 * follows, then the disc behind them blooms once to confirm.
 *
 * Each path declares its own measured length as a custom property, so one shared
 * keyframe drives both strokes and the check simply runs the same timeline on a
 * delay. Reduced motion shows the finished, drawn mark.
 */
export function Etch({
  label = "Verifying the contract",
  duration = 3.2,
  accent,
  className,
  style,
  ...props
}: EtchProps) {
  return <div
    {...props}
    role="status"
    aria-label={label}
    className={`oui-loader oui-etch ${className ?? ""}`.trim()}
    style={{
      ...style,
      "--oui-loader-duration": `${duration}s`,
      ...(accent ? { "--oui-loader-accent": accent } : {}),
    } as CSSProperties}
  >
    <svg className="oui-etch__mark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle className="oui-etch__disc" cx="60" cy="60" r="46" />
      <circle className="oui-etch__ring" cx="60" cy="60" r="46" />
      <path className="oui-etch__check" d="M39 61.5 L53.5 76 L82 45" />
    </svg>
    <span className="oui-etch__label" aria-hidden="true">{label}</span>
  </div>;
}

export default Etch;

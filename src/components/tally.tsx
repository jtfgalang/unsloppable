import type { CSSProperties, HTMLAttributes } from "react";

type TallyProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Status line under the counter. */
  label?: string;
  /** One load cycle in seconds. */
  duration?: number;
  /** Accent for the fill. Defaults to the theme accent. */
  accent?: string;
};

/**
 * A full-bleed count-up preloader: the percentage is produced by an animated
 * registered custom property feeding a CSS counter, and the same timeline raises
 * a fill line through the numerals via `background-clip: text`.
 *
 * No JavaScript timer runs, so a backgrounded tab cannot strand the count
 * mid-way, and reduced motion resolves straight to the finished 100% state.
 */
export function Tally({
  label = "Loading your workspace",
  duration = 3.2,
  accent,
  className,
  style,
  ...props
}: TallyProps) {
  return <div
    {...props}
    role="status"
    aria-label={label}
    className={`oui-loader oui-tally ${className ?? ""}`.trim()}
    style={{
      ...style,
      "--oui-loader-duration": `${duration}s`,
      ...(accent ? { "--oui-loader-accent": accent } : {}),
    } as CSSProperties}
  >
    <div className="oui-tally__readout" aria-hidden="true">
      <span className="oui-tally__count" />
      <span className="oui-tally__unit">%</span>
    </div>
    <div className="oui-tally__rule" aria-hidden="true"><i /></div>
    <span className="oui-tally__status" aria-hidden="true">{label}</span>
  </div>;
}

export default Tally;

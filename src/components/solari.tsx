import type { CSSProperties, HTMLAttributes } from "react";

type SolariProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Word the board settles on. */
  word?: string;
  /** One flip cycle in seconds. */
  duration?: number;
  /** Accent for the board glow. Defaults to the theme accent. */
  accent?: string;
};

/**
 * A split-flap departure board that clacks into place one tile at a time.
 *
 * Each flap carries its index as a custom property, so the cascade is a single
 * shared keyframe with a per-tile delay rather than a timer per character. The
 * seam and the overshoot on settle are what sell it as mechanical; under reduced
 * motion the board is simply already showing its word.
 */
export function Solari({
  word = "LOADING",
  duration = 2.8,
  accent,
  className,
  style,
  ...props
}: SolariProps) {
  const characters = [...word.toUpperCase()];

  return <div
    {...props}
    role="status"
    aria-label={word}
    className={`oui-loader oui-solari ${className ?? ""}`.trim()}
    style={{
      ...style,
      "--oui-loader-duration": `${duration}s`,
      ...(accent ? { "--oui-loader-accent": accent } : {}),
    } as CSSProperties}
  >
    <div className="oui-solari__board" aria-hidden="true">
      {characters.map((character, index) => (
        character.trim() === ""
          ? <span className="oui-solari__gap" key={index} />
          : <span className="oui-solari__flap" key={index} style={{ "--oui-i": index } as CSSProperties}>
              <span className="oui-solari__char">{character}</span>
            </span>
      ))}
    </div>
  </div>;
}

export default Solari;

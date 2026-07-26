import type { HTMLAttributes } from "react";

type DotFieldProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  gap?: number;
  fade?: "center" | "edges" | "none";
};

export function DotField({ className, size = 1, gap = 18, fade = "edges", style, ...props }: DotFieldProps) {
  return <div aria-hidden="true" className={`oui-dot-field oui-dot-field--${fade} ${className ?? ""}`} style={{ ...style, "--oui-dot-size": `${size}px`, "--oui-dot-gap": `${gap}px` } as React.CSSProperties} {...props} />;
}


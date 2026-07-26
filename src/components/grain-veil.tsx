import type { HTMLAttributes } from "react";

type GrainVeilProps = HTMLAttributes<HTMLDivElement> & {
  strength?: number;
};

export function GrainVeil({ children, className, strength = 0.035, style, ...props }: GrainVeilProps) {
  return <div className={`oui-grain-veil ${className ?? ""}`} style={{ ...style, "--oui-grain-strength": strength } as React.CSSProperties} {...props}>
    {children}<span className="oui-grain-veil__texture" aria-hidden="true" />
  </div>;
}

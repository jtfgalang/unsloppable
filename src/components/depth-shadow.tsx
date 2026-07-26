import type { CSSProperties, HTMLAttributes } from "react";

type DepthShadowProps = HTMLAttributes<HTMLDivElement> & {
  depth?: "low" | "medium" | "high";
};

export function DepthShadow({ children, className, depth = "medium", ...props }: DepthShadowProps) {
  return <div className={`oui-depth-shadow oui-depth-shadow--${depth} ${className ?? ""}`} {...props}>{children}</div>;
}

export const depthShadowTokens: Record<NonNullable<DepthShadowProps["depth"]>, CSSProperties["boxShadow"]> = {
  low: "0 1px 1px #0000000a, 0 4px 12px #0000000d, 0 12px 24px #00000008",
  medium: "0 1px 1px #0000000a, 0 6px 18px #00000012, 0 22px 48px #00000012, 0 46px 96px #0000000a",
  high: "0 1px 1px #0000000d, 0 8px 24px #00000017, 0 28px 64px #0000001a, 0 64px 140px #00000012"
};

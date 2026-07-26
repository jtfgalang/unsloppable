"use client";

import type { HTMLAttributes, PointerEvent } from "react";

type SpotlightProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  color?: string;
};

export function Spotlight({ children, className, size = 320, color = "rgba(216, 255, 67, .2)", onPointerMove, ...props }: SpotlightProps) {
  const move = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--oui-spotlight-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--oui-spotlight-y", `${event.clientY - bounds.top}px`);
  };
  return <div className={`oui-spotlight ${className ?? ""}`} style={{ "--oui-spotlight-size": `${size}px`, "--oui-spotlight-color": color } as React.CSSProperties} onPointerMove={move} {...props}>{children}</div>;
}


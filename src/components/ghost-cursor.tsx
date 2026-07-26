"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface GhostCursorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Trailing dot size in pixels. */
  size?: number;
  /** 0 to 1. Lower lags further behind the pointer. */
  ease?: number;
  label?: string;
}

/**
 * A soft marker that trails the pointer inside one surface.
 *
 * The follow runs on a single rAF loop writing custom properties, not on React
 * state, so the trail never causes a render. The loop stops itself when the
 * pointer leaves and when the tab is hidden, which is what keeps an idle page
 * from burning frames forever.
 *
 * It is hidden entirely where there is no hover, since a trail no one can move
 * is just a dot in the corner.
 */
export const GhostCursor = React.forwardRef<HTMLDivElement, GhostCursorProps>(
  ({ className, children, size = 22, ease = 0.16, label, style, ...props }, ref) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);
    const target = React.useRef({ x: 0, y: 0 });
    const at = React.useRef({ x: 0, y: 0 });
    const raf = React.useRef<number | null>(null);

    const stop = React.useCallback(() => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    }, []);

    const run = React.useCallback(() => {
      const node = hostRef.current;
      if (!node) return;
      at.current.x += (target.current.x - at.current.x) * ease;
      at.current.y += (target.current.y - at.current.y) * ease;
      node.style.setProperty("--oui-ghost-x", `${at.current.x}px`);
      node.style.setProperty("--oui-ghost-y", `${at.current.y}px`);
      raf.current = requestAnimationFrame(run);
    }, [ease]);

    React.useEffect(() => stop, [stop]);

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-open-ui="ghost-cursor"
        className={cn("oui-ghost", className)}
        style={{ "--oui-ghost-size": `${size}px`, ...style } as React.CSSProperties}
        onPointerMove={(event) => {
          if (event.pointerType === "touch") return;
          const rect = event.currentTarget.getBoundingClientRect();
          target.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          if (raf.current === null) run();
        }}
        onPointerLeave={stop}
        {...props}
      >
        {children}
        <span className="oui-ghost__dot" aria-hidden="true" />
        {label ? <span className="oui-ghost__sr">{label}</span> : null}
      </div>
    );
  },
);
GhostCursor.displayName = "GhostCursor";

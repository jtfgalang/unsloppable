"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface RefractionHoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Lens radius in pixels. */
  size?: number;
  /** How far the content displaces under the lens. */
  strength?: number;
}

/**
 * A lens that follows the pointer and bends what is under it.
 *
 * Pointer position is written to custom properties rather than React state, so
 * moving the mouse never triggers a render: the whole effect stays on the
 * compositor. The lens is disabled for touch, where there is no hover to track,
 * and it is decorative, so the content underneath is never obscured for anyone
 * who cannot use it.
 */
export const RefractionHover = React.forwardRef<HTMLDivElement, RefractionHoverProps>(
  ({ className, children, size = 150, strength = 6, style, ...props }, ref) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);

    const track = (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      const node = hostRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--oui-refract-x", `${event.clientX - rect.left}px`);
      node.style.setProperty("--oui-refract-y", `${event.clientY - rect.top}px`);
    };

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-open-ui="refraction-hover"
        className={cn("oui-refract", className)}
        style={{ "--oui-refract-size": `${size}px`, "--oui-refract-strength": `${strength}px`, ...style } as React.CSSProperties}
        onPointerMove={track}
        {...props}
      >
        <div className="oui-refract__content">{children}</div>
        <span className="oui-refract__lens" aria-hidden="true" />
      </div>
    );
  },
);
RefractionHover.displayName = "RefractionHover";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ZoomLensProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  /** Magnification factor. */
  zoom?: number;
  /** Lens diameter in pixels. */
  size?: number;
}

/**
 * A magnifier that follows the pointer across an image.
 *
 * The lens is the same image scaled up with its background position slaved to
 * the cursor, so there is no second network request and no canvas. Position is
 * written to custom properties, so tracking never triggers a render.
 *
 * The underlying image keeps its alt text and stays fully visible; the lens is
 * an enhancement that simply does not appear without a pointer.
 */
export const ZoomLens = React.forwardRef<HTMLDivElement, ZoomLensProps>(
  ({ className, src, alt, zoom = 2.4, size = 160, style, ...props }, ref) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);

    const track = (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      const node = hostRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--oui-zoom-x", `${x}%`);
      node.style.setProperty("--oui-zoom-y", `${y}%`);
      node.style.setProperty("--oui-zoom-px", `${event.clientX - rect.left}px`);
      node.style.setProperty("--oui-zoom-py", `${event.clientY - rect.top}px`);
    };

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-open-ui="zoom-lens"
        className={cn("oui-zoom", className)}
        style={{ "--oui-zoom-size": `${size}px`, "--oui-zoom-scale": zoom, ...style } as React.CSSProperties}
        onPointerMove={track}
        {...props}
      >
        <img className="oui-zoom__image" src={src} alt={alt} draggable={false} />
        <span className="oui-zoom__lens" aria-hidden="true" style={{ backgroundImage: `url(${src})` }} />
      </div>
    );
  },
);
ZoomLens.displayName = "ZoomLens";

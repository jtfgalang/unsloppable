"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ParallaxLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Negative moves slower than the page, positive faster. */
  depth?: number;
}

/**
 * A layer that drifts against the scroll.
 *
 * Offset is written straight to a custom property from a passive scroll
 * listener, so React never re-renders while the page moves. The listener is
 * passive, which matters: a non-passive scroll handler blocks the browser's
 * compositor and turns a smooth page into a janky one.
 *
 * Reduced motion pins the layer flat rather than drifting it.
 */
export const ParallaxLayer = React.forwardRef<HTMLDivElement, ParallaxLayerProps>(
  ({ className, children, depth = -0.18, style, ...props }, ref) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      const node = hostRef.current;
      if (!node) return;
      let frame = 0;
      const update = () => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const middle = rect.top + rect.height / 2 - window.innerHeight / 2;
        node.style.setProperty("--oui-parallax-y", `${middle * depth}px`);
      };
      const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (frame) cancelAnimationFrame(frame);
      };
    }, [depth]);

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-open-ui="parallax-layer"
        className={cn("oui-parallax", className)}
        style={style}
        {...props}
      >
        <div className="oui-parallax__inner">{children}</div>
      </div>
    );
  },
);
ParallaxLayer.displayName = "ParallaxLayer";

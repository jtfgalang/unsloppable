"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export interface LumenProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Reach of the light in pixels, from its core to full falloff. */
  radius?: number;
  /** Colour of the light. Defaults to the accent role. */
  glowColor?: string;
}

/**
 * A card whose rim catches a point light that follows the pointer.
 *
 * The obvious build is one radial gradient sliding under a border mask, and it
 * always reads as decoration, because a real edge does not brighten by distance
 * alone. It brightens by how squarely it faces the lamp. So the rim carries the
 * two terms a diffuse surface actually has, and the CSS multiplies them:
 *
 *   distance   a fixed radial gradient, the lamp, translated to the pointer
 *   facing     a fixed cosine lobe, masked in, rotated to the pointer's bearing
 *
 * The second term is what makes the corners behave. A lamp held over the top
 * edge lights that edge hard, rakes each corner as the lobe swings past it, and
 * leaves the sides dark even where parts of them are no further away. The
 * surface bloom deliberately gets no facing term: a flat plane faces the viewer
 * everywhere, so distance is the whole story there.
 *
 * Neither gradient is ever re-authored from a custom property. Tracking the
 * pointer moves one element and turns another, both on the compositor, so a
 * frame of pointer motion costs zero repaints.
 */
export const Lumen = React.forwardRef<HTMLDivElement, LumenProps>(
  ({ className, children, radius = 260, glowColor = "var(--style-accent, #6d4aff)", style, onPointerMove, onPointerEnter, onPointerLeave, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();

    /** Cached geometry. Reading it flushes layout, so it is read once per hover, not once per event. */
    const box = React.useRef<{ left: number; top: number; width: number; height: number } | null>(null);
    const point = React.useRef({ x: 0, y: 0 });
    const frame = React.useRef(0);
    const lit = React.useRef(false);

    React.useEffect(() => {
      const node = localRef.current;
      if (!node) return;
      const invalidate = () => { box.current = null; };
      // Scrolling moves the card in viewport space without firing a resize, and a
      // stale left/top would offset the light by the scroll distance. The listener
      // only sets a flag, so it never touches layout itself.
      window.addEventListener("scroll", invalidate, { passive: true, capture: true });
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(invalidate);
      observer?.observe(node);
      return () => {
        window.removeEventListener("scroll", invalidate, true);
        observer?.disconnect();
        if (frame.current) cancelAnimationFrame(frame.current);
        frame.current = 0;
      };
    }, []);

    const paint = React.useCallback(() => {
      frame.current = 0;
      const node = localRef.current;
      if (!node) return;
      if (!box.current) {
        const rect = node.getBoundingClientRect();
        box.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        // The lobe is a square that has to still cover the card once it is turned,
        // so it is sized to the diagonal. Written on measure, never per frame.
        node.style.setProperty("--oui-lumen-span", `${Math.hypot(rect.width, rect.height) || 420}px`);
      }
      const { left, top, width, height } = box.current;
      const x = point.current.x - left;
      const y = point.current.y - top;
      const dx = x - width / 2;
      const dy = y - height / 2;
      node.style.setProperty("--oui-lumen-x", `${x}px`);
      node.style.setProperty("--oui-lumen-y", `${y}px`);
      // Bearing from the card's centre. The lobe is authored pointing along +X, so
      // turning it by this angle aims it at the pointer, and the lamp then only
      // ever slides along that one axis.
      node.style.setProperty("--oui-lumen-angle", `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`);
      node.style.setProperty("--oui-lumen-dist", `${Math.hypot(dx, dy)}px`);
    }, []);

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      if (reduced || event.pointerType === "touch") return;
      point.current.x = event.clientX;
      point.current.y = event.clientY;
      if (!lit.current) {
        // Cheap and rare, so it stays synchronous: the card should be lit on the
        // first event rather than one frame later.
        lit.current = true;
        localRef.current?.style.setProperty("--oui-lumen-active", "1");
        localRef.current?.setAttribute("data-lit", "");
      }
      // A high-poll pointer fires several times per frame. Coalescing to one
      // write per frame is the difference between four style invalidations and one.
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    };

    const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event);
      box.current = null;
    };

    const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      lit.current = false;
      const node = localRef.current;
      if (!node) return;
      // Removed rather than zeroed, so the stylesheet's resting and focus poses
      // are free to take over again. An inline "0" would outrank both.
      node.style.removeProperty("--oui-lumen-active");
      node.removeAttribute("data-lit");
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };

    return (
      <div
        ref={localRef}
        data-open-ui="lumen"
        className={cn("oui-lumen", className)}
        style={{ "--oui-lumen-radius": `${radius}px`, "--oui-lumen-color": glowColor, ...style } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <span className="oui-lumen__border" aria-hidden="true">
          <span className="oui-lumen__facing">
            <span className="oui-lumen__lamp" />
          </span>
        </span>
        <span className="oui-lumen__bloom" aria-hidden="true" />
        <div className="oui-lumen__content">{children}</div>
      </div>
    );
  },
);
Lumen.displayName = "Lumen";

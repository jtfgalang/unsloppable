"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export type DeviceFrameVariant = "browser" | "phone" | "tablet";

export type DeviceFrameTab = {
  label: string;
  /** Marks the foreground tab. The first tab is active when none is set. */
  active?: boolean;
};

export interface DeviceFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Address shown in the browser variant's location bar. */
  url?: string;
  theme?: "light" | "dark";
  /** Chrome to render around the content. */
  variant?: DeviceFrameVariant;
  /** Browser tab strip. Omit for a single-page browser. */
  tabs?: readonly DeviceFrameTab[];
  /** Pointer-tracked sheen across the screen. Off for touch and reduced motion. */
  glare?: boolean;
  /** Shows a loading sweep in the location bar and a progress line under it. */
  loading?: boolean;
}

/**
 * A neutral device shell — browser, phone, or tablet — that presents real
 * product content without fabricating interface details. The chrome is
 * decorative and hidden from assistive tech; embedded content keeps its own
 * semantics.
 *
 * The glare is pointer-driven and set through a CSS variable, so it never
 * triggers a React render. It is disabled for touch and reduced motion, where
 * the frame is simply a static, legible device.
 */
export const DeviceFrame = React.forwardRef<HTMLDivElement, DeviceFrameProps>(
  ({ className, children, url = "yourproduct.com", theme = "dark", variant = "browser", tabs, glare = true, loading = false, style, onPointerMove, onPointerLeave, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);
    const reduced = useHydratedReducedMotion();
    const glareOn = glare && !reduced;
    const activeIndex = Math.max(0, tabs?.findIndex((tab) => tab.active) ?? -1);

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      if (!glareOn || event.pointerType === "touch") return;
      const bounds = localRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width === 0) return;
      localRef.current?.style.setProperty("--oui-device-gx", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
      localRef.current?.style.setProperty("--oui-device-gy", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
      localRef.current?.style.setProperty("--oui-device-glare", "1");
    };

    const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      localRef.current?.style.setProperty("--oui-device-glare", "0");
    };

    return (
      <div
        ref={localRef}
        data-open-ui="device-frame"
        data-variant={variant}
        className={cn(`oui-device-frame oui-device-frame--${theme} oui-device-frame--${variant}`, className)}
        style={style}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        {variant === "browser" ? (
          <div className="oui-device-frame__chrome" aria-hidden="true">
            <header>
              <div className="oui-device-frame__dots"><i /><i /><i /></div>
              <span className="oui-device-frame__omni" data-loading={loading || undefined}>
                <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true"><path d="M8 1a4 4 0 0 0-4 4v2H3v7h10V7h-1V5a4 4 0 0 0-4-4Zm2 6H6V5a2 2 0 1 1 4 0v2Z" fill="currentColor" /></svg>
                {url}
                {loading ? <b className="oui-device-frame__sweep" /> : null}
              </span>
              <b>↗</b>
            </header>
            {tabs && tabs.length > 0 ? (
              <div className="oui-device-frame__tabs" role="presentation">
                {tabs.map((tab, index) => (
                  <span key={`${tab.label}-${index}`} data-active={index === activeIndex || undefined}>{tab.label}</span>
                ))}
              </div>
            ) : null}
            {loading ? <b className="oui-device-frame__progress" aria-hidden="true" /> : null}
          </div>
        ) : (
          <div className="oui-device-frame__status" aria-hidden="true">
            <span className="oui-device-frame__notch" />
          </div>
        )}

        <div className="oui-device-frame__viewport">{children}</div>

        {variant !== "browser" ? <span className="oui-device-frame__home" aria-hidden="true" /> : null}
        {glareOn ? <span className="oui-device-frame__sheen" aria-hidden="true" /> : null}
      </div>
    );
  },
);
DeviceFrame.displayName = "DeviceFrame";

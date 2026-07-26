"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SectionCurtainProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Edge the curtain lifts toward. */
  from?: "bottom" | "top";
  /** Replay whenever the section re-enters. */
  repeat?: boolean;
}

/**
 * A section revealed by a curtain lifting off it.
 *
 * The curtain is an overlay that slides away, not an opacity fade on the
 * content, so the content underneath is present and readable from first paint.
 * If the observer never fires or the animation is skipped, the section is simply
 * already open rather than stuck invisible.
 */
export const SectionCurtain = React.forwardRef<HTMLElement, SectionCurtainProps>(
  ({ className, children, from = "bottom", repeat = false, ...props }, ref) => {
    const hostRef = React.useRef<HTMLElement | null>(null);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      const node = hostRef.current;
      if (!node || typeof IntersectionObserver === "undefined") { setOpen(true); return; }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) { setOpen(true); if (!repeat) observer.unobserve(entry.target); }
          else if (repeat) setOpen(false);
        },
        { threshold: 0.25 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, [repeat]);

    return (
      <section
        ref={(node: HTMLElement | null) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        data-open-ui="section-curtain"
        data-open={open || undefined}
        data-from={from}
        className={cn("oui-curtain", className)}
        {...props}
      >
        {children}
        <span className="oui-curtain__sheet" aria-hidden="true" />
      </section>
    );
  },
);
SectionCurtain.displayName = "SectionCurtain";

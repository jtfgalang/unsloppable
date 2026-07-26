"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type CarouselSlide = { id: string; content: React.ReactNode };

export interface MomentumCarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  slides: readonly CarouselSlide[];
  label?: string;
  /** Show the dot indicators. */
  dots?: boolean;
}

/**
 * A carousel built on native scroll snapping.
 *
 * Momentum, touch, trackpad, and keyboard all come from the platform's own
 * overflow scrolling; the component only adds snap points and controls. A
 * transform-based carousel has to reimplement inertia and usually ships a worse
 * version of it that also breaks focus.
 *
 * Arrows scroll by one slide, the active dot tracks the real scroll position,
 * and every slide stays reachable by tab.
 */
export const MomentumCarousel = React.forwardRef<HTMLDivElement, MomentumCarouselProps>(
  ({ className, slides, label = "Gallery", dots = true, ...props }, ref) => {
    const trackRef = React.useRef<HTMLDivElement | null>(null);
    const [active, setActive] = React.useState(0);

    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const index = Math.round(track.scrollLeft / (track.clientWidth * 0.82));
      setActive(Math.max(0, Math.min(slides.length - 1, index)));
    };

    const go = (direction: -1 | 1) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollBy({ left: direction * track.clientWidth * 0.82, behavior: "smooth" });
    };

    return (
      <div ref={ref} data-open-ui="momentum-carousel" className={cn("oui-carousel", className)} {...props}>
        <div className="oui-carousel__track" ref={trackRef} onScroll={onScroll} tabIndex={0} role="group" aria-label={label}>
          {slides.map((slide) => (
            <div className="oui-carousel__slide" key={slide.id}>{slide.content}</div>
          ))}
        </div>

        <div className="oui-carousel__controls">
          <button type="button" aria-label="Previous" onClick={() => go(-1)} disabled={active === 0}>‹</button>
          {dots ? (
            <span className="oui-carousel__dots" aria-hidden="true">
              {slides.map((slide, index) => <i key={slide.id} data-on={index === active || undefined} />)}
            </span>
          ) : null}
          <button type="button" aria-label="Next" onClick={() => go(1)} disabled={active === slides.length - 1}>›</button>
        </div>
      </div>
    );
  },
);
MomentumCarousel.displayName = "MomentumCarousel";

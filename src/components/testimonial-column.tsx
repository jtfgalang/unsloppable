"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type Testimonial = { id: string; quote: string; name: string; role?: string; initials?: string };

export interface TestimonialColumnProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  testimonials: readonly Testimonial[];
  /** Scroll the column continuously. */
  drift?: boolean;
  /** One travel cycle in seconds. */
  duration?: number;
  label?: string;
}

/**
 * A column of quotes that drifts slowly upward.
 *
 * When drifting, the set is rendered twice and the track travels exactly half
 * its height, which is what makes the loop seamless. The duplicate is hidden
 * from assistive technology so each quote is announced once, and travel pauses
 * on hover and focus so a reader can actually finish one.
 */
export const TestimonialColumn = React.forwardRef<HTMLDivElement, TestimonialColumnProps>(
  ({ className, testimonials, drift = true, duration = 34, label = "What customers say", ...props }, ref) => {
    const card = (item: Testimonial, key: string) => (
      <figure className="oui-testicol__card" key={key}>
        <blockquote>{item.quote}</blockquote>
        <figcaption>
          <span className="oui-testicol__avatar" aria-hidden="true">{item.initials ?? item.name.slice(0, 1)}</span>
          <span>
            <strong>{item.name}</strong>
            {item.role ? <small>{item.role}</small> : null}
          </span>
        </figcaption>
      </figure>
    );

    return (
      <div
        ref={ref}
        data-open-ui="testimonial-column"
        data-drift={drift || undefined}
        className={cn("oui-testicol", className)}
        style={{ "--oui-testicol-duration": `${duration}s` } as React.CSSProperties}
        aria-label={label}
        {...props}
      >
        <div className="oui-testicol__track">{testimonials.map((item) => card(item, item.id))}</div>
        {drift ? (
          <div className="oui-testicol__track" aria-hidden="true">{testimonials.map((item) => card(item, `${item.id}-echo`))}</div>
        ) : null}
      </div>
    );
  },
);
TestimonialColumn.displayName = "TestimonialColumn";

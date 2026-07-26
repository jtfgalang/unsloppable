"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ContactShadowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Height the object sits above the ground, in pixels. */
  lift?: number;
  /** Shadow opacity at rest, 0 to 1. */
  opacity?: number;
  /** Rise further on hover. */
  hover?: boolean;
}

/**
 * A grounded shadow that behaves like contact with a surface.
 *
 * A single soft blur is what makes CSS shadows read as stickers. Real contact
 * shadows are two: a tight, dark core directly under the object and a wide,
 * faint ambient spread. Lifting the object tightens neither equally, so the core
 * fades and widens as it rises, which is what sells the height.
 */
export const ContactShadow = React.forwardRef<HTMLDivElement, ContactShadowProps>(
  ({ className, children, lift = 8, opacity = 0.3, hover = true, style, ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="contact-shadow"
      data-hover={hover || undefined}
      className={cn("oui-contact", className)}
      style={{ "--oui-contact-lift": `${lift}px`, "--oui-contact-opacity": opacity, ...style } as React.CSSProperties}
      {...props}
    >
      <span className="oui-contact__shadow" aria-hidden="true" />
      <div className="oui-contact__object">{children}</div>
    </div>
  ),
);
ContactShadow.displayName = "ContactShadow";

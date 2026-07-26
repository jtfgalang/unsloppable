"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface PricingCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  plan: string;
  price: string;
  period?: string;
  description?: string;
  features?: readonly string[];
  action?: { label: string; href: string };
  /** Lift this tier. Use once per row. */
  featured?: boolean;
  badge?: string;
}

/**
 * One pricing tier.
 *
 * The feature list is a real list of real strings, not a set of ticks with
 * tooltips, because a plan a reader cannot read is a plan they will not buy. The
 * featured tier is lifted with elevation and a badge rather than by being the
 * only one with a filled button, so every tier keeps an equally reachable action.
 */
export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  ({ className, plan, price, period = "/ month", description, features = [], action, featured = false, badge, ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="pricing-card"
      data-featured={featured || undefined}
      className={cn("oui-pricing", className)}
      {...props}
    >
      {badge ? <span className="oui-pricing__badge">{badge}</span> : null}
      <span className="oui-pricing__plan">{plan}</span>
      <span className="oui-pricing__price">{price}<em>{period}</em></span>
      {description ? <p className="oui-pricing__description">{description}</p> : null}
      {features.length ? (
        <ul className="oui-pricing__features">
          {features.map((feature) => (
            <li key={feature}>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="m3.5 8.3 3 3 6-6.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
      {action ? <a className="oui-pricing__action" href={action.href}>{action.label}</a> : null}
    </div>
  ),
);
PricingCard.displayName = "PricingCard";

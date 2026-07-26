"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href: string };
  /** Replaces the drawn placeholder stack. */
  media?: React.ReactNode;
}

/**
 * The state a surface holds before it has anything to show.
 *
 * An empty state earns its place by naming the next action, so the primary
 * button is required to be the loudest thing here. The placeholder art is drawn
 * from primitives rather than shipped as an illustration, which keeps it on
 * theme and costs nothing to load.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, action, secondary, media, ...props }, ref) => (
    <div ref={ref} data-open-ui="empty-state" className={cn("oui-empty", className)} {...props}>
      <div className="oui-empty__art" aria-hidden="true">
        {media ?? <><i /><i /><i /></>}
      </div>
      <strong className="oui-empty__title">{title}</strong>
      {description ? <p className="oui-empty__description">{description}</p> : null}
      {action || secondary ? (
        <div className="oui-empty__actions">
          {action ? (
            action.href
              ? <a className="oui-empty__primary" href={action.href}>{action.label}</a>
              : <button type="button" className="oui-empty__primary" onClick={action.onClick}>{action.label}</button>
          ) : null}
          {secondary ? <a className="oui-empty__secondary" href={secondary.href}>{secondary.label}</a> : null}
        </div>
      ) : null}
    </div>
  ),
);
EmptyState.displayName = "EmptyState";

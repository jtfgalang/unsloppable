"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ViewTransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  /** Shared name tying this element to its counterpart on the next view. */
  transitionName?: string;
}

/**
 * A link that hands navigation to the View Transitions API where it exists.
 *
 * The whole point is progressive: browsers with `startViewTransition` get the
 * cross-document morph, and everything else follows the href normally. The
 * fallback is not a degraded animation, it is an ordinary link, which is why the
 * component never blocks navigation waiting on an effect.
 *
 * `transitionName` marks the element so a matching one on the next page can
 * morph into it.
 */
export const ViewTransitionLink = React.forwardRef<HTMLAnchorElement, ViewTransitionLinkProps>(
  ({ className, children, transitionName, onClick, href, style, ...props }, ref) => {
    const navigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || !href) return;
      const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
      if (typeof doc.startViewTransition !== "function") return;
      event.preventDefault();
      doc.startViewTransition(() => { window.location.href = href; });
    };

    return (
      <a
        {...props}
        ref={ref}
        href={href}
        data-open-ui="view-transition-link"
        className={cn("oui-viewlink", className)}
        style={{ ...(transitionName ? { viewTransitionName: transitionName } : null), ...style } as React.CSSProperties}
        onClick={navigate}
      >
        {children}
      </a>
    );
  },
);
ViewTransitionLink.displayName = "ViewTransitionLink";

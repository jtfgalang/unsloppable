"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface FooterRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The page content that slides up to reveal the footer. */
  children: React.ReactNode;
  /** The footer fixed behind it. */
  footer: React.ReactNode;
}

/**
 * A footer fixed behind the page that the content slides up off to reveal.
 *
 * The whole effect is `position: sticky` on the content over a footer pinned
 * beneath it, so there is no scroll listener and no transform math: the browser
 * does the reveal as the page scrolls past its end. The footer is real,
 * in-order content, so it is reachable and readable even where the sticky trick
 * is unsupported.
 */
export const FooterReveal = React.forwardRef<HTMLDivElement, FooterRevealProps>(
  ({ className, children, footer, ...props }, ref) => (
    <div ref={ref} data-open-ui="footer-reveal" className={cn("oui-footerreveal", className)} {...props}>
      <div className="oui-footerreveal__content">{children}</div>
      <div className="oui-footerreveal__footer">{footer}</div>
    </div>
  ),
);
FooterReveal.displayName = "FooterReveal";

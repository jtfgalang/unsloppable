"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface QuotePullProps extends Omit<React.HTMLAttributes<HTMLElement>, "cite"> {
  children: React.ReactNode;
  attribution?: string;
  role_?: string;
  /** Scale reached at the reading centre. */
  peak?: number;
}

/**
 * A pull quote that gains a little presence as it reaches the reading centre.
 *
 * The scale is driven by an IntersectionObserver rather than a scroll handler,
 * so nothing runs per frame. It is a `<figure>` with a real `<blockquote>` and
 * `<figcaption>`, so the quote and its attribution stay properly associated
 * instead of being two loose paragraphs that happen to sit near each other.
 */
export const QuotePull = React.forwardRef<HTMLElement, QuotePullProps>(
  ({ className, children, attribution, role_, peak = 1.035, style, ...props }, ref) => {
    const hostRef = React.useRef<HTMLElement | null>(null);
    const [centred, setCentred] = React.useState(false);

    React.useEffect(() => {
      const node = hostRef.current;
      if (!node || typeof IntersectionObserver === "undefined") { setCentred(true); return; }
      const observer = new IntersectionObserver(
        ([entry]) => setCentred(entry.isIntersecting),
        { rootMargin: "-32% 0px -32% 0px", threshold: 0 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    return (
      <figure
        ref={(node: HTMLElement | null) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        data-open-ui="quote-pull"
        data-centred={centred || undefined}
        className={cn("oui-quote", className)}
        style={{ "--oui-quote-peak": peak, ...style } as React.CSSProperties}
        {...props}
      >
        <blockquote className="oui-quote__body">{children}</blockquote>
        {attribution ? (
          <figcaption className="oui-quote__cite">
            <strong>{attribution}</strong>
            {role_ ? <span>{role_}</span> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  },
);
QuotePull.displayName = "QuotePull";

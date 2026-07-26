"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface StrikeReplaceProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The claim being withdrawn. */
  from: string;
  /** What replaces it. */
  to: string;
  /** Seconds before the strike begins. */
  delay?: number;
}

/**
 * An old claim struck through before its replacement arrives.
 *
 * The strike is a scaling rule rather than `text-decoration`, so it draws across
 * the phrase instead of appearing all at once. Both strings stay in the DOM and
 * the withdrawn one is marked with `<s>`, so the correction is carried by
 * semantics rather than by a visual line an assistive reader would never see.
 */
export const StrikeReplace = React.forwardRef<HTMLSpanElement, StrikeReplaceProps>(
  ({ className, from, to, delay = 0.6, style, ...props }, ref) => (
    <span
      ref={ref}
      data-open-ui="strike-replace"
      className={cn("oui-strike", className)}
      style={{ "--oui-strike-delay": `${delay}s`, ...style } as React.CSSProperties}
      {...props}
    >
      <s className="oui-strike__old">
        {from}
        <i className="oui-strike__rule" aria-hidden="true" />
      </s>
      <span className="oui-strike__new">{to}</span>
    </span>
  ),
);
StrikeReplace.displayName = "StrikeReplace";

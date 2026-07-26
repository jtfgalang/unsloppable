"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface EchoHeadingProps extends React.HTMLAttributes<HTMLElement> {
  children: string;
  /** Oversized ghost word set behind. Defaults to the heading itself. */
  echo?: string;
  as?: React.ElementType;
}

/**
 * A heading with an oversized ghost of itself set behind it.
 *
 * The echo is a decorative pseudo-layer at near-invisible opacity, hidden from
 * assistive technology, so the depth costs nothing semantically: the heading is
 * announced once. It is also `pointer-events: none`, so the giant word behind
 * can never swallow a click meant for the content.
 */
export const EchoHeading = React.forwardRef<HTMLElement, EchoHeadingProps>(
  ({ className, children, echo, as: Tag = "h2", ...props }, ref) => (
    <Tag ref={ref} data-open-ui="echo-heading" className={cn("oui-echo", className)} {...props}>
      <span className="oui-echo__ghost" aria-hidden="true">{echo ?? children}</span>
      <span className="oui-echo__ink">{children}</span>
    </Tag>
  ),
);
EchoHeading.displayName = "EchoHeading";

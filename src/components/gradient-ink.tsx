"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface GradientInkProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /** Two colours the ink travels between. */
  from?: string;
  to?: string;
  /** One travel cycle in seconds. */
  duration?: number;
  as?: React.ElementType;
}

/**
 * A slow two-colour movement confined to the text fill.
 *
 * The movement is a wide gradient panned behind `background-clip: text`, so the
 * colour lives strictly inside the letterforms and never becomes a block of
 * decoration behind them. Where `background-clip: text` is unsupported the text
 * falls back to solid ink rather than disappearing.
 */
export const GradientInk = React.forwardRef<HTMLSpanElement, GradientInkProps>(
  ({ className, children, from = "var(--style-accent, #6d4aff)", to = "#111112", duration = 7, as: Tag = "span", style, ...props }, ref) => (
    <Tag
      ref={ref}
      data-open-ui="gradient-ink"
      className={cn("oui-ink", className)}
      style={{ "--oui-ink-from": from, "--oui-ink-to": to, "--oui-ink-duration": `${duration}s`, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </Tag>
  ),
);
GradientInk.displayName = "GradientInk";

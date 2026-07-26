"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface CharacterBlurInProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
  /** Seconds between characters. */
  stagger?: number;
  /** Starting blur in pixels. */
  blur?: number;
}

/**
 * One word resolving out of a controlled character blur.
 *
 * `filter` repaints rather than compositing, so this is deliberately scoped to a
 * short string and runs exactly once. The resting state is sharp and fully
 * opaque: if the animation is skipped the word is simply legible, never stranded
 * mid-blur.
 */
export const CharacterBlurIn = React.forwardRef<HTMLSpanElement, CharacterBlurInProps>(
  ({ className, children, stagger = 0.035, blur = 9, style, ...props }, ref) => (
    <span
      ref={ref}
      data-open-ui="character-blur-in"
      className={cn("oui-blurin", className)}
      style={{ "--oui-blurin-blur": `${blur}px`, ...style } as React.CSSProperties}
      aria-label={children}
      {...props}
    >
      {[...children].map((char, index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{ "--oui-blurin-delay": `${index * stagger}s` } as React.CSSProperties}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  ),
);
CharacterBlurIn.displayName = "CharacterBlurIn";

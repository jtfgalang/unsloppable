"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface AspectStageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Aspect ratio, for example 16/9. */
  ratio?: number;
  /** Rounded corners in pixels. */
  radius?: number;
  /** Constrain the stage's maximum width. */
  maxWidth?: number;
}

/**
 * A stage that holds a fixed aspect ratio for whatever it frames.
 *
 * It uses the `aspect-ratio` property rather than the old padding-top hack, so
 * the box reserves its height before the media loads. That single detail
 * eliminates the layout shift that makes a page jump as each image or embed
 * arrives, which is the whole reason this wrapper exists.
 */
export const AspectStage = React.forwardRef<HTMLDivElement, AspectStageProps>(
  ({ className, children, ratio = 16 / 9, radius = 16, maxWidth, style, ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="aspect-stage"
      className={cn("oui-aspect", className)}
      style={{ "--oui-aspect-ratio": ratio, "--oui-aspect-radius": `${radius}px`, ...(maxWidth ? { maxWidth } : null), ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  ),
);
AspectStage.displayName = "AspectStage";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type MasonryTile = { id: string; content: React.ReactNode };

export interface MasonryFlowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  tiles: readonly MasonryTile[];
  /** Columns at the widest breakpoint. */
  columns?: 2 | 3 | 4;
  gap?: number;
  label?: string;
}

/**
 * A masonry grid that keeps reading order.
 *
 * It uses real CSS columns, so tiles of any height pack without gaps and reflow
 * at every breakpoint with no measuring loop. The one trap with CSS columns is
 * that they read top-to-bottom then across; each tile is set `break-inside:
 * avoid`, so an item is never split across a column boundary, which is the
 * failure that makes naive column masonry look broken.
 */
export const MasonryFlow = React.forwardRef<HTMLDivElement, MasonryFlowProps>(
  ({ className, tiles, columns = 3, gap = 14, label = "Gallery", ...props }, ref) => (
    <div
      ref={ref}
      data-open-ui="masonry-flow"
      className={cn("oui-masonry", className)}
      style={{ "--oui-masonry-cols": columns, "--oui-masonry-gap": `${gap}px` } as React.CSSProperties}
      role="list"
      aria-label={label}
      {...props}
    >
      {tiles.map((tile) => (
        <div className="oui-masonry__tile" role="listitem" key={tile.id}>{tile.content}</div>
      ))}
    </div>
  ),
);
MasonryFlow.displayName = "MasonryFlow";

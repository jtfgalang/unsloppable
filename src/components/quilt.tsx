"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type QuiltTile = {
  id: string;
  title: string;
  description?: string;
  /** Columns out of six. Omit it and the tile takes its place in the cadence. */
  span?: 2 | 3 | 4 | 6;
  /** Taller tile, for the one that carries a visual. */
  tall?: boolean;
  media?: React.ReactNode;
  href?: string;
  /** Lift this tile with the accent. Use once per grid. */
  feature?: boolean;
};

export interface QuiltProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  tiles: readonly QuiltTile[];
  label?: string;
}

const BED = 6;

/**
 * A composed cadence, not a bento grid.
 *
 * `4 2 · 2 4 · 3 3` on a six-column bed. The heavy tile changes sides every
 * row and every third row balances, which is long enough that the eye reads
 * rhythm rather than stripes, and short enough that it reads as intended rather
 * than as noise. A caller can still pin a span, and the pinned tile joins the
 * cadence instead of breaking it.
 */
const CADENCE = [4, 2, 2, 4, 3, 3] as const;

type Placed = { tile: QuiltTile; span: number };

/**
 * WHY THE COMPONENT DECIDES THE SPANS. The predecessor took whatever spans it
 * was handed and trusted a comment that said they "sum cleanly". They do not:
 * a 3 followed by a 4 puts the 4 on the next row and leaves a three-column hole
 * in the middle of the bed, and nothing in the component noticed. This walks
 * the set once, closes every row, and widens the last tile to finish the bed,
 * so a hole is not something a caller can accidentally author.
 */
function compose(tiles: readonly QuiltTile[]): Placed[] {
  const placed: Placed[] = [];
  let used = 0;
  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index];
    let span = Math.max(1, Math.min(BED, tile.span ?? CADENCE[index % CADENCE.length]));
    const left = BED - used;
    if (span > left) {
      // Take the rest of the row when there is a usable amount of it, rather
      // than dropping to the next row and leaving the remainder empty.
      if (left >= 2) span = left;
      else used = 0;
    }
    placed.push({ tile, span });
    used = (used + span) % BED;
  }
  if (used > 0 && placed.length > 0) placed[placed.length - 1].span += BED - used;
  return placed;
}

/**
 * A bed of feature tiles whose sizes are composed rather than authored.
 *
 * REFLOW IS A CONTAINER QUERY, NOT A MEDIA QUERY. A tile bed does not know
 * whether it is the full page or the narrow half of a split, and the viewport
 * cannot tell it. The old `@media (max-width: 720px)` collapsed the grid to two
 * columns on a phone and left it six-wide inside a 300px sidebar on a desktop,
 * which is the case that actually breaks. The bed queries its own inline size
 * and steps 6 -> 3 -> 1 tiles per row. The composed spans are handed in as one
 * custom property and the query overrides a second one, so the stylesheet can
 * win over the inline value without `!important`.
 *
 * SEMANTICS. A real `<ul>` of `<li>`s, with the anchor inside the item rather
 * than being the item. The previous version put `role="listitem"` on the
 * anchor, which overrides the implicit link role: every tile was announced as a
 * list item, none appeared in a screen reader's list of links, and the
 * component's own documentation claimed the opposite.
 */
export const Quilt = React.forwardRef<HTMLDivElement, QuiltProps>(
  ({ className, tiles, label = "Features", ...props }, forwardedRef) => {
    const placed = React.useMemo(() => compose(tiles), [tiles]);

    return (
      <div {...props} ref={forwardedRef} data-open-ui="quilt" className={cn("oui-quilt", className)}>
        <ul className="oui-quilt__bed" aria-label={label}>
          {placed.map(({ tile, span }, index) => {
            const Tag = (tile.href ? "a" : "div") as "a";
            return (
              <li
                key={tile.id}
                className="oui-quilt__cell"
                style={{ "--oui-quilt-w": span, "--oui-quilt-i": Math.min(index, 7) } as React.CSSProperties}
              >
                <Tag
                  href={tile.href}
                  className="oui-quilt__tile"
                  data-tall={tile.tall || undefined}
                  data-feature={tile.feature || undefined}
                  data-link={tile.href ? true : undefined}
                >
                  {tile.media ? <span className="oui-quilt__media" aria-hidden="true">{tile.media}</span> : null}
                  <span className="oui-quilt__copy">
                    <strong>{tile.title}</strong>
                    {tile.description ? <small>{tile.description}</small> : null}
                  </span>
                  {tile.href ? <span className="oui-quilt__cue" aria-hidden="true">↗</span> : null}
                </Tag>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
Quilt.displayName = "Quilt";

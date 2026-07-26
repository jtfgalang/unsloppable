"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type FoldCard = { id: string; eyebrow?: string; title: string; body?: React.ReactNode };

export interface StackFoldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  cards: readonly FoldCard[];
  /** Distance each card sticks below the one above, in pixels. */
  offset?: number;
  label?: string;
}

/**
 * Cards that fold into a deck as the page scrolls past them.
 *
 * The whole effect is `position: sticky` plus a per-card top offset, so it costs
 * no JavaScript and no scroll handler at all: each card pins a little lower than
 * the one before it and the earlier cards stay visible as a stack of edges.
 *
 * Because nothing is transformed away, every card remains in normal document
 * order and fully readable, which matters when the deck is long enough that a
 * reader lands mid-way through it.
 */
export const StackFold = React.forwardRef<HTMLDivElement, StackFoldProps>(
  ({ className, cards, offset = 18, label = "Sequence", ...props }, forwardedRef) => {
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="stack-fold"
        className={cn("oui-fold", className)}
        style={{ "--oui-fold-offset": `${offset}px` } as React.CSSProperties}
        role="list"
        aria-label={label}
      >
        {cards.map((card, index) => (
          <article
            key={card.id}
            role="listitem"
            className="oui-fold__card"
            style={{ "--oui-fold-i": index } as React.CSSProperties}
          >
            {card.eyebrow ? <span className="oui-fold__eyebrow">{card.eyebrow}</span> : null}
            <strong className="oui-fold__title">{card.title}</strong>
            {card.body ? <div className="oui-fold__body">{card.body}</div> : null}
          </article>
        ))}
      </div>
    );
  },
);
StackFold.displayName = "StackFold";

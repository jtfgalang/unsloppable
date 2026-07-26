"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ReorderItem = { id: string; label: string; meta?: string };

export interface ReorderListProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "onChange"> {
  items: readonly ReorderItem[];
  onReorder?: (items: ReorderItem[]) => void;
  label?: string;
}

/**
 * A list whose rows can be reordered by keyboard as well as by drag.
 *
 * Each row carries a real handle button with arrow-key support, because
 * drag-only reordering is unusable without a mouse and is the single most common
 * accessibility failure in this pattern. Moves are announced politely, so a
 * screen reader hears where the row landed.
 */
export const ReorderList = React.forwardRef<HTMLUListElement, ReorderListProps>(
  ({ className, items, onReorder, label = "Reorderable list", ...props }, ref) => {
    const [order, setOrder] = React.useState<ReorderItem[]>([...items]);
    const [announce, setAnnounce] = React.useState("");
    const dragIndex = React.useRef<number | null>(null);

    React.useEffect(() => { setOrder([...items]); }, [items]);

    const move = (from: number, to: number) => {
      if (to < 0 || to >= order.length) return;
      const next = [...order];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      setOrder(next);
      onReorder?.(next);
      setAnnounce(`${row.label} moved to position ${to + 1} of ${next.length}`);
    };

    return (
      <>
        <ul ref={ref} data-open-ui="reorder-list" className={cn("oui-reorder", className)} aria-label={label} {...props}>
          {order.map((item, index) => (
            <li
              key={item.id}
              className="oui-reorder__row"
              draggable
              onDragStart={() => { dragIndex.current = index; }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (dragIndex.current !== null) move(dragIndex.current, index); dragIndex.current = null; }}
            >
              <button
                type="button"
                className="oui-reorder__handle"
                aria-label={`Reorder ${item.label}. Use the up and down arrow keys.`}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") { event.preventDefault(); move(index, index - 1); }
                  if (event.key === "ArrowDown") { event.preventDefault(); move(index, index + 1); }
                }}
              >
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
              </button>
              <span className="oui-reorder__label">{item.label}</span>
              {item.meta ? <em className="oui-reorder__meta">{item.meta}</em> : null}
              <span className="oui-reorder__index">{index + 1}</span>
            </li>
          ))}
        </ul>
        <span className="oui-reorder__sr" role="status" aria-live="polite">{announce}</span>
      </>
    );
  },
);
ReorderList.displayName = "ReorderList";

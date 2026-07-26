"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type UnderlayItem = { id: string; label: string; href?: string };

export interface IntentUnderlayProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: readonly UnderlayItem[];
  label?: string;
}

/**
 * A nav where one underlay slides between items instead of each item lighting up.
 *
 * The underlay is a single element moved to the hovered item's box, so the
 * highlight travels rather than blinking from one place to another. Position is
 * measured from the real element, which means it stays correct at any font size
 * or wrap without hardcoded widths.
 *
 * It settles back onto the current item when the pointer leaves, so the nav
 * never loses its sense of place.
 */
export const IntentUnderlay = React.forwardRef<HTMLElement, IntentUnderlayProps>(
  ({ className, items, label = "Sections", ...props }, ref) => {
    const listRef = React.useRef<HTMLUListElement | null>(null);
    const [box, setBox] = React.useState<{ x: number; w: number } | null>(null);
    const [active, setActive] = React.useState(0);

    const moveTo = React.useCallback((index: number) => {
      const list = listRef.current;
      const item = list?.children[index] as HTMLElement | undefined;
      if (!list || !item) return;
      setBox({ x: item.offsetLeft, w: item.offsetWidth });
    }, []);

    React.useEffect(() => { moveTo(active); }, [active, moveTo]);

    return (
      <nav
        ref={ref as React.Ref<HTMLElement>}
        data-open-ui="intent-underlay"
        className={cn("oui-underlay", className)}
        aria-label={label}
        onMouseLeave={() => moveTo(active)}
        {...props}
      >
        <ul ref={listRef} className="oui-underlay__list">
          <span
            className="oui-underlay__pill"
            aria-hidden="true"
            style={box ? { transform: `translateX(${box.x}px)`, width: box.w } : { opacity: 0 }}
          />
          {items.map((item, index) => (
            <li key={item.id} className="oui-underlay__item" data-active={index === active || undefined}>
              <a
                href={item.href ?? "#"}
                onMouseEnter={() => moveTo(index)}
                onFocus={() => moveTo(index)}
                onClick={() => setActive(index)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  },
);
IntentUnderlay.displayName = "IntentUnderlay";

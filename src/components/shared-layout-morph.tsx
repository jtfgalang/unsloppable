"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type SharedLayoutMorphItem = {
  id: string;
  title: string;
  /** Short qualifier shown beside the title in both states. */
  meta?: string;
  /** Detail revealed only in the expanded state. */
  detail?: React.ReactNode;
};

export interface SharedLayoutMorphProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onSelect" | "defaultValue"> {
  items: SharedLayoutMorphItem[];
  /** Expanded item id when controlled. */
  value?: string | null;
  /** Expanded item id on first render when uncontrolled. */
  defaultValue?: string | null;
  /** Called when the expanded item changes. */
  onValueChange?: (id: string | null) => void;
  /** Accessible name for the list. */
  label?: string;
}

/**
 * A list where the selected row expands into its detail in place: the card grows
 * a panel and its siblings reflow to make room. The expansion is a pure CSS
 * grid-template-rows 0fr to 1fr transition, so there is no fixed-position modal
 * and no shared-layout projection to mis-track, distort text, or throw on close.
 * Collapsing is just toggling the same row, so nothing can be left stranded.
 */
export const SharedLayoutMorph = React.forwardRef<HTMLDivElement, SharedLayoutMorphProps>(
  ({ className, items, value, defaultValue = null, onValueChange, label = "Expandable list", ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = React.useState<string | null>(defaultValue);
    const openId = value !== undefined ? value : uncontrolled;
    const baseId = React.useId();

    const setOpen = React.useCallback((id: string | null) => {
      if (value === undefined) setUncontrolled(id);
      onValueChange?.(id);
    }, [value, onValueChange]);

    React.useEffect(() => {
      if (!openId) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") { event.stopPropagation(); setOpen(null); }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [openId, setOpen]);

    return <div ref={ref} data-open-ui="shared-layout-morph" className={cn("oui-morph relative", className)} {...props}>
      <ul aria-label={label} className="grid gap-2.5">
        {items.map((item) => {
          const open = openId === item.id;
          const detailId = `${baseId}-${item.id}`;
          return <li key={item.id}>
            <div
              data-open={open || undefined}
              className={cn(
                "overflow-hidden rounded-2xl border transition-[border-color,box-shadow,background] duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
                open
                  ? "border-current/25 bg-current/[.06] shadow-[0_2px_4px_rgba(0,0,0,.05),0_22px_48px_-22px_rgba(0,0,0,.34)]"
                  : "border-current/12 bg-current/[.04] shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_24px_-16px_rgba(0,0,0,.24)] hover:border-current/25 hover:bg-current/[.07]",
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={open && item.detail ? detailId : undefined}
                onClick={() => setOpen(open ? null : item.id)}
                className="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                <span aria-hidden className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-current/12 bg-current/[.05] text-[11px] font-semibold tabular-nums opacity-70 transition-colors group-hover:border-current/25">{item.meta?.match(/\d+/)?.[0] ?? "•"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold tracking-[-.01em]">{item.title}</span>
                  {item.meta && <span className="block text-xs opacity-55">{item.meta}</span>}
                </span>
                <svg aria-hidden viewBox="0 0 16 16" width="15" height="15" className={cn("flex-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)]", open ? "rotate-90 opacity-80" : "opacity-45 group-hover:translate-x-0.5 group-hover:opacity-80")}><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              {item.detail && open && <div
                id={detailId}
                role="region"
                className="oui-morph-detail border-t border-current/10 px-4 py-3.5 text-[13px] leading-relaxed opacity-75"
              >{item.detail}</div>}
            </div>
          </li>;
        })}
      </ul>
    </div>;
  },
);
SharedLayoutMorph.displayName = "SharedLayoutMorph";

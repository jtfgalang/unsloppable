"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type PressAction = { id: string; label: string; danger?: boolean; onSelect?: () => void };

export interface LongPressMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: React.ReactNode;
  actions: readonly PressAction[];
  /** Milliseconds of hold before the menu opens. */
  hold?: number;
  label?: string;
}

/**
 * A menu that opens on a long press, with a ring showing the hold.
 *
 * The progress ring matters: an invisible hold feels broken, because a reader
 * cannot tell whether pressing is doing anything. It also opens on right-click
 * and on Enter, so the actions are never reachable by hold alone.
 *
 * Escape closes and returns focus to the trigger, and the menu uses real menu
 * semantics rather than a floating div of buttons.
 */
export const LongPressMenu = React.forwardRef<HTMLDivElement, LongPressMenuProps>(
  ({ className, children, actions, hold = 550, label = "More actions", ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [holding, setHolding] = React.useState(false);
    const timer = React.useRef<number | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);

    const clear = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; setHolding(false); };
    React.useEffect(() => clear, []);

    const start = () => {
      setHolding(true);
      timer.current = window.setTimeout(() => { setOpen(true); setHolding(false); }, hold);
    };

    return (
      <div
        ref={ref}
        data-open-ui="long-press-menu"
        data-open={open || undefined}
        className={cn("oui-press", className)}
        style={{ "--oui-press-hold": `${hold}ms` } as React.CSSProperties}
        onContextMenu={(event) => { event.preventDefault(); setOpen(true); }}
        {...props}
      >
        <button
          ref={triggerRef}
          type="button"
          className="oui-press__trigger"
          data-holding={holding || undefined}
          aria-haspopup="menu"
          aria-expanded={open}
          onPointerDown={start}
          onPointerUp={clear}
          onPointerLeave={clear}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen(true); } }}
        >
          {children}
          <span className="oui-press__ring" aria-hidden="true" />
        </button>

        {open ? (
          <div
            className="oui-press__menu"
            role="menu"
            aria-label={label}
            onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                data-danger={action.danger || undefined}
                onClick={() => { action.onSelect?.(); setOpen(false); triggerRef.current?.focus(); }}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
LongPressMenu.displayName = "LongPressMenu";

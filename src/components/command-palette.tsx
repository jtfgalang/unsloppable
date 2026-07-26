"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

const subscribe = () => () => undefined;
/** True only after hydration, so the portal never runs during SSR. */
const useMounted = () => React.useSyncExternalStore(subscribe, () => true, () => false);

export type CommandItem = {
  id: string;
  label: string;
  /** Short trailing qualifier, such as a shortcut or section. */
  hint?: string;
  /** Extra words matched by the filter but not displayed. */
  keywords?: string;
};

export type CommandGroup = { id: string; label: string; items: CommandItem[] };

export interface CommandPaletteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  groups: CommandGroup[];
  /** Whether the overlay is visible. */
  open: boolean;
  /** Called when the overlay should close. */
  onClose: () => void;
  /** Called with the chosen item. */
  onSelect?: (item: CommandItem) => void;
  /** Placeholder for the filter input. */
  placeholder?: string;
  /** Copy shown when no command matches. */
  emptyLabel?: string;
}

export const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  ({ className, groups, open, onClose, onSelect, placeholder = "Search commands", emptyLabel = "No matching command", ...props }, ref) => {
    const reduced = useHydratedReducedMotion();
    const mounted = useMounted();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const restoreTo = React.useRef<Element | null>(null);
    const [query, setQuery] = React.useState("");
    const [activeIndex, setActiveIndex] = React.useState(0);
    const listId = React.useId();

    /*
      Reset the query when the palette opens, and the cursor when either the
      query or the open state changes.

      ADJUSTED DURING RENDER, NOT IN AN EFFECT. This is React's own answer to
      "reset some state when a prop changes": setting state while rendering
      makes React throw away the in-progress output and re-render immediately,
      before anything is committed. As an effect it was a second commit - the
      palette painted one frame with the previous query and cursor still in it,
      then corrected itself.
    */
    const [lastOpen, setLastOpen] = React.useState(open);
    if (lastOpen !== open) {
      setLastOpen(open);
      setQuery("");
      setActiveIndex(0);
    }
    const [lastQuery, setLastQuery] = React.useState(query);
    if (lastQuery !== query) {
      setLastQuery(query);
      setActiveIndex(0);
    }

    const visible = React.useMemo(() => {
      const needle = query.trim().toLowerCase();
      return groups
        .map((group) => ({ ...group, items: group.items.filter((item) => !needle || `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase().includes(needle)) }))
        .filter((group) => group.items.length > 0);
    }, [groups, query]);

    const flat = React.useMemo(() => visible.flatMap((group) => group.items), [visible]);
    const active = flat[Math.min(activeIndex, flat.length - 1)];

    /* Focus management only. The query reset that used to live here is handled
       above, during render, where it costs no extra commit. */
    React.useEffect(() => {
      if (!open) return;
      restoreTo.current = document.activeElement;
      const focus = requestAnimationFrame(() => inputRef.current?.focus());
      return () => {
        cancelAnimationFrame(focus);
        (restoreTo.current as HTMLElement | null)?.focus?.();
      };
    }, [open]);

    React.useEffect(() => {
      if (!open || !active) return;
      listRef.current?.querySelector(`[data-command-id="${CSS.escape(active.id)}"]`)?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    if (!open) return null;

    const commit = (item: CommandItem | undefined) => { if (item) { onSelect?.(item); onClose(); } };

    const onKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key === "Enter") { event.preventDefault(); commit(active); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!flat.length) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((current) => (current + step + flat.length) % flat.length);
      }
      if (event.key === "Home" && flat.length) { event.preventDefault(); setActiveIndex(0); }
      if (event.key === "End" && flat.length) { event.preventDefault(); setActiveIndex(flat.length - 1); }
    };

    const overlay = <div
      ref={ref}
      data-open-ui="command-palette"
      className={cn("oui-command fixed inset-0 z-[120] grid place-items-start justify-items-center p-4 pt-[12vh]", className)}
      {...props}
    >
      <div aria-hidden className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} />
      <div
        role="dialog" aria-modal="true" aria-label={placeholder}
        onKeyDown={onKeyDown}
        style={{ animation: reduced ? undefined : "oui-command-in .24s cubic-bezier(.16,1,.3,1)" }}
        className="oui-command__dialog relative w-[min(34rem,100%)] overflow-hidden rounded-[20px] border border-white/[.14] bg-neutral-950/95 text-white backdrop-blur-2xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-controls={listId}
          aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
          role="combobox" aria-expanded aria-autocomplete="list"
          className="w-full border-b border-white/10 bg-transparent px-5 py-4 text-sm outline-none placeholder:text-white/35"
        />
        <div ref={listRef} id={listId} role="listbox" aria-label={placeholder} className="max-h-80 overflow-y-auto p-2">
          {visible.length === 0 && <p className="px-3 py-6 text-center text-sm text-white/45">{emptyLabel}</p>}
          {visible.map((group) => <div key={group.id} role="group" aria-labelledby={`${listId}-${group.id}`} className="mb-1">
            <p id={`${listId}-${group.id}`} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-white/35">{group.label}</p>
            {group.items.map((item) => {
              const isActive = active?.id === item.id;
              return <div
                key={item.id}
                id={`${listId}-${item.id}`}
                data-command-id={item.id}
                role="option"
                aria-selected={isActive}
                onPointerMove={() => setActiveIndex(flat.findIndex((entry) => entry.id === item.id))}
                onClick={() => commit(item)}
                data-active={isActive || undefined}
                className={cn("oui-command__row flex cursor-pointer items-center justify-between gap-4 rounded-[10px] px-3 py-2.5 text-sm", isActive ? "bg-white/[.09]" : "hover:bg-white/[.045]")}
              >
                <span>{item.label}</span>
                {item.hint && <span className="oui-command__hint shrink-0">{item.hint}</span>}
              </div>;
            })}
          </div>)}
        </div>
      </div>
    </div>;

    // Portalled to the body so `fixed` resolves against the viewport. Any
    // ancestor with a transform, filter, or backdrop-filter would otherwise
    // become the containing block and push the dialog off-centre.
    return mounted ? createPortal(overlay, document.body) : null;
  },
);
CommandPalette.displayName = "CommandPalette";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type FilterSearchOption = { id: string; label: string; group?: string };

export interface FilterSearchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Everything the field can filter by. */
  options: FilterSearchOption[];
  /** Controlled active filter ids. */
  value?: string[];
  defaultValue?: string[];
  onFiltersChange?: (ids: string[]) => void;
  /** Controlled query text. */
  query?: string;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  /** Shown beside the field, for example the number of matching rows. */
  resultCount?: number;
  label?: string;
}

/**
 * A search field where committed filters live inside the input as chips.
 *
 * The chips are real buttons, so each one can be focused and removed on its own
 * rather than being decoration that only the mouse can reach. Backspace on an
 * empty query removes the last chip, which is the behaviour people expect from
 * token fields, and the suggestion list is a listbox tied to the input by
 * `aria-activedescendant` so arrow keys work without stealing focus.
 */
export const FilterSearch = React.forwardRef<HTMLDivElement, FilterSearchProps>(
  ({ className, options, value, defaultValue = [], onFiltersChange, query, onQueryChange, placeholder = "Search or filter", resultCount, label = "Search and filter", ...props }, forwardedRef) => {
    const controlledFilters = value !== undefined;
    const [internalFilters, setInternalFilters] = React.useState<string[]>(defaultValue);
    const active = controlledFilters ? (value as string[]) : internalFilters;

    const controlledQuery = query !== undefined;
    const [internalQuery, setInternalQuery] = React.useState("");
    const text = controlledQuery ? (query as string) : internalQuery;

    const [highlight, setHighlight] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const reactId = React.useId().replace(/:/g, "");

    const setFilters = (next: string[]) => {
      if (!controlledFilters) setInternalFilters(next);
      onFiltersChange?.(next);
    };

    const setText = (next: string) => {
      if (!controlledQuery) setInternalQuery(next);
      onQueryChange?.(next);
    };

    const suggestions = React.useMemo(() => {
      const needle = text.trim().toLowerCase();
      if (!needle) return [];
      return options
        .filter((option) => !active.includes(option.id) && option.label.toLowerCase().includes(needle))
        .slice(0, 6);
    }, [active, options, text]);

    React.useEffect(() => { setHighlight(0); }, [text]);

    const addFilter = (id: string) => {
      if (active.includes(id)) return;
      setFilters([...active, id]);
      setText("");
      inputRef.current?.focus();
    };

    const removeFilter = (id: string) => {
      setFilters(active.filter((item) => item !== id));
      inputRef.current?.focus();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace" && text === "" && active.length) {
        event.preventDefault();
        setFilters(active.slice(0, -1));
        return;
      }
      if (!suggestions.length) return;
      if (event.key === "ArrowDown") { event.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); }
      if (event.key === "ArrowUp") { event.preventDefault(); setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length); }
      if (event.key === "Enter") { event.preventDefault(); addFilter(suggestions[highlight].id); }
      if (event.key === "Escape") { event.preventDefault(); setText(""); }
    };

    const byId = React.useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
    const open = suggestions.length > 0;

    return (
      <div ref={forwardedRef} className={cn("oui-sift", className)} data-open-ui="filter-search" {...props}>
        <div className="oui-sift__field" onClick={() => inputRef.current?.focus()}>
          {active.map((id) => (
            <span className="oui-sift__chip" key={id}>
              {byId.get(id)?.label ?? id}
              <button
                type="button"
                className="oui-sift__chipRemove"
                aria-label={`Remove ${byId.get(id)?.label ?? id} filter`}
                onClick={(event) => { event.stopPropagation(); removeFilter(id); }}
              >
                <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            className="oui-sift__input"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${reactId}-list`}
            aria-autocomplete="list"
            aria-label={label}
            aria-activedescendant={open ? `${reactId}-option-${highlight}` : undefined}
            placeholder={active.length ? "" : placeholder}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
          />

          {resultCount !== undefined ? (
            <span className="oui-sift__count" aria-live="polite">{`${resultCount} results`}</span>
          ) : null}
        </div>

        {open ? (
          <ul className="oui-sift__list" id={`${reactId}-list`} role="listbox" aria-label="Matching filters">
            {suggestions.map((option, optionIndex) => (
              <li
                key={option.id}
                id={`${reactId}-option-${optionIndex}`}
                role="option"
                aria-selected={optionIndex === highlight}
                className="oui-sift__option"
                data-active={optionIndex === highlight || undefined}
                onMouseEnter={() => setHighlight(optionIndex)}
                onMouseDown={(event) => { event.preventDefault(); addFilter(option.id); }}
              >
                <span>{option.label}</span>
                {option.group ? <em className="oui-sift__group">{option.group}</em> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
);
FilterSearch.displayName = "FilterSearch";

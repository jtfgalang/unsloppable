"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
};

export interface ToastStackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  toasts: readonly ToastItem[];
  /** How many stay legible before the rest collapse behind them. */
  visible?: number;
  /** Called when a toast is dismissed. */
  onDismiss?: (id: string) => void;
  /** Expand the pile on hover and focus. */
  expandOnHover?: boolean;
  label?: string;
}

function ToneGlyph({ tone }: { tone: ToastTone }) {
  const path =
    tone === "success" ? "m3.5 8.4 3 3 6-6.8"
    : tone === "warning" ? "M8 4.6v4.2M8 11.2v.2"
    : tone === "danger" ? "M4.6 4.6l6.8 6.8M11.4 4.6l-6.8 6.8"
    : "M8 7.2v4.4M8 4.6v.2";
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A pile of toasts. The newest sits in front and the rest collapse behind it,
 * each one scaled down and pushed back a little, so a burst of notifications
 * reads as one object instead of a column that eats the viewport.
 *
 * Hover or focus expands the pile into a readable list and collapses it again on
 * exit. Depth is done with `translate` and `scale` only, so the whole stack
 * animates on the compositor, and the region is a polite live area so a screen
 * reader hears new toasts without being yanked away from its place.
 */
export const ToastStack = React.forwardRef<HTMLDivElement, ToastStackProps>(
  ({ className, toasts, visible = 3, onDismiss, expandOnHover = true, label = "Notifications", ...props }, forwardedRef) => {
    const [expanded, setExpanded] = React.useState(false);
    // Newest first: the front of the pile is the most recent arrival.
    const ordered = React.useMemo(() => [...toasts].reverse(), [toasts]);
    const open = expandOnHover && expanded;

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="toast-stack"
        data-expanded={open || undefined}
        className={cn("oui-toasts", className)}
        role="region"
        aria-label={label}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setExpanded(false); }}
      >
        <ol className="oui-toasts__list" aria-live="polite">
          {ordered.map((toast, index) => {
            const buried = index >= visible;
            return (
              <li
                key={toast.id}
                className="oui-toasts__item"
                data-tone={toast.tone ?? "info"}
                data-buried={buried || undefined}
                style={{ "--oui-toast-i": index } as React.CSSProperties}
              >
                <span className="oui-toasts__glyph" aria-hidden="true"><ToneGlyph tone={toast.tone ?? "info"} /></span>
                <span className="oui-toasts__copy">
                  <strong>{toast.title}</strong>
                  {toast.description ? <small>{toast.description}</small> : null}
                </span>
                {onDismiss ? (
                  <button
                    type="button"
                    className="oui-toasts__close"
                    aria-label={`Dismiss ${toast.title}`}
                    onClick={() => onDismiss(toast.id)}
                  >
                    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
        {ordered.length > visible && !open ? (
          <span className="oui-toasts__count" aria-hidden="true">{`${ordered.length - visible} more`}</span>
        ) : null}
      </div>
    );
  },
);
ToastStack.displayName = "ToastStack";

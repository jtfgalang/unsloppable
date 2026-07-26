"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface CopyChipProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onCopy"> {
  /** The text placed on the clipboard. */
  value: string;
  /** Shown instead of the raw value. */
  label?: string;
  copiedLabel?: string;
  onCopied?: (value: string) => void;
}

/**
 * A chip that copies its value and says so.
 *
 * Confirmation is the whole job: without it a reader presses again, and pasting
 * twice is worse than not copying at all. The chip holds a copied state for a
 * beat and announces it politely, then returns to rest.
 *
 * The clipboard write is guarded, so a denied permission surfaces as a failed
 * state rather than a chip that silently does nothing.
 */
export const CopyChip = React.forwardRef<HTMLButtonElement, CopyChipProps>(
  ({ className, value, label, copiedLabel = "Copied", onCopied, ...props }, ref) => {
    const [state, setState] = React.useState<"idle" | "done" | "failed">("idle");
    const timer = React.useRef<number | null>(null);
    React.useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setState("done");
        onCopied?.(value);
      } catch {
        setState("failed");
      }
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState("idle"), 1600);
    };

    return (
      <button
        {...props}
        ref={ref}
        type="button"
        data-open-ui="copy-chip"
        data-state={state}
        className={cn("oui-copychip", className)}
        onClick={copy}
      >
        <code>{label ?? value}</code>
        <span className="oui-copychip__mark" aria-hidden="true">
          {state === "done"
            ? <svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="m3.5 8.3 3 3 6-6.6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg viewBox="0 0 16 16" width="13" height="13" fill="none"><rect x="5.2" y="5.2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M10.8 5.2V4a1.2 1.2 0 0 0-1.2-1.2H4A1.2 1.2 0 0 0 2.8 4v5.6A1.2 1.2 0 0 0 4 10.8h1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>}
        </span>
        <span className="oui-copychip__sr" role="status" aria-live="polite">
          {state === "done" ? copiedLabel : state === "failed" ? "Copy failed" : ""}
        </span>
      </button>
    );
  },
);
CopyChip.displayName = "CopyChip";

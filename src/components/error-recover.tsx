"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ErrorRecoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "onError"> {
  title?: string;
  description?: string;
  /** Technical detail, kept behind a disclosure so it never shouts. */
  detail?: string;
  retryLabel?: string;
  /** Return a promise and the button holds its working state until it settles. */
  onRetry?: () => void | Promise<unknown>;
  /** Secondary escape hatch, for example contacting support. */
  secondaryAction?: { label: string; href: string };
}

/**
 * An error state that offers a way forward rather than just reporting failure.
 *
 * Retry is the loudest thing here, and it holds a working state for as long as
 * the handler's promise is pending, so a slow retry never looks like a dead
 * button or invites a second press. The technical detail sits behind a
 * disclosure: available when it helps, silent when it does not.
 *
 * The message is an assertive live region, since a failed action is exactly the
 * case where a screen reader should be interrupted.
 */
export const ErrorRecover = React.forwardRef<HTMLDivElement, ErrorRecoverProps>(
  ({ className, title = "That request did not go through", description = "The scan stopped before it finished. Nothing was saved, so retrying is safe.", detail, retryLabel = "Try again", onRetry, secondaryAction, ...props }, forwardedRef) => {
    const [working, setWorking] = React.useState(false);
    const mounted = React.useRef(true);
    React.useEffect(() => () => { mounted.current = false; }, []);

    const retry = async () => {
      if (working) return;
      setWorking(true);
      try {
        await onRetry?.();
      } finally {
        if (mounted.current) setWorking(false);
      }
    };

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="error-recover"
        data-working={working || undefined}
        className={cn("oui-recover", className)}
        role="alert"
      >
        <span className="oui-recover__glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M12 7.5v5.2M12 16.3v.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          </svg>
        </span>

        <div className="oui-recover__copy">
          <strong className="oui-recover__title">{title}</strong>
          <p className="oui-recover__description">{description}</p>
          {detail ? (
            <details className="oui-recover__details">
              <summary>Technical detail</summary>
              <code>{detail}</code>
            </details>
          ) : null}
        </div>

        <div className="oui-recover__actions">
          <button type="button" className="oui-recover__retry" onClick={retry} disabled={working}>
            <span className="oui-recover__spin" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <path d="M13.2 8a5.2 5.2 0 1 1-1.6-3.7M13.4 2.6v3h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {working ? "Retrying" : retryLabel}
          </button>
          {secondaryAction ? (
            <a className="oui-recover__secondary" href={secondaryAction.href}>{secondaryAction.label}</a>
          ) : null}
        </div>
      </div>
    );
  },
);
ErrorRecover.displayName = "ErrorRecover";

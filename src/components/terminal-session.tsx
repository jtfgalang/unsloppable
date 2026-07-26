"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type TerminalLine = { id: string; kind: "command" | "output" | "success" | "error"; text: string };

export interface TerminalSessionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  lines: readonly TerminalLine[];
  title?: string;
  /** Reveal lines in sequence rather than all at once. */
  play?: boolean;
  /** Seconds between lines. */
  interval?: number;
}

/**
 * A terminal transcript that plays back line by line.
 *
 * Playback is a timer, not rAF, so a hidden tab does not strand the transcript
 * half-written. Every line is real selectable text rather than an image, which
 * means a reader can copy the command out, and the whole log is exposed to
 * assistive technology as a single readable block.
 */
export const TerminalSession = React.forwardRef<HTMLDivElement, TerminalSessionProps>(
  ({ className, lines, title = "bash", play = true, interval = 0.55, ...props }, ref) => {
    const [shown, setShown] = React.useState(play ? 0 : lines.length);

    React.useEffect(() => {
      if (!play) { setShown(lines.length); return; }
      setShown(0);
      const id = window.setInterval(() => {
        setShown((n) => {
          if (n >= lines.length) { window.clearInterval(id); return n; }
          return n + 1;
        });
      }, interval * 1000);
      return () => window.clearInterval(id);
    }, [play, lines.length, interval]);

    return (
      <div ref={ref} data-open-ui="terminal-session" className={cn("oui-terminal", className)} {...props}>
        <div className="oui-terminal__chrome" aria-hidden="true"><i /><i /><i /><span>{title}</span></div>
        <pre className="oui-terminal__body" tabIndex={0}>
          {lines.slice(0, shown).map((line) => (
            <code key={line.id} data-kind={line.kind}>
              {line.kind === "command" ? <span aria-hidden="true">$ </span> : null}
              {line.text}
            </code>
          ))}
          {play && shown < lines.length ? <span className="oui-terminal__caret" aria-hidden="true" /> : null}
        </pre>
      </div>
    );
  },
);
TerminalSession.displayName = "TerminalSession";

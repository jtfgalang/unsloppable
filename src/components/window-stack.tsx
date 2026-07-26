"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type StackWindow = { id: string; title: string; content: React.ReactNode };

export interface WindowStackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  windows: readonly StackWindow[];
  label?: string;
}

/**
 * Browser windows stacked in depth, front one focused.
 *
 * Selecting a window brings it forward rather than swapping content in place, so
 * the stack keeps its sense of order. Titles are real buttons in a tablist, so
 * the stack is navigable by keyboard instead of being a picture of windows.
 */
export const WindowStack = React.forwardRef<HTMLDivElement, WindowStackProps>(
  ({ className, windows, label = "Windows", ...props }, ref) => {
    const [front, setFront] = React.useState(0);
    return (
      <div ref={ref} data-open-ui="window-stack" className={cn("oui-winstack", className)} {...props}>
        <div className="oui-winstack__tabs" role="tablist" aria-label={label}>
          {windows.map((win, index) => (
            <button
              key={win.id}
              type="button"
              role="tab"
              aria-selected={index === front}
              onClick={() => setFront(index)}
            >{win.title}</button>
          ))}
        </div>
        <div className="oui-winstack__stage">
          {windows.map((win, index) => {
            const depth = (index - front + windows.length) % windows.length;
            return (
              <div
                key={win.id}
                className="oui-winstack__window"
                data-front={depth === 0 || undefined}
                aria-hidden={depth !== 0}
                style={{ "--oui-winstack-depth": depth } as React.CSSProperties}
              >
                <div className="oui-winstack__chrome"><i /><i /><i /><span>{win.title}</span></div>
                <div className="oui-winstack__body">{win.content}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
WindowStack.displayName = "WindowStack";

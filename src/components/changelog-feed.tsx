"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ChangeKind = "added" | "improved" | "fixed";
export type ChangelogEntry = {
  id: string;
  version: string;
  date: string;
  kind: ChangeKind;
  title: string;
  body?: string;
};

export interface ChangelogFeedProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  entries: readonly ChangelogEntry[];
  label?: string;
}

/**
 * A release feed, newest first.
 *
 * Dates are rendered inside a real `<time datetime>` so they stay machine
 * readable, and the change kind is a text label rather than a colour, since a
 * bare coloured dot tells a screen reader nothing about whether something was
 * added or fixed.
 */
export const ChangelogFeed = React.forwardRef<HTMLOListElement, ChangelogFeedProps>(
  ({ className, entries, label = "Changelog", ...props }, ref) => (
    <ol ref={ref} data-open-ui="changelog-feed" className={cn("oui-changelog", className)} aria-label={label} {...props}>
      {entries.map((entry) => (
        <li key={entry.id} className="oui-changelog__entry">
          <div className="oui-changelog__meta">
            <span className="oui-changelog__version">{entry.version}</span>
            <time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
          </div>
          <div className="oui-changelog__body">
            <span className="oui-changelog__kind" data-kind={entry.kind}>{entry.kind}</span>
            <strong>{entry.title}</strong>
            {entry.body ? <p>{entry.body}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  ),
);
ChangelogFeed.displayName = "ChangelogFeed";

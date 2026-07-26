"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type LogoEntry = { id: string; name: string; href?: string };

export interface LogoWallProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  logos: readonly LogoEntry[];
  /** Scroll the wall as a marquee instead of wrapping it into rows. */
  marquee?: boolean;
  /** One travel cycle in seconds. */
  duration?: number;
  /** Proof line above the wall. */
  caption?: string;
  label?: string;
}

/**
 * A wall of customer wordmarks, optionally travelling.
 *
 * In marquee mode the list is rendered twice and the track translates by exactly
 * half its width, which is what makes the loop seamless: the second copy is
 * already in place when the first scrolls out. The duplicate is hidden from
 * assistive technology so the names are announced once, not twice.
 *
 * Travel pauses on hover and on focus, so a reader can stop the wall to read it
 * or tab through the links without chasing them.
 */
export const LogoWall = React.forwardRef<HTMLDivElement, LogoWallProps>(
  ({ className, logos, marquee = false, duration = 32, caption, label = "Customers", ...props }, forwardedRef) => {
    const renderItem = (logo: LogoEntry, key: string) => (
      <li className="oui-roster__item" key={key}>
        {logo.href ? <a href={logo.href}>{logo.name}</a> : <span>{logo.name}</span>}
      </li>
    );

    return (
      <div
        {...props}
        ref={forwardedRef}
        data-open-ui="logo-wall"
        data-marquee={marquee || undefined}
        className={cn("oui-roster", className)}
        style={{ "--oui-roster-duration": `${duration}s` } as React.CSSProperties}
      >
        {caption ? <p className="oui-roster__caption">{caption}</p> : null}

        <div className="oui-roster__viewport">
          <ul className="oui-roster__track" aria-label={label}>
            {logos.map((logo) => renderItem(logo, logo.id))}
          </ul>
          {marquee ? (
            <ul className="oui-roster__track" aria-hidden="true">
              {logos.map((logo) => renderItem(logo, `${logo.id}-echo`))}
            </ul>
          ) : null}
        </div>
      </div>
    );
  },
);
LogoWall.displayName = "LogoWall";

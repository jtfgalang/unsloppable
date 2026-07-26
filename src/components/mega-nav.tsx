"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export type MegaNavLink = {
  label: string;
  description?: string;
  href?: string;
};

export type MegaNavFeature = {
  title: string;
  body: string;
  /** Optional visual for the preview card. */
  media?: React.ReactNode;
};

export type MegaNavItem = {
  label: string;
  href?: string;
  /** Sub-links shown in the mega-menu's left column. */
  menu?: readonly MegaNavLink[];
  /** Preview card shown in the mega-menu's right column. */
  feature?: MegaNavFeature;
};

export interface MegaNavProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  brand: React.ReactNode;
  items: readonly MegaNavItem[];
  cta?: { label: string; href?: string };
}

/**
 * A floating navigation bar with a glassy mega-menu. Items that carry a `menu`
 * open a panel — a list of titled links beside an optional preview card — on
 * hover and on keyboard focus; Escape closes it and returns focus to the
 * trigger. Only one panel is open at a time.
 *
 * The bar and panel are real landmarks with button/`aria-expanded` semantics.
 * The open/close is a short CSS transition whose resting (closed) state is the
 * default, so nothing is stranded open in a hidden tab; under reduced motion
 * the panel appears without travel.
 */
export const MegaNav = React.forwardRef<HTMLElement, MegaNavProps>(
  ({ className, brand, items, cta, ...props }, ref) => {
    const reduced = useHydratedReducedMotion();
    const [open, setOpen] = React.useState<number | null>(null);
    const rootRef = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => rootRef.current as HTMLElement);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggers = React.useRef(new Map<number, HTMLButtonElement | null>());

    const clearClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
    const scheduleClose = () => { clearClose(); closeTimer.current = setTimeout(() => setOpen(null), 140); };

    React.useEffect(() => {
      if (open === null) return;
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") { const index = open; setOpen(null); triggers.current.get(index)?.focus(); }
      };
      const onClickAway = (event: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(null);
      };
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onClickAway);
      return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClickAway); };
    }, [open]);

    React.useEffect(() => () => clearClose(), []);

    return (
      <nav
        ref={rootRef}
        data-open-ui="mega-nav"
        data-open={open !== null || undefined}
        className={cn("oui-meganav", className)}
        aria-label="Primary"
        onMouseLeave={scheduleClose}
        onMouseEnter={clearClose}
        {...props}
      >
        <div className="oui-meganav__bar">
          <span className="oui-meganav__brand">{brand}</span>

          <ul className="oui-meganav__items">
            {items.map((item, index) => {
              const hasMenu = Boolean(item.menu?.length);
              const isOpen = open === index;
              return (
                <li
                  key={item.label}
                  className="oui-meganav__item"
                  onMouseEnter={() => { clearClose(); if (hasMenu) setOpen(index); else setOpen(null); }}
                >
                  {hasMenu ? (
                    <button
                      type="button"
                      ref={(node) => { triggers.current.set(index, node); }}
                      className="oui-meganav__link"
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      data-active={isOpen || undefined}
                      onFocus={() => setOpen(index)}
                      onClick={() => setOpen(isOpen ? null : index)}
                    >
                      {item.label}
                      <svg className="oui-meganav__caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  ) : (
                    <a className="oui-meganav__link" href={item.href ?? "#"} onFocus={() => setOpen(null)}>{item.label}</a>
                  )}
                </li>
              );
            })}
          </ul>

          {cta ? <a className="oui-meganav__cta" href={cta.href ?? "#"}>{cta.label}</a> : <span />}
        </div>

        {items.map((item, index) => {
          if (!item.menu?.length) return null;
          const isOpen = open === index;
          return (
            <div
              key={`panel-${item.label}`}
              className="oui-meganav__panel"
              data-open={isOpen || undefined}
              data-reduced={reduced || undefined}
              role="region"
              aria-label={`${item.label} menu`}
              hidden={!isOpen}
              onMouseEnter={clearClose}
            >
              <div className="oui-meganav__panelInner">
                <ul className="oui-meganav__menu">
                  {item.menu.map((link) => (
                    <li key={link.label}>
                      <a href={link.href ?? "#"}>
                        <strong>{link.label}</strong>
                        {link.description ? <span>{link.description}</span> : null}
                      </a>
                    </li>
                  ))}
                </ul>
                {item.feature ? (
                  <a className="oui-meganav__feature" href={item.href ?? "#"}>
                    <div className="oui-meganav__featureMedia">{item.feature.media}</div>
                    <strong>{item.feature.title}</strong>
                    <span>{item.feature.body}</span>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </nav>
    );
  },
);
MegaNav.displayName = "MegaNav";

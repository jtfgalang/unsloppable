"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ConsentCategory = {
  id: string;
  label: string;
  description: string;
  /** Strictly necessary categories are always on and cannot be switched off. */
  required?: boolean;
};

export type ConsentDecision = {
  /** Category ids the visitor agreed to, always including required ones. */
  accepted: string[];
  /** True only when the visitor accepted everything on offer. */
  all: boolean;
};

export interface ConsentBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  categories?: ConsentCategory[];
  title?: string;
  description?: string;
  policyHref?: string;
  policyLabel?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  manageLabel?: string;
  saveLabel?: string;
  /** Called once the visitor decides. Persisting the choice is the host's job. */
  onDecision?: (decision: ConsentDecision) => void;
}

const DEFAULT_CATEGORIES: ConsentCategory[] = [
  { id: "essential", label: "Strictly necessary", description: "Required for the site to load, sign you in, and keep your session secure.", required: true },
  { id: "analytics", label: "Analytics", description: "Aggregated usage data that tells us which pages are worth keeping." },
  { id: "marketing", label: "Marketing", description: "Used to measure campaigns and personalise what you are shown elsewhere." },
];

/**
 * A consent bar that treats declining as a first-class choice.
 *
 * Reject sits beside Accept as an equally weighted, single-press action rather
 * than being buried a panel deep, and every optional category starts switched
 * off, so closing the panel without touching anything grants nothing. Required
 * categories render as locked and are always included in the decision.
 *
 * It is a polite region pinned to the bottom, not a modal: it never traps focus
 * or blocks the page behind an overlay, so the content stays readable while the
 * choice is pending. Persistence is deliberately left to `onDecision` so the
 * component never writes storage on the host's behalf.
 */
export const ConsentBar = React.forwardRef<HTMLDivElement, ConsentBarProps>(
  (
    {
      className,
      categories = DEFAULT_CATEGORIES,
      title = "Your choice about cookies",
      description = "We use strictly necessary cookies to run the site. Everything else is optional and off until you say otherwise.",
      policyHref,
      policyLabel = "Privacy policy",
      acceptLabel = "Accept all",
      rejectLabel = "Reject optional",
      manageLabel = "Manage",
      saveLabel = "Save choices",
      onDecision,
      ...props
    },
    forwardedRef,
  ) => {
    const required = React.useMemo(() => categories.filter((item) => item.required).map((item) => item.id), [categories]);
    const optional = React.useMemo(() => categories.filter((item) => !item.required), [categories]);

    const [open, setOpen] = React.useState(false);
    // Optional categories start off. Doing nothing must never grant consent.
    const [selected, setSelected] = React.useState<string[]>([]);
    const [settled, setSettled] = React.useState(false);

    const decide = (accepted: string[], all: boolean) => {
      setSettled(true);
      onDecision?.({ accepted: Array.from(new Set([...required, ...accepted])), all });
    };

    const toggle = (id: string) => {
      setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    };

    if (settled) return null;

    return (
      <div
        ref={forwardedRef}
        className={cn("oui-consent", className)}
        data-open-ui="consent-bar"
        data-open={open || undefined}
        role="region"
        aria-label={title}
        {...props}
      >
        <div className="oui-consent__body">
          <div className="oui-consent__copy">
            <strong className="oui-consent__title">{title}</strong>
            <p className="oui-consent__description">
              {description}
              {policyHref ? (
                <>
                  {" "}
                  <a className="oui-consent__policy" href={policyHref}>{policyLabel}</a>
                </>
              ) : null}
            </p>
          </div>

          <div className="oui-consent__actions">
            <button
              type="button"
              className="oui-consent__manage"
              aria-expanded={open}
              aria-controls="oui-consent-panel"
              onClick={() => setOpen((current) => !current)}
            >
              {manageLabel}
            </button>
            <button type="button" className="oui-consent__reject" onClick={() => decide([], false)}>
              {rejectLabel}
            </button>
            <button
              type="button"
              className="oui-consent__accept"
              onClick={() => decide(categories.map((item) => item.id), true)}
            >
              {acceptLabel}
            </button>
          </div>
        </div>

        {/* Collapses on grid-template-rows, so the panel animates without a fixed height. */}
        <div className="oui-consent__panel" id="oui-consent-panel" hidden={!open}>
          <div className="oui-consent__panelInner">
            <ul className="oui-consent__list">
              {categories.map((category) => {
                const checked = category.required || selected.includes(category.id);
                return (
                  <li className="oui-consent__item" key={category.id}>
                    <label className="oui-consent__switch">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={category.required}
                        onChange={() => toggle(category.id)}
                      />
                      <span className="oui-consent__track" aria-hidden="true"><i /></span>
                      <span className="oui-consent__itemCopy">
                        <strong>
                          {category.label}
                          {category.required ? <em className="oui-consent__locked">Always on</em> : null}
                        </strong>
                        <small>{category.description}</small>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="oui-consent__panelActions">
              <button type="button" className="oui-consent__save" onClick={() => decide(selected, selected.length === optional.length && optional.length > 0)}>
                {saveLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
ConsentBar.displayName = "ConsentBar";

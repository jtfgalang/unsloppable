"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface PlanSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  options: readonly [string, string];
  value?: 0 | 1;
  defaultValue?: 0 | 1;
  onValueChange?: (index: 0 | 1) => void;
  /** Badge on the second option, for example an annual discount. */
  badge?: string;
  label?: string;
}

/**
 * The billing-period switch, as a real two-option radio group.
 *
 * Built from radios rather than a styled checkbox, because the choice is between
 * two named plans, not on and off. That gives arrow-key selection and correct
 * announcement for free, where a toggle would force a screen reader user to
 * infer which period "on" means.
 *
 * The indicator slides on `transform`, so switching never reflows the labels.
 */
export const PlanSwitch = React.forwardRef<HTMLDivElement, PlanSwitchProps>(
  ({ className, options, value, defaultValue = 0, onValueChange, badge, label = "Billing period", ...props }, ref) => {
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState<0 | 1>(defaultValue);
    const active = controlled ? (value as 0 | 1) : internal;
    const groupId = React.useId().replace(/:/g, "");

    const select = (next: 0 | 1) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    };

    return (
      <div
        ref={ref}
        data-open-ui="plan-switch"
        className={cn("oui-planswitch", className)}
        role="radiogroup"
        aria-label={label}
        {...props}
      >
        <span className="oui-planswitch__thumb" aria-hidden="true" data-at={active} />
        {options.map((option, index) => (
          <label className="oui-planswitch__option" key={option} data-active={active === index || undefined}>
            <input
              type="radio"
              name={groupId}
              checked={active === index}
              onChange={() => select(index as 0 | 1)}
            />
            {option}
            {index === 1 && badge ? <em className="oui-planswitch__badge">{badge}</em> : null}
          </label>
        ))}
      </div>
    );
  },
);
PlanSwitch.displayName = "PlanSwitch";

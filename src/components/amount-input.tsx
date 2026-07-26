"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "max" | "min" | "step"> {
  /** Controlled amount in major units, for example 12.5 for $12.50. */
  value?: number | null;
  /** Uncontrolled starting amount. */
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  /** ISO 4217 code. */
  currency?: string;
  locale?: string;
  /** Upper bound in major units. Entry stops here rather than silently clamping later. */
  max?: number;
  /** Quick-add chips, in major units. */
  presets?: number[];
  label?: string;
  /** Helper text under the field. */
  hint?: string;
}

const onlyDigits = (input: string) => input.replace(/\D/g, "");

/**
 * A currency field that formats as you type.
 *
 * It tracks the amount as an integer number of minor units (cents) rather than
 * parsing the formatted string back and forth. That is what keeps the caret
 * stable: the field always renders the fully-formatted value and the caret sits
 * at the end, so grouping separators appearing mid-entry can never bounce the
 * cursor into the wrong position.
 *
 * The input stays a real text input with `inputMode="numeric"`, so mobile gets a
 * numeric keypad while the visible value keeps its currency shape.
 */
export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, value, defaultValue = null, onValueChange, currency = "USD", locale = "en-US", max, presets, label = "Amount", hint, disabled, id, ...props }, forwardedRef) => {
    const controlled = value !== undefined;
    const toMinor = (amount: number | null) => (amount === null ? "" : String(Math.round(amount * 100)));
    const [internal, setInternal] = React.useState<string>(toMinor(defaultValue));
    const minor = controlled ? toMinor(value ?? null) : internal;
    const reactId = React.useId();
    const fieldId = id ?? `amount-${reactId.replace(/:/g, "")}`;

    const formatter = React.useMemo(
      () => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }),
      [currency, locale],
    );

    const amount = minor === "" ? null : Number(minor) / 100;
    const display = amount === null ? "" : formatter.format(amount);

    const commit = (nextMinor: string) => {
      const trimmed = nextMinor.replace(/^0+(?=\d)/, "");
      const next = trimmed === "" ? null : Number(trimmed) / 100;
      if (max !== undefined && next !== null && next > max) return;
      if (!controlled) setInternal(trimmed);
      onValueChange?.(next);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      commit(onlyDigits(event.target.value));
    };

    // A preset should feel like money landing: the value pops, the field flashes,
    // and the delta itself rises out of the field and fades.
    const [bump, setBump] = React.useState<{ id: number; delta: number } | null>(null);
    const bumpId = React.useRef(0);
    const bumpTimer = React.useRef<number | null>(null);
    React.useEffect(() => () => { if (bumpTimer.current !== null) window.clearTimeout(bumpTimer.current); }, []);

    const addPreset = (delta: number) => {
      const nextMinor = String(Math.round((amount ?? 0) * 100) + Math.round(delta * 100));
      if (max !== undefined && Number(nextMinor) / 100 > max) return;
      commit(nextMinor);
      bumpId.current += 1;
      setBump({ id: bumpId.current, delta });
      if (bumpTimer.current !== null) window.clearTimeout(bumpTimer.current);
      bumpTimer.current = window.setTimeout(() => setBump(null), 900);
    };

    return (
      <div className={cn("oui-amount", className)} data-open-ui="amount-input" data-empty={amount === null || undefined}>
        <label className="oui-amount__label" htmlFor={fieldId}>{label}</label>

        <div className="oui-amount__field" data-bump={bump ? bump.id : undefined}>
          {bump ? (
            <span className="oui-amount__bump" key={bump.id} aria-hidden="true">
              {`+ ${formatter.format(bump.delta).replace(/\.00$/, "")}`}
            </span>
          ) : null}
          <input
            {...props}
            ref={forwardedRef}
            id={fieldId}
            className="oui-amount__input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={display}
            onChange={handleChange}
            placeholder={formatter.format(0)}
            aria-describedby={hint ? `${fieldId}-hint` : undefined}
          />
        </div>

        {presets?.length ? (
          <div className="oui-amount__presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className="oui-amount__preset"
                disabled={disabled}
                onClick={() => addPreset(preset)}
              >
                {`+ ${formatter.format(preset).replace(/\.00$/, "")}`}
              </button>
            ))}
          </div>
        ) : null}

        {hint ? <p className="oui-amount__hint" id={`${fieldId}-hint`}>{hint}</p> : null}
      </div>
    );
  },
);
AmountInput.displayName = "AmountInput";

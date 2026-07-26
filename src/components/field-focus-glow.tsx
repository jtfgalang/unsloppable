"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type FieldValidationState = "idle" | "valid" | "invalid";

export interface FieldFocusGlowProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  /** Floating label; also the accessible name. */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Persistent helper text shown under the field. */
  hint?: string;
  /**
   * Runs on change and blur. Return an error string to mark the field invalid,
   * or null once it is satisfied. Omit for an unvalidated field.
   */
  validate?: (value: string) => string | null;
}

/**
 * A text field with a floating label, a contrast-safe focus glow, and inline
 * validation. The glow and label move on transform and opacity only; the error
 * message reserves its own row so validation never shifts the layout by more
 * than the label's travel. Under reduced motion the label and glow are static
 * but the states remain fully legible.
 */
export const FieldFocusGlow = React.forwardRef<HTMLInputElement, FieldFocusGlowProps>(
  ({ className, label, value, defaultValue = "", onValueChange, hint, validate, id, onFocus, onBlur, onChange, required, disabled, ...props }, forwardedRef) => {
    const reactId = React.useId();
    const inputId = id ?? `oui-field-${reactId}`;
    const messageId = `${inputId}-message`;
    const localRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLInputElement);

    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const current = value !== undefined ? value : uncontrolled;
    const [focused, setFocused] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [touched, setTouched] = React.useState(false);

    const runValidation = React.useCallback((next: string) => {
      if (!validate) return null;
      const result = validate(next);
      setError(result);
      return result;
    }, [validate]);

    const state: FieldValidationState = !touched || !validate ? "idle" : error ? "invalid" : "valid";
    const floated = focused || current.length > 0;

    return (
      <div
        data-open-ui="field-focus-glow"
        data-state={state}
        data-focused={focused || undefined}
        data-disabled={disabled || undefined}
        className={cn("oui-field", className)}
      >
        <div className="oui-field__shell">
          <input
            ref={localRef}
            id={inputId}
            className="oui-field__input"
            value={current}
            required={required}
            disabled={disabled}
            aria-invalid={state === "invalid" || undefined}
            aria-describedby={error || hint ? messageId : undefined}
            placeholder=" "
            onFocus={(event) => { setFocused(true); onFocus?.(event); }}
            onBlur={(event) => { setFocused(false); setTouched(true); runValidation(current); onBlur?.(event); }}
            onChange={(event) => {
              const next = event.target.value;
              if (value === undefined) setUncontrolled(next);
              if (touched) runValidation(next);
              onValueChange?.(next);
              onChange?.(event);
            }}
            {...props}
          />
          <label className="oui-field__label" htmlFor={inputId} data-floated={floated || undefined}>
            {label}{required ? <span aria-hidden="true"> *</span> : null}
          </label>
          <span className="oui-field__glow" aria-hidden="true" />
          <span className="oui-field__underline" aria-hidden="true" />
          {state !== "idle" ? (
            <span className="oui-field__mark" aria-hidden="true">
              {state === "valid" ? (
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 4.5v4.2M8 11.2v.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              )}
            </span>
          ) : null}
        </div>
        <p id={messageId} className="oui-field__message" role={error ? "alert" : undefined}>
          {error ?? hint ?? ""}
        </p>
      </div>
    );
  },
);
FieldFocusGlow.displayName = "FieldFocusGlow";

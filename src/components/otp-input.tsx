"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface OtpInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Number of cells. */
  length?: number;
  /** Controlled code. */
  value?: string;
  /** Uncontrolled starting code. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires the moment every cell is filled. */
  onComplete?: (value: string) => void;
  /** Accessible name for the group. */
  label?: string;
  disabled?: boolean;
  /** Obscure entered characters. */
  mask?: boolean;
  /** Allowed characters. Digits by default. */
  pattern?: RegExp;
}

/**
 * A one-time-code field built from real inputs, one per cell.
 *
 * Each cell is a genuine `<input>` with its own label, so the group is navigable
 * and announced properly rather than being a div that traps keystrokes. Typing
 * advances, Backspace retreats through empty cells, arrows move, and a pasted
 * code fills every cell at once no matter which one received the paste.
 *
 * The fill pop is a CSS keyframe with no fill-mode, so a cell's resting state is
 * simply "filled"; nothing is left mid-animation if it never runs.
 */
export const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ className, length = 6, value, defaultValue = "", onChange, onComplete, label = "One-time code", disabled = false, mask = false, pattern = /\d/, ...props }, forwardedRef) => {
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue.slice(0, length));
    const code = (controlled ? value : internal) ?? "";
    const cells = React.useRef<Array<HTMLInputElement | null>>([]);
    const completedFor = React.useRef<string | null>(null);

    const commit = React.useCallback(
      (next: string) => {
        const clipped = next.slice(0, length);
        if (!controlled) setInternal(clipped);
        onChange?.(clipped);
        if (clipped.length === length && completedFor.current !== clipped) {
          completedFor.current = clipped;
          onComplete?.(clipped);
        }
        if (clipped.length < length) completedFor.current = null;
      },
      [controlled, length, onChange, onComplete],
    );

    const focusCell = (index: number) => {
      const target = cells.current[Math.max(0, Math.min(length - 1, index))];
      target?.focus();
      target?.select();
    };

    const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      // Take the last typed character so overwriting a filled cell works.
      const raw = event.target.value.slice(-1);
      if (raw && !pattern.test(raw)) return;
      const chars = code.padEnd(length, " ").split("");
      chars[index] = raw || " ";
      const next = chars.join("").trimEnd();
      commit(next);
      if (raw) focusCell(index + 1);
    };

    const handleKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace") {
        event.preventDefault();
        const chars = code.padEnd(length, " ").split("");
        if (chars[index] && chars[index] !== " ") {
          chars[index] = " ";
          commit(chars.join("").trimEnd());
        } else if (index > 0) {
          chars[index - 1] = " ";
          commit(chars.join("").trimEnd());
          focusCell(index - 1);
        }
        return;
      }
      if (event.key === "ArrowLeft") { event.preventDefault(); focusCell(index - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); focusCell(index + 1); }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = event.clipboardData
        .getData("text")
        .split("")
        .filter((char) => pattern.test(char))
        .join("")
        .slice(0, length);
      if (!pasted) return;
      commit(pasted);
      focusCell(pasted.length);
    };

    const filled = code.replace(/\s/g, "").length;

    return (
      <div
        ref={forwardedRef}
        data-open-ui="otp-input"
        data-complete={filled === length || undefined}
        role="group"
        aria-label={label}
        className={cn("oui-otp", className)}
        {...props}
      >
        {Array.from({ length }, (_, index) => {
          const char = code[index] && code[index] !== " " ? code[index] : "";
          return (
            <input
              key={index}
              ref={(node) => { cells.current[index] = node; }}
              className="oui-otp__cell"
              data-filled={char ? true : undefined}
              type={mask && char ? "password" : "text"}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`${label}, digit ${index + 1} of ${length}`}
              maxLength={1}
              disabled={disabled}
              value={char}
              onChange={handleChange(index)}
              onKeyDown={handleKeyDown(index)}
              onPaste={handlePaste}
              onFocus={(event) => event.target.select()}
            />
          );
        })}
      </div>
    );
  },
);
OtpInput.displayName = "OtpInput";

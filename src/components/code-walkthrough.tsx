"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type WalkStep = { id: string; label: string; note: string; lines: readonly [number, number] };

export interface CodeWalkthroughProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  code: string;
  steps: readonly WalkStep[];
  filename?: string;
  label?: string;
}

/**
 * A code block whose lines highlight as you step through an explanation.
 *
 * The code stays one selectable block, and the highlight is an overlay keyed to
 * line numbers, so a reader can still copy the whole snippet rather than being
 * handed an image of code. Steps are real buttons, so the walkthrough is driven
 * by keyboard and each step's range is announced.
 */
export const CodeWalkthrough = React.forwardRef<HTMLDivElement, CodeWalkthroughProps>(
  ({ className, code, steps, filename = "example.tsx", label = "Code walkthrough", ...props }, ref) => {
    const [active, setActive] = React.useState(0);
    const lines = React.useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
    const range = steps[active]?.lines ?? [0, 0];

    return (
      <div ref={ref} data-open-ui="code-walkthrough" className={cn("oui-walk", className)} aria-label={label} {...props}>
        <div className="oui-walk__code">
          <div className="oui-walk__chrome" aria-hidden="true"><i /><i /><i /><span>{filename}</span></div>
          <pre tabIndex={0}>
            {lines.map((line, index) => {
              const on = index + 1 >= range[0] && index + 1 <= range[1];
              return (
                <code key={index} data-on={on || undefined}>
                  <em aria-hidden="true">{index + 1}</em>
                  {line || " "}
                </code>
              );
            })}
          </pre>
        </div>
        <ol className="oui-walk__steps">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                data-active={index === active || undefined}
                aria-current={index === active ? "step" : undefined}
                aria-label={`${step.label}, lines ${step.lines[0]} to ${step.lines[1]}`}
                onClick={() => setActive(index)}
              >
                <strong>{step.label}</strong>
                <span>{step.note}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    );
  },
);
CodeWalkthrough.displayName = "CodeWalkthrough";

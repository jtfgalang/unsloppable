"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type MultiStepFormStep = {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  /** Block Next until this returns true. */
  canContinue?: boolean;
};

export interface MultiStepFormProps extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  steps: MultiStepFormStep[];
  /** Controlled step index. */
  value?: number;
  defaultValue?: number;
  onStepChange?: (index: number) => void;
  onComplete?: () => void;
  backLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  label?: string;
}

/**
 * A form that advances through steps one pane at a time.
 *
 * Only the active pane is mounted. That is deliberate: sliding a track of every
 * pane would leave off-screen inputs and buttons in the tab order, so keyboard
 * users would tab into a step they cannot see. Mounting one pane keeps focus
 * order honest, and the pane keys off the step index so its entrance keyframe
 * replays on each move.
 *
 * Progress is a real ordered list, and the step change is announced politely
 * rather than yanking focus away from the control the user just pressed.
 */
export const MultiStepForm = React.forwardRef<HTMLFormElement, MultiStepFormProps>(
  ({ className, steps, value, defaultValue = 0, onStepChange, onComplete, backLabel = "Back", nextLabel = "Continue", completeLabel = "Submit", label = "Multi-step form", ...props }, forwardedRef) => {
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue);
    const rawIndex = controlled ? (value as number) : internal;
    const index = Math.max(0, Math.min(steps.length - 1, rawIndex));
    const [direction, setDirection] = React.useState<"forward" | "back">("forward");

    const step = steps[index];
    const isLast = index === steps.length - 1;
    const blocked = step?.canContinue === false;

    const go = (next: number, dir: "forward" | "back") => {
      setDirection(dir);
      if (!controlled) setInternal(next);
      onStepChange?.(next);
    };

    const handleNext = () => {
      if (blocked) return;
      if (isLast) { onComplete?.(); return; }
      go(index + 1, "forward");
    };

    if (!step) return null;

    return (
      <form
        {...props}
        ref={forwardedRef}
        className={cn("oui-relay", className)}
        data-open-ui="multi-step-form"
        aria-label={label}
        onSubmit={(event) => { event.preventDefault(); handleNext(); }}
      >
        <ol className="oui-relay__rail">
          {steps.map((item, itemIndex) => (
            <li
              key={item.id}
              className="oui-relay__tick"
              data-state={itemIndex < index ? "done" : itemIndex === index ? "current" : "upcoming"}
              aria-current={itemIndex === index ? "step" : undefined}
            >
              <span className="oui-relay__bar" />
              <span className="oui-relay__tickLabel">{item.title}</span>
            </li>
          ))}
        </ol>

        <p className="oui-relay__count" aria-live="polite">
          {`Step ${index + 1} of ${steps.length}`}
        </p>

        {/* Keyed on the index so the entrance replays each move. */}
        <div className="oui-relay__pane" key={step.id} data-direction={direction}>
          <h3 className="oui-relay__title">{step.title}</h3>
          {step.description ? <p className="oui-relay__description">{step.description}</p> : null}
          <div className="oui-relay__content">{step.content}</div>
        </div>

        <div className="oui-relay__actions">
          <button
            type="button"
            className="oui-relay__back"
            onClick={() => go(index - 1, "back")}
            disabled={index === 0}
          >
            {backLabel}
          </button>
          <button type="submit" className="oui-relay__next" disabled={blocked}>
            {isLast ? completeLabel : nextLabel}
          </button>
        </div>
      </form>
    );
  },
);
MultiStepForm.displayName = "MultiStepForm";

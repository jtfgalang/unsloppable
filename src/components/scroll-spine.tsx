"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type SpineStep = { id: string; title: string; body?: React.ReactNode; meta?: string };

export interface ScrollSpineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  steps: readonly SpineStep[];
  /** Sticky heading beside the rail. */
  title?: string;
  label?: string;
  /** Scroll container to observe. Defaults to the viewport. */
  root?: React.RefObject<HTMLElement | null>;
}

/**
 * A timeline whose rail tracks the step you are reading.
 *
 * Which step is active comes from an IntersectionObserver rather than a scroll
 * handler, so nothing runs per frame and the rail cannot fall behind on a long
 * page. The observer's root margin biases the trigger toward the upper third,
 * which is where a reader's attention actually sits.
 *
 * Every step is a real heading in document order and the rail is decorative, so
 * the sequence is fully readable with the progress line ignored.
 */
export const ScrollSpine = React.forwardRef<HTMLDivElement, ScrollSpineProps>(
  ({ className, steps, title, label = "Process", root, ...props }, forwardedRef) => {
    const [active, setActive] = React.useState(0);
    const itemRefs = React.useRef<Array<HTMLLIElement | null>>([]);

    React.useEffect(() => {
      if (typeof IntersectionObserver === "undefined") return;
      const nodes = itemRefs.current.filter(Boolean) as HTMLLIElement[];
      if (!nodes.length) return;
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting);
          if (!visible.length) return;
          const top = visible.reduce((best, entry) =>
            entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best);
          const index = nodes.indexOf(top.target as HTMLLIElement);
          if (index >= 0) setActive(index);
        },
        { root: root?.current ?? null, rootMargin: "-28% 0px -52% 0px", threshold: 0 },
      );
      nodes.forEach((node) => observer.observe(node));
      return () => observer.disconnect();
    }, [root, steps.length]);

    const progress = steps.length < 2 ? 1 : active / (steps.length - 1);

    return (
      <div {...props} ref={forwardedRef} data-open-ui="scroll-spine" className={cn("oui-spine", className)}>
        {title ? <h3 className="oui-spine__title">{title}</h3> : null}

        <ol className="oui-spine__list" aria-label={label}>
          <span
            className="oui-spine__rail"
            aria-hidden="true"
            style={{ "--oui-spine-progress": progress } as React.CSSProperties}
          />
          {steps.map((step, index) => (
            <li
              key={step.id}
              ref={(node) => { itemRefs.current[index] = node; }}
              className="oui-spine__step"
              data-state={index < active ? "done" : index === active ? "current" : "upcoming"}
              aria-current={index === active ? "step" : undefined}
            >
              <span className="oui-spine__node" aria-hidden="true" />
              <div className="oui-spine__copy">
                {step.meta ? <span className="oui-spine__meta">{step.meta}</span> : null}
                <strong className="oui-spine__stepTitle">{step.title}</strong>
                {step.body ? <div className="oui-spine__body">{step.body}</div> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  },
);
ScrollSpine.displayName = "ScrollSpine";

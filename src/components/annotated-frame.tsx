"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type Annotation = { id: string; x: number; y: number; label: string; body?: string };

export interface AnnotatedFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  annotations: readonly Annotation[];
  label?: string;
}

/**
 * A frame with numbered pins that explain what is in it.
 *
 * Pins are real buttons in document order, so the annotations can be tabbed
 * through and read aloud in sequence, which is the part a purely visual overlay
 * always loses. Opening one closes the others, so the frame never fills with
 * overlapping callouts.
 */
export const AnnotatedFrame = React.forwardRef<HTMLDivElement, AnnotatedFrameProps>(
  ({ className, children, annotations, label = "Annotated view", ...props }, ref) => {
    const [open, setOpen] = React.useState<string | null>(null);
    return (
      <div ref={ref} data-open-ui="annotated-frame" className={cn("oui-annotate", className)} aria-label={label} {...props}>
        <div className="oui-annotate__media">{children}</div>
        {annotations.map((pin, index) => (
          <div
            key={pin.id}
            className="oui-annotate__pin"
            data-open={open === pin.id || undefined}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <button
              type="button"
              aria-expanded={open === pin.id}
              aria-label={`Annotation ${index + 1}: ${pin.label}`}
              onClick={() => setOpen((current) => (current === pin.id ? null : pin.id))}
            >{index + 1}</button>
            <span className="oui-annotate__note" role="note">
              <strong>{pin.label}</strong>
              {pin.body ? <small>{pin.body}</small> : null}
            </span>
          </div>
        ))}
      </div>
    );
  },
);
AnnotatedFrame.displayName = "AnnotatedFrame";

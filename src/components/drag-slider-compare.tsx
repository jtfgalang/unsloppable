"use client";

import { useState, type ReactNode } from "react";

type DragSliderCompareProps = {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  initial?: number;
  className?: string;
};

export function DragSliderCompare({ before, after, beforeLabel = "Before", afterLabel = "After", initial = 50, className }: DragSliderCompareProps) {
  const [position, setPosition] = useState(initial);
  return <div className={`oui-drag-compare ${className ?? ""}`} style={{ "--oui-compare": `${position}%` } as React.CSSProperties}>
    <div className="oui-drag-compare__after">{after}<span>{afterLabel}</span></div>
    <div className="oui-drag-compare__before">{before}<span>{beforeLabel}</span></div>
    <div className="oui-drag-compare__handle" aria-hidden="true"><i>↔</i></div>
    <input aria-label="Reveal before and after" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} />
  </div>;
}

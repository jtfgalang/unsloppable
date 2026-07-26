"use client";

import { useState, type ReactNode } from "react";

type DiffFrameProps = {
  before: ReactNode;
  after: ReactNode;
  url?: string;
  initial?: number;
  className?: string;
};

export function DiffFrame({ before, after, url = "yourproduct.com", initial = 54, className }: DiffFrameProps) {
  const [position, setPosition] = useState(initial);
  return <div className={`oui-diff-frame ${className ?? ""}`} style={{ "--oui-diff": `${position}%` } as React.CSSProperties}>
    <header><div><i /><i /><i /></div><span>{url}</span><b>LIVE DIFF</b></header>
    <div className="oui-diff-frame__stage">
      <div className="oui-diff-frame__after">{after}<span>AFTER</span></div>
      <div className="oui-diff-frame__before">{before}<span>BEFORE</span></div>
      <div className="oui-diff-frame__handle" aria-hidden="true"><i>↔</i></div>
      <input aria-label="Reveal original and redesigned page" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} />
    </div>
  </div>;
}

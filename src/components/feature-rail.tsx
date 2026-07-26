"use client";

import { useState, type ReactNode } from "react";

export type FeatureRailItem = { id: string; title: string; description: string; media: ReactNode };
type FeatureRailProps = { items: FeatureRailItem[]; className?: string };

export function FeatureRail({ items, className }: FeatureRailProps) {
  const [active, setActive] = useState(items[0]?.id);
  const selected = items.find((item) => item.id === active) ?? items[0];
  return <div className={`oui-feature-rail ${className ?? ""}`}>
    <div role="tablist" aria-label="Product features">{items.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={item.id === active} onClick={() => setActive(item.id)}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{item.title}</strong><small>{item.description}</small></span></button>)}</div>
    <div className="oui-feature-rail__media" role="tabpanel" key={selected?.id}>{selected?.media}</div>
  </div>;
}

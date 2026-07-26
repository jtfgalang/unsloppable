"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type CompareValue = boolean | string;
export type CompareColumn = { id: string; label: string; featured?: boolean };
export type CompareRow = { id: string; label: string; values: readonly CompareValue[] };

export interface ComparisonTableProps extends Omit<React.HTMLAttributes<HTMLTableElement>, "children"> {
  columns: readonly CompareColumn[];
  rows: readonly CompareRow[];
  caption?: string;
}

/**
 * A feature comparison built as a real table.
 *
 * Rows carry proper `<th scope="row">` headers and columns carry `scope="col"`,
 * which is what lets a screen reader say "Priority scans, Team, included"
 * instead of reading a wall of loose ticks. A grid of divs cannot do that at
 * any price.
 *
 * Boolean cells pair their icon with visually-hidden text, so the answer never
 * depends on recognising a glyph.
 */
export const ComparisonTable = React.forwardRef<HTMLTableElement, ComparisonTableProps>(
  ({ className, columns, rows, caption, ...props }, ref) => (
    <table ref={ref} data-open-ui="comparison-table" className={cn("oui-compare", className)} {...props}>
      {caption ? <caption className="oui-compare__caption">{caption}</caption> : null}
      <thead>
        <tr>
          <th scope="col"><span className="oui-compare__sr">Feature</span></th>
          {columns.map((column) => (
            <th scope="col" key={column.id} data-featured={column.featured || undefined}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row">{row.label}</th>
            {row.values.map((value, index) => (
              <td key={columns[index]?.id ?? index} data-featured={columns[index]?.featured || undefined}>
                {typeof value === "boolean" ? (
                  <>
                    <span className="oui-compare__mark" data-on={value || undefined} aria-hidden="true">
                      {value
                        ? <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="m3.5 8.3 3 3 6-6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M4.6 4.6l6.8 6.8M11.4 4.6l-6.8 6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
                    </span>
                    <span className="oui-compare__sr">{value ? "Included" : "Not included"}</span>
                  </>
                ) : value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
);
ComparisonTable.displayName = "ComparisonTable";

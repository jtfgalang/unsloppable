"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface FileDropProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop" | "onChange"> {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}

/**
 * A drop zone that is also a real file input.
 *
 * Drag and drop is the enhancement, never the only route: the whole zone is a
 * label bound to a native input, so clicking, tabbing, and pressing Enter all
 * open the picker. A zone that only accepts a drag is unusable by keyboard and
 * on most touch devices.
 *
 * Accepted files are listed after selection, because silently swallowing a drop
 * is the most common failure of this pattern.
 */
export const FileDrop = React.forwardRef<HTMLInputElement, FileDropProps>(
  ({ className, label = "Drop files here", hint = "or browse from your device", accept, multiple = true, onFiles, ...props }, ref) => {
    const [over, setOver] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const id = React.useId().replace(/:/g, "");

    const take = (list: FileList | null) => {
      const next = Array.from(list ?? []);
      if (!next.length) return;
      setFiles(next);
      onFiles?.(next);
    };

    return (
      <div
        data-open-ui="file-drop"
        data-over={over || undefined}
        className={cn("oui-filedrop", className)}
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); take(event.dataTransfer.files); }}
        {...props}
      >
        <label className="oui-filedrop__zone" htmlFor={`${id}-file`}>
          <span className="oui-filedrop__glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 16V5m0 0L8 9m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <strong>{label}</strong>
          <small>{hint}</small>
          <input
            ref={ref}
            id={`${id}-file`}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(event) => take(event.target.files)}
          />
        </label>

        {files.length ? (
          <ul className="oui-filedrop__list" aria-live="polite">
            {files.map((file) => (
              <li key={file.name}>
                <span>{file.name}</span>
                <em>{Math.max(1, Math.round(file.size / 1024))} KB</em>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
);
FileDrop.displayName = "FileDrop";

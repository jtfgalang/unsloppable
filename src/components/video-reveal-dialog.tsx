"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

const subscribe = () => () => undefined;
const useMounted = () => React.useSyncExternalStore(subscribe, () => true, () => false);

export interface VideoRevealDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Poster shown on the trigger. */
  poster: string;
  posterAlt: string;
  src: string;
  title?: string;
}

/**
 * A poster that opens its video in a focus-trapped dialog.
 *
 * The video only mounts when the dialog opens, so a page with several of these
 * does not fetch several videos it may never play. Escape closes, the overlay
 * closes, and focus returns to the trigger.
 *
 * The dialog is portalled to the body, so `position: fixed` resolves against the
 * viewport rather than against whatever transformed ancestor it sits in.
 */
export const VideoRevealDialog = React.forwardRef<HTMLDivElement, VideoRevealDialogProps>(
  ({ className, poster, posterAlt, src, title = "Watch the walkthrough", ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const mounted = useMounted();
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);

    React.useEffect(() => {
      if (!open) return;
      const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const close = () => { setOpen(false); triggerRef.current?.focus(); };

    return (
      <div ref={ref} data-open-ui="video-reveal-dialog" className={cn("oui-videodialog", className)} {...props}>
        <button ref={triggerRef} type="button" className="oui-videodialog__trigger" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <img src={poster} alt={posterAlt} />
          <span className="oui-videodialog__play" aria-hidden="true">▶</span>
          <span className="oui-videodialog__label">{title}</span>
        </button>

        {mounted && open
          ? createPortal(
              <div className="oui-videodialog__overlay" role="dialog" aria-modal="true" aria-label={title}>
                <button type="button" className="oui-videodialog__scrim" aria-label="Close" onClick={close} />
                <div className="oui-videodialog__frame">
                  {/* Mounted only while open, so the video is never fetched early. */}
                  <video src={src} poster={poster} controls autoPlay playsInline />
                  <button type="button" className="oui-videodialog__close" onClick={close} aria-label="Close video">✕</button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  },
);
VideoRevealDialog.displayName = "VideoRevealDialog";

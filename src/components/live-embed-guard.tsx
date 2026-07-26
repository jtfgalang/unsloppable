"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface LiveEmbedGuardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The iframe URL, loaded only after consent. */
  src: string;
  title: string;
  provider?: string;
  /** Aspect ratio for the reserved box. */
  ratio?: number;
  poster?: string;
}

/**
 * A consent gate in front of a third-party embed.
 *
 * The iframe is not loaded until the visitor asks for it, so a page full of
 * embeds does not silently phone out to a dozen third parties, set their
 * cookies, and tank both privacy and load time on first paint. The placeholder
 * names the provider, so the choice is informed rather than a blind "load".
 *
 * The reserved box holds the embed's aspect ratio, so accepting never shifts the
 * layout.
 */
export const LiveEmbedGuard = React.forwardRef<HTMLDivElement, LiveEmbedGuardProps>(
  ({ className, src, title, provider = "a third party", ratio = 16 / 9, poster, ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(false);
    return (
      <div
        ref={ref}
        data-open-ui="live-embed-guard"
        className={cn("oui-embedguard", className)}
        style={{ "--oui-embedguard-ratio": ratio } as React.CSSProperties}
        {...props}
      >
        {loaded ? (
          <iframe className="oui-embedguard__frame" src={src} title={title} loading="lazy" allowFullScreen />
        ) : (
          <button type="button" className="oui-embedguard__gate" onClick={() => setLoaded(true)} style={poster ? { backgroundImage: `url(${poster})` } : undefined}>
            <span className="oui-embedguard__glyph" aria-hidden="true">▶</span>
            <span className="oui-embedguard__copy">
              <strong>{title}</strong>
              <small>Loads content from {provider}. Nothing is requested until you choose to.</small>
            </span>
          </button>
        )}
      </div>
    );
  },
);
LiveEmbedGuard.displayName = "LiveEmbedGuard";

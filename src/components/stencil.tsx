"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface StencilProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The word or short phrase the media shows through. */
  children: string;
  /** Image or video URL shown through the letterforms. */
  src: string;
  /** Treat `src` as a video, which switches to the plate knockout. */
  video?: boolean;
  /** Still frame behind the letterforms before a video plays, and instead of it
   *  for a reader who asked for less motion. */
  poster?: string;
  /** How the media fills the letterforms. */
  fit?: "cover" | "contain";
  /** Focal point, as a CSS object-position / background-position value. */
  focalPoint?: string;
  /** Video only: the plate the letters are cut out of. */
  plate?: "dark" | "light";
}

/**
 * A phrase cut out of a plate, with media showing through the cut.
 *
 * TWO PATHS, AND WHY THE SECOND ONE CHANGED. A still image is simplest as a
 * background clipped by the glyphs: `background-clip: text` needs no extra
 * element, sits on any ground, and the type is ordinary selectable text.
 *
 * Video cannot be a CSS background, and the obvious substitute, an inline SVG
 * `<mask>` holding a second copy of the string, was what this component used
 * to do, and it does not survive contact with a real page. The SVG glyphs are
 * laid out by a different engine from the HTML glyphs: the mask is centred on
 * its em box while the text sits on a line box, the two drift apart at every
 * font size, and any face the SVG cannot resolve silently masks the wrong
 * shape. It also required the string to exist twice.
 *
 * So the video path is a real stencil instead. An opaque plate sits over the
 * footage carrying the phrase in the opposite extreme, and one blend mode keeps
 * whichever is darker (or lighter). Outside the letters the plate wins; inside
 * them the footage does. The mask IS the rendered HTML text, so it lines up
 * perfectly by construction at any size, in any face, with no measurement and
 * no second copy of the string. The cost is that the plate owns its ground,
 * which is why the component draws both the plate and its ink rather than
 * inheriting either.
 *
 * DEGRADING ON PURPOSE. Three failures, three designed answers. If the media
 * never loads, a drawn gradient underneath it fills the glyphs, so they are
 * never an empty hole. If `background-clip: text` is unsupported, the phrase
 * falls back to solid ink. If a reader prefers reduced motion, the video is
 * never started and the poster stands in its place, which is a still frame
 * rather than a stopped one.
 *
 * The letterforms carry this component, so the defaults are set for mass: heavy
 * weight, tight tracking, and leading under 1 so a wrapped phrase reads as one
 * continuous window instead of separated strips.
 */
export const Stencil = React.forwardRef<HTMLSpanElement, StencilProps>(
  ({ className, children, src, video = false, poster, fit = "cover", focalPoint = "50% 50%", plate = "dark", style, ...props }, forwardedRef) => {
    const text = String(children ?? "");

    if (!video) {
      return (
        <span
          ref={forwardedRef}
          data-open-ui="stencil"
          className={cn("oui-stencil", className)}
          style={{
            // Layered under the media: a sheen that gives the cut an edge, and
            // a drawn ink that keeps the glyphs filled if the URL 404s.
            backgroundImage: `linear-gradient(180deg, color-mix(in srgb, #fff 12%, transparent), transparent 26%), url("${encodeURI(src)}"), var(--oui-stencil-ink)`,
            backgroundSize: `100% 100%, ${fit}, 100% 100%`,
            backgroundPosition: `50% 0, ${focalPoint}, 50% 50%`,
            ...style,
          } as React.CSSProperties}
          {...props}
        >
          {text}
        </span>
      );
    }

    return (
      <StencilPlate
        ref={forwardedRef}
        className={className}
        src={src}
        poster={poster}
        fit={fit}
        focalPoint={focalPoint}
        plate={plate}
        style={style}
        {...props}
      >
        {text}
      </StencilPlate>
    );
  },
);
Stencil.displayName = "Stencil";

type PlateProps = Omit<StencilProps, "video"> & { children: string };

const StencilPlate = React.forwardRef<HTMLSpanElement, PlateProps>(
  ({ className, children, src, poster, fit, focalPoint, plate, style, ...props }, forwardedRef) => {
    // Reduced motion is read directly rather than through the shared hook,
    // because that hook pulls in the motion library and this component ships
    // with no runtime dependencies at all.
    const [mayPlay, setMayPlay] = React.useState(false);

    React.useEffect(() => {
      const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      const sync = () => setMayPlay(!query?.matches);
      sync();
      query?.addEventListener?.("change", sync);
      return () => query?.removeEventListener?.("change", sync);
    }, []);

    return (
      <span
        ref={forwardedRef}
        data-open-ui="stencil"
        data-video="true"
        data-plate={plate}
        className={cn("oui-stencil oui-stencil--video", className)}
        style={{ backgroundImage: poster ? `url("${encodeURI(poster)}"), var(--oui-stencil-ink)` : "var(--oui-stencil-ink)", backgroundPosition: focalPoint, ...style } as React.CSSProperties}
        {...props}
      >
        {mayPlay ? (
          <video
            className="oui-stencil__media"
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            style={{ objectFit: fit, objectPosition: focalPoint }}
          />
        ) : null}
        {/* The plate carries the real, selectable phrase. It is also the mask. */}
        <span className="oui-stencil__plate">{children}</span>
      </span>
    );
  },
);
StencilPlate.displayName = "StencilPlate";

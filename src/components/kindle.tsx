"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface KindleProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /** Sparks in flight around the phrase. */
  count?: number;
  /** Ember color. Defaults to the theme accent. */
  color?: string;
  /** Base lifetime of one spark in seconds. Each spark varies around it. */
  duration?: number;
  /** Largest spark edge in pixels. Each spark varies below this. */
  size?: number;
}

/** Low-discrepancy constants. Deterministic placement, so server and client agree and nothing needs `Math.random`. */
const GOLDEN = 0.6180339887;
const SILVER = 0.7548776662;
const PLASTIC = 0.5698402909;
const frac = (value: number) => value - Math.floor(value);

/** Characters sampled before the walk gives up. A long paragraph is not what this is for. */
const SCAN_LIMIT = 240;

type Site = { left: string; top: string };
type Crown = { fx: number; dy: number };

/**
 * The topmost inked row of a glyph at three columns across it, in raster pixels
 * relative to the baseline. This is the whole difference between sparks coming
 * off the words and sparks coming off a rectangle: the crown of an "o" sits at
 * the x-height, an "l" reaches the ascender, and a comma has nothing up there at
 * all.
 */
function crownOf(ch: string, ctx: CanvasRenderingContext2D, font: string, ascent: number, descent: number): Crown[] {
  ctx.font = font;
  const advance = ctx.measureText(ch).width;
  if (!advance) return [];
  const pad = 2;
  const width = Math.ceil(advance) + pad * 2;
  const height = Math.ceil(ascent + descent) + pad * 2;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  // Resizing a canvas resets its context, so the font has to be set again after.
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(ch, pad, pad + ascent);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const crown: Crown[] = [];
  for (const fx of [0.26, 0.5, 0.74]) {
    const column = Math.min(width - 1, Math.round(pad + advance * fx));
    for (let y = 0; y < height; y += 1) {
      if (pixels[(y * width + column) * 4 + 3] > 24) {
        crown.push({ fx, dy: y - pad - ascent });
        break;
      }
    }
  }
  return crown;
}

/**
 * Emission points along the top contour of the rendered phrase, in pixels
 * relative to the host box.
 *
 * Character boxes come from a `Range` over the existing text nodes rather than
 * from per-character spans. Wrapping every letter would have been the obvious
 * route and it is the wrong one: it changes how the line shapes and breaks, and
 * it hands assistive tech a pile of one-letter elements to read. A Range reads
 * the layout the browser already did and touches nothing.
 */
function emissionPoints(text: HTMLElement, host: HTMLElement): { x: number; y: number }[] {
  const doc = text.ownerDocument;
  const styles = getComputedStyle(text);
  const fontSize = parseFloat(styles.fontSize) || 16;
  // Rasterising above this adds no contour detail and quadruples the pixels scanned.
  const raster = Math.min(fontSize, 72);
  const unit = fontSize / raster;
  const font = `${styles.fontStyle} ${styles.fontWeight} ${raster}px ${styles.fontFamily}`;

  // The canvas is only built once a character reports a real box, so an
  // environment that lays nothing out never allocates one.
  let ctx: CanvasRenderingContext2D | null = null;
  let ascent = raster * 0.8;
  let descent = raster * 0.2;
  const context = () => {
    if (ctx) return ctx;
    ctx = doc.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    ctx.font = font;
    const metrics = ctx.measureText("Hg");
    ascent = metrics.fontBoundingBoxAscent || ascent;
    descent = metrics.fontBoundingBoxDescent || descent;
    return ctx;
  };

  const origin = host.getBoundingClientRect();
  const crowns = new Map<string, Crown[]>();
  const points: { x: number; y: number }[] = [];
  const walker = doc.createTreeWalker(text, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let scanned = 0;

  for (let node = walker.nextNode(); node && scanned < SCAN_LIMIT; node = walker.nextNode()) {
    const value = node.nodeValue ?? "";
    for (let index = 0; index < value.length && scanned < SCAN_LIMIT; index += 1) {
      const ch = value[index];
      if (!ch.trim()) continue;
      scanned += 1;
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const box = range.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      let crown = crowns.get(ch);
      if (!crown) {
        const canvas = context();
        if (!canvas) return [];
        crown = crownOf(ch, canvas, font, ascent, descent);
        crowns.set(ch, crown);
      }
      // Where the baseline sits inside the character's line box, so the contour
      // lands on the glyph and not on the leading above it.
      const baseline = box.top + (box.height - (ascent + descent) * unit) / 2 + ascent * unit;
      for (const { fx, dy } of crown) {
        points.push({ x: box.left + fx * box.width - origin.left, y: baseline + dy * unit - origin.top });
      }
    }
  }
  return points;
}

/**
 * A phrase set alight, with sparks leaving the letters themselves.
 *
 * Two decisions carry this one.
 *
 * The sparks are emitted from the glyph contour. Every character's box is read
 * back from the layout with a `Range`, and its silhouette from a one-off canvas
 * raster, so an ember lifts off the crossbar of a "t" and the shoulder of an "n"
 * instead of off a box drawn around the phrase.
 *
 * The flight is CSS, not a canvas loop. A particle system was the obvious build
 * and it fails the one test that matters here: `requestAnimationFrame` stops in a
 * background tab and in an embedded preview, so the fire freezes and thaws. Each
 * spark is instead one element running one shared keyframe with its own lifetime,
 * drift, launch speed and negative delay, which means the field arrives already
 * mid-flight, never beats in unison, survives backgrounding, and costs the main
 * thread nothing after the single measuring pass.
 *
 * The words themselves never animate. They are ordinary text, fully legible with
 * no script at all, and the sparks are decorative siblings hidden from assistive
 * technology. Under reduced motion the embers settle onto the contour they came
 * from and hold there, which is a phrase rimmed in cooling light rather than an
 * animation caught mid-frame.
 */
export const Kindle = React.forwardRef<HTMLSpanElement, KindleProps>(
  ({ className, children, count = 9, color = "var(--style-accent, #6d4aff)", duration = 2.4, size = 6, style, ...props }, forwardedRef) => {
    const hostRef = React.useRef<HTMLSpanElement | null>(null);
    const textRef = React.useRef<HTMLSpanElement | null>(null);
    const total = Math.max(0, Math.round(count));
    const [sites, setSites] = React.useState<Site[] | null>(null);

    /** Pre-measurement placement: a scatter across the upper band of the phrase, which is where the contour will put them anyway. */
    const resting = React.useMemo<Site[]>(
      () => Array.from({ length: total }, (_, index) => ({
        left: `${(frac(index * GOLDEN) * 88 + 6).toFixed(2)}%`,
        top: `${(frac(index * SILVER) * 30 + 4).toFixed(2)}%`,
      })),
      [total],
    );

    const embers = React.useMemo(
      () => Array.from({ length: total }, (_, index) => {
        const a = frac(index * GOLDEN);
        const b = frac(index * SILVER);
        const c = frac(index * PLASTIC);
        const life = duration * (0.72 + c * 0.85);
        return {
          drift: `${((a * 2 - 1) * 26).toFixed(1)}px`,
          rise: `${(-(30 + b * 44)).toFixed(1)}px`,
          life: `${life.toFixed(2)}s`,
          // Negative, so the field is already burning on the first frame instead of
          // firing every spark at once.
          delay: `${(-life * a).toFixed(2)}s`,
          size: `${(size * (0.4 + b * 0.6)).toFixed(1)}px`,
        };
      }),
      [total, duration, size],
    );

    React.useEffect(() => {
      const host = hostRef.current;
      const text = textRef.current;
      if (!host || !text) return;
      let alive = true;
      let frame = 0;

      const measure = () => {
        frame = 0;
        if (!alive || !hostRef.current || !textRef.current) return;
        let points: { x: number; y: number }[] = [];
        try {
          points = emissionPoints(textRef.current, hostRef.current);
        } catch {
          // No 2d context, or a font the canvas cannot resolve. The deterministic
          // scatter is a designed fallback, not a broken state.
          points = [];
        }
        if (!points.length) return;
        setSites(Array.from({ length: total }, (_, index) => {
          const point = points[Math.floor(frac(index * GOLDEN) * points.length)];
          return { left: `${point.x.toFixed(1)}px`, top: `${point.y.toFixed(1)}px` };
        }));
      };

      // One pass per settled layout, never per frame.
      const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(measure); };
      schedule();
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
      observer?.observe(host);
      // A late webfont reflows the glyphs under the sparks, so the contour is read again.
      void document.fonts?.ready.then(schedule).catch(() => undefined);

      return () => {
        alive = false;
        if (frame) cancelAnimationFrame(frame);
        observer?.disconnect();
      };
    }, [total]);

    const placed = sites ?? resting;

    return (
      <span
        ref={(node) => {
          hostRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        data-open-ui="kindle"
        className={cn("oui-kindle", className)}
        style={{ "--oui-kindle-color": color, ...style } as React.CSSProperties}
        {...props}
      >
        <span className="oui-kindle__field" aria-hidden="true">
          {embers.map((ember, index) => (
            <i
              key={index}
              className="oui-kindle__spark"
              style={{
                left: placed[index]?.left,
                top: placed[index]?.top,
                "--oui-kindle-drift": ember.drift,
                "--oui-kindle-rise": ember.rise,
                "--oui-kindle-life": ember.life,
                "--oui-kindle-delay": ember.delay,
                "--oui-kindle-size": ember.size,
              } as React.CSSProperties}
            />
          ))}
        </span>
        <span className="oui-kindle__text" ref={textRef}>{children}</span>
      </span>
    );
  },
);
Kindle.displayName = "Kindle";

"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface KeystrokeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The line to type. Present in full in the DOM at every moment. */
  children: string;
  /** Base seconds per character. The rhythm is derived from it, not equal to it. */
  speed?: number;
  /** Delay before the first key lands, in seconds. */
  delay?: number;
  /** Type, hold, backspace, and repeat instead of typing once. */
  loop?: boolean;
  /** Seconds the finished line holds before erasing. Only used when looping. */
  hold?: number;
  /** Show the caret. */
  caret?: boolean;
}

/**
 * A line that types itself with a hand's rhythm rather than a metronome's.
 *
 * WHY NOT `steps()` ON WIDTH. The predecessor clipped the line to a width
 * animated in `ch` units. Three things were wrong with it: `width` is a layout
 * property, so every frame of the animation dirtied layout for everything after
 * it on the line; `ch` units meant the effect only lined up in a monospaced
 * face; and `steps()` is by definition a metronome, which is the one thing real
 * typing never is.
 *
 * WHAT REPLACED IT. The string is split into glyphs that all occupy their final
 * position from the first frame, so the line never reflows and nothing below it
 * ever moves. Each glyph carries two numbers computed once at render: when it
 * lands, and when the caret arrives in front of it. The browser does the rest
 * with one-shot CSS animations, so there is no clock in JavaScript at all on the
 * single-pass path.
 *
 * WHY NOT `requestAnimationFrame`. A hidden tab and an embedded preview both
 * suspend animation frames, which would strand the sentence half-typed and make
 * a working component look broken. CSS animations advance on the document
 * timeline, so a reader who leaves and comes back finds the line finished.
 *
 * THE RHYTHM. Letters inside a word burst; a space costs a beat; a comma costs
 * three; a full stop costs six and a half; a capital or a symbol costs the
 * shift key. On top of that each key gets a deterministic jitter, hashed from
 * its index and code rather than drawn from `Math.random`, so the server and
 * the client agree on the schedule and hydration is silent.
 *
 * THE CARET. It is steady while the hand is moving and blinks only once the
 * line is finished, which is how a real caret behaves and the detail that makes
 * the rest read as typing. It rides the glyph it is about to write, so it is
 * always in the right place without a single measurement.
 */

/** Integer hash, so the jitter is identical on the server and in the browser. */
function jitter(index: number, code: number) {
  let h = (Math.imul(index + 1, 2654435761) + Math.imul(code, 40503)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const SHIFTED = /[A-Z(){}[\]"'@#$%^&*_+|<>~?!:]/;

type Beat = {
  char: string;
  /** Seconds from t0 when the glyph appears. */
  at: number;
  /** Seconds from t0 when the caret arrives in front of it. */
  from: number;
};

function typeOut(text: string, speed: number, lead: number) {
  const beats: Beat[] = [];
  let clock = lead;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const previous = index > 0 ? text[index - 1] : "";
    let dwell = speed;
    // The hesitation belongs *after* the character that earned it.
    if (previous === " ") dwell += speed * 0.9;
    else if (previous === "\n") dwell += speed * 5;
    else if (previous === "," || previous === ";" || previous === ":") dwell += speed * 3;
    else if (previous === "." || previous === "!" || previous === "?") dwell += speed * 6.5;
    if (SHIFTED.test(char)) dwell += speed * 0.55;
    dwell *= 0.72 + jitter(index, char.charCodeAt(0)) * 0.64;
    const from = index === 0 ? 0 : clock;
    clock += dwell;
    beats.push({ char, at: clock, from });
  }
  return { beats, typed: clock };
}

export const Keystroke = React.forwardRef<HTMLSpanElement, KeystrokeProps>(
  ({ className, children, speed = 0.055, delay = 0.2, loop = false, hold = 2.2, caret = true, style, ...props }, forwardedRef) => {
    const text = String(children ?? "");

    const plan = React.useMemo(() => {
      const { beats, typed } = typeOut(text, speed, delay);
      // Backspacing is mechanical where typing is not, so the erase is even.
      const back = speed * 0.42;
      const eraseAt = typed + hold;
      const cycle = eraseAt + beats.length * back + 0.45;
      return { beats, typed, back, eraseAt, cycle };
    }, [delay, hold, speed, text]);

    // One state flip per full cycle, never per frame: re-keying the run is what
    // restarts the one-shot animations for the next pass.
    const [pass, setPass] = React.useState(0);

    React.useEffect(() => {
      if (!loop || plan.beats.length === 0) return;
      const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      let id = 0;
      const arm = () => {
        window.clearInterval(id);
        // Nothing is animating under reduced motion, so re-keying would only
        // churn the DOM for a line that is already complete.
        if (query?.matches) return;
        id = window.setInterval(() => setPass((previous) => previous + 1), plan.cycle * 1000);
      };
      arm();
      query?.addEventListener?.("change", arm);
      return () => { window.clearInterval(id); query?.removeEventListener?.("change", arm); };
    }, [loop, plan.beats.length, plan.cycle]);

    return (
      <span
        ref={forwardedRef}
        data-open-ui="keystroke"
        data-loop={loop || undefined}
        data-caret={caret || undefined}
        className={cn("oui-keystroke", className)}
        style={{
          // The caret parks after the last glyph, and stops blinking in time to
          // hand the job back to the travelling caret when a loop erases.
          "--oui-keystroke-rest": `${plan.typed}s`,
          "--oui-keystroke-blinks": loop ? Math.max(1, Math.round(hold / 1.06)) : "infinite",
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <span key={pass} className="oui-keystroke__line">
          {plan.beats.map((beat, index) => (
            <span
              key={index}
              className="oui-keystroke__glyph"
              style={{
                "--oui-k-at": `${beat.at}s`,
                "--oui-k-from": `${beat.from}s`,
                "--oui-k-span": `${beat.at - beat.from}s`,
                ...(loop
                  ? {
                      "--oui-k-gone": `${plan.eraseAt + (plan.beats.length - 1 - index) * plan.back}s`,
                      "--oui-k-back": `${plan.back}s`,
                    }
                  : null),
              } as React.CSSProperties}
            >
              {beat.char}
            </span>
          ))}
        </span>
        {caret ? <i className="oui-keystroke__caret" aria-hidden="true" /> : null}
      </span>
    );
  },
);
Keystroke.displayName = "Keystroke";

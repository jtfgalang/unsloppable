"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

type UnfurlProps<T extends React.ElementType> = {
  /** Semantic element to render. */
  as?: T;
  /** The phrase. One short statement, never body copy. */
  children: string;
  className?: string;
  /** Seconds before the first word turns up. */
  delay?: number;
  /** Seconds each word waits behind the one before it. */
  stagger?: number;
  /** Seconds for a single word to complete its fold. */
  duration?: number;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * `useLayoutEffect` warns when it runs on the server, and `useEffect` lands a
 * frame late, which is exactly long enough to show the finished phrase before
 * hiding it again. Picking per environment gets the client a pre-paint write and
 * leaves the server with the effect it can actually run.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * A phrase that turns up word by word, each one hinged on its own baseline like
 * a fold opening flat, in its own perspective so the near edge of the word
 * genuinely swings toward the reader instead of sliding up behind a mask.
 *
 * Three deliberate calls:
 *
 * 1. The fold runs as a CSS animation, not through the animation library. A
 *    frame loop stalls in a background tab and in embedded previews, and a
 *    stalled entrance is a phrase that never arrives. Keyframes keep running,
 *    and the whole entrance costs React nothing: the component sets two
 *    attributes on one node and never re-renders.
 * 2. It waits for the viewport. An entrance that fires on mount is spent before
 *    a reader below the fold ever sees it, and it is work done for nothing.
 * 3. The words are separated by ordinary spaces. The previous build joined them
 *    with `&nbsp;`, which reads as a space and refuses to break, so a phrase in
 *    a narrow column ran straight out of its box instead of wrapping.
 *
 * Nothing is hidden until the component itself arms the fold, so the server
 * markup, a client with JavaScript disabled, and the reduced-motion path all
 * render the finished phrase as plain selectable text.
 */
export function Unfurl<T extends React.ElementType = "span">({ as, children, className, delay = 0, stagger = 0.045, duration = 0.78, ...props }: UnfurlProps<T>) {
  const reduced = useHydratedReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const Tag = (as ?? "span") as React.ElementType;

  // Whitespace runs are kept as their own tokens so the original spacing, and
  // every wrap opportunity that comes with it, survives the split.
  const tokens = React.useMemo(() => {
    const parts = String(children).split(/(\s+)/).filter((part) => part.length > 0);
    const built: { gap: string; text: string; index: number }[] = [];
    let word = 0;
    for (const part of parts) {
      if (/^\s+$/.test(part)) built.push({ gap: part, text: "", index: -1 });
      else {
        built.push({ gap: "", text: part, index: word });
        word += 1;
      }
    }
    return built;
  }, [children]);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    /*
      Arming is the only thing here that hides a phrase, so it happens only when
      the signal that brings it back is certain to arrive. Reduced motion has
      nothing to wait for. A document that is hidden runs no observers, and one
      without `IntersectionObserver` cannot answer at all; in both, a phrase that
      armed would stay armed, which is the failure this component exists to
      avoid. All three settle instead, and settling is a style rather than a
      short animation, so a page that is painted once and never again still
      paints the whole phrase.
    */
    if (reduced || typeof IntersectionObserver === "undefined" || document.visibilityState === "hidden") {
      node.dataset.state = "rested";
      return;
    }

    node.dataset.state = "armed";

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.state = "lit";
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, children]);

  return (
    <Tag
      ref={ref}
      data-open-ui="unfurl"
      className={cn("oui-unfurl", className)}
      {...props}
      /* The timing lives on the wrapper and inherits down. Only the index is
         genuinely per-word, so a long phrase carries one number per word rather
         than four. */
      style={{
        ...(props as { style?: React.CSSProperties }).style,
        "--oui-unfurl-delay": `${delay}s`,
        "--oui-unfurl-stagger": `${stagger}s`,
        "--oui-unfurl-duration": `${duration}s`,
      } as React.CSSProperties}
    >
      {tokens.map((token, position) =>
        token.gap ? (
          <React.Fragment key={`gap-${position}`}>{token.gap}</React.Fragment>
        ) : (
          <span key={`word-${position}`} className="oui-unfurl__word" style={{ "--oui-unfurl-i": token.index } as React.CSSProperties}>
            <span className="oui-unfurl__face">{token.text}</span>
          </span>
        ),
      )}
    </Tag>
  );
}

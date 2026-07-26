/**
 * Cuts the authored stylesheet into a shared base and one slice per component.
 *
 * `app/open-ui.css` is the single authored file and stays that way: the site
 * imports it whole, and nothing here rewrites it. What this module does is
 * decide, for a registry payload, which of its rules a given component actually
 * needs, so that installing one component writes one component's CSS.
 *
 * It was worth doing because the alternative was measured. Every one of the 132
 * component payloads shipped the entire 200 KB file, which is 26 MB of the same
 * bytes repeated, and `unfurl` was 5 KB of source inside a 205 KB download.
 *
 * THE SPLIT IS BY WHAT THE SOURCE NAMES, not by the banner comments in the
 * stylesheet. Those banners carry display names ("Tempo (activity grid)") and
 * the class prefixes carry the effect name, while the registry key is the slug;
 * three vocabularies that have already drifted apart once. The component's own
 * `.tsx` is the only place that says, without ambiguity, which classes it puts
 * on the page.
 *
 * ORPHANS GO TO BASE. If a rule matches nothing, it lands in the file every
 * component installs, so a miss here makes a payload slightly larger rather than
 * a component slightly broken. That asymmetry is deliberate: this module is
 * allowed to be imprecise, and is not allowed to be wrong.
 */

/** A class, keyframe or custom property this codebase owns. */
const OUI = /(--)?\boui-[a-z0-9]+(?:[-_]{1,2}[a-z0-9]+)*/g;

/**
 * Splits CSS into top-level chunks, each carrying the comments written above it.
 *
 * Hand-rolled rather than a PostCSS pass because the comments ARE the content
 * here - most rules in this stylesheet are outnumbered by the paragraph
 * explaining them - and a parse/stringify round trip is a slow way to lose them.
 * Concatenating every chunk reproduces the input byte for byte, which the build
 * asserts.
 */
export function chunkCss(source) {
  const chunks = [];
  let index = 0;
  let start = 0;
  let depth = 0;

  while (index < source.length) {
    const char = source[index];
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end < 0 ? source.length : end + 2;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      index += 1;
      while (index < source.length && source[index] !== quote) index += source[index] === "\\" ? 2 : 1;
      index += 1;
      continue;
    }
    if (char === "{") { depth += 1; index += 1; continue; }
    if (char === "}") {
      depth -= 1;
      index += 1;
      if (depth === 0) { chunks.push(source.slice(start, index)); start = index; }
      continue;
    }
    /* A top-level `;` ends a statement like `@import` or `@charset`. */
    if (char === ";" && depth === 0) { index += 1; chunks.push(source.slice(start, index)); start = index; continue; }
    index += 1;
  }
  if (start < source.length) chunks.push(source.slice(start));
  return chunks;
}

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, " ");

/** Every selector prelude in a chunk, including the ones nested in `@media`. */
function preludes(chunk) {
  const bare = stripComments(chunk);
  const found = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < bare.length; index += 1) {
    const char = bare[index];
    if (char === "{") {
      const prelude = bare.slice(start, index).trim();
      /* Depth 0 is a top-level prelude; depth 1 inside an at-rule is a nested
         one. Deeper than that is a declaration block's own nesting. */
      if (depth <= 1 && prelude) found.push(prelude);
      depth += 1;
      start = index + 1;
    } else if (char === "}") {
      depth -= 1;
      start = index + 1;
    } else if (char === ";" && depth >= 1) {
      start = index + 1;
    }
  }
  return found;
}

/**
 * What a chunk provides and what it needs.
 *
 * `defines` is what a component can find it by: the classes in its preludes,
 * and its own name if it is a keyframe or a registered property. `uses` is what
 * has to come with it: the keyframes it animates and the custom properties it
 * reads. A rule selected for `unfurl` drags its keyframes along by `uses`, which
 * is why the keyframes never had to be matched by name.
 */
function describe(chunk) {
  const defines = new Set();
  const uses = new Set();
  const bare = stripComments(chunk);

  for (const prelude of preludes(chunk)) {
    for (const [match] of prelude.matchAll(OUI)) if (!match.startsWith("--")) defines.add(match);
  }

  const at = bare.match(/^\s*@([a-z-]+)\s+([^{;]*)/);
  if (at) {
    const [, name, rest] = at;
    if (name === "keyframes") {
      const keyframe = rest.trim().replace(/^['"]|['"]$/g, "");
      if (keyframe.startsWith("oui-")) defines.add(`@${keyframe}`);
    }
    if (name === "property") {
      const property = rest.trim();
      if (property.startsWith("--oui-")) defines.add(property);
    }
  }

  /* `:root` is where the tokens live; anything it declares is defined here. */
  for (const [match] of bare.matchAll(/--oui-[a-z0-9-]+(?=\s*:)/g)) defines.add(match);
  for (const [match] of bare.matchAll(/var\(\s*(--oui-[a-z0-9-]+)/g)) uses.add(match.slice(match.indexOf("--")));
  /* Animation shorthand and longhand both name keyframes positionally, so read
     the whole value and treat any `oui-` word in it as a candidate. */
  for (const [, value] of bare.matchAll(/\banimation(?:-name)?\s*:([^;}]*)/g)) {
    for (const [match] of value.matchAll(OUI)) if (!match.startsWith("--")) uses.add(`@${match}`);
  }

  return { text: chunk, defines, uses };
}

/**
 * Does a class defined in the stylesheet belong to a component that names
 * `token`? Matching runs both ways because the source writes both halves: a
 * component may hardcode `oui-device-frame--dark` while the rule is on
 * `.oui-device-frame`, or build `` `oui-dot-field--${fade}` `` from the stem
 * while the rule is on the full modifier.
 */
const related = (a, b) => a === b || a.startsWith(`${b}-`) || a.startsWith(`${b}_`) || b.startsWith(`${a}-`) || b.startsWith(`${a}_`);

export function analyseCss(source) {
  return chunkCss(source).map(describe);
}

/** Every `oui-` name a component's own source puts on the page. */
export function tokensIn(sources) {
  const tokens = new Set();
  for (const source of sources) for (const [match] of source.matchAll(OUI)) tokens.add(match);
  return tokens;
}

/**
 * The base: tokens, registered properties, and every rule no component claimed.
 *
 * Returns `{ base, sliceFor }`, where `sliceFor(tokens)` is the CSS for one
 * component. Base is computed once against every component's token set, so a
 * rule leaves base only when some component is definitely installing it.
 */
export function splitCss(source, tokenSets) {
  const chunks = analyseCss(source);

  /* Chunk indexes each component claims, before closure. */
  const claims = tokenSets.map((tokens) => {
    const claimed = new Set();
    chunks.forEach((chunk, index) => {
      for (const define of chunk.defines) {
        if (define.startsWith("@") || define.startsWith("--")) {
          if (tokens.has(define.slice(1)) || tokens.has(define)) { claimed.add(index); return; }
          continue;
        }
        for (const token of tokens) {
          if (token.startsWith("--")) continue;
          if (related(define, token)) { claimed.add(index); return; }
        }
      }
    });
    return claimed;
  });

  /* Pull in the keyframes and properties the claimed rules depend on, until
     nothing new arrives. Without this a slice would ship an `animation:` naming
     keyframes that stayed behind. */
  const providers = new Map();
  chunks.forEach((chunk, index) => {
    for (const define of chunk.defines) {
      if (!providers.has(define)) providers.set(define, []);
      providers.get(define).push(index);
    }
  });
  for (const claimed of claims) {
    const queue = [...claimed];
    while (queue.length) {
      for (const need of chunks[queue.shift()].uses) {
        for (const index of providers.get(need) ?? []) {
          if (!claimed.has(index)) { claimed.add(index); queue.push(index); }
        }
      }
    }
  }

  /* `:root` and `@property` are shared by construction: every component reads
     the duration, easing and ink tokens, and duplicating them per slice would
     put 40 copies of the same custom properties in a project that installed 40
     components. They stay in base and are removed from every claim. */
  const shared = new Set();
  chunks.forEach((chunk, index) => {
    const bare = stripComments(chunk.text).trim();
    if (bare.startsWith("@property") || /^:root\b/.test(bare)) shared.add(index);
  });
  for (const claimed of claims) for (const index of shared) claimed.delete(index);

  const anyClaim = new Set();
  for (const claimed of claims) for (const index of claimed) anyClaim.add(index);

  const base = chunks
    .map((chunk, index) => (anyClaim.has(index) ? "" : chunk.text))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const slices = claims.map((claimed) =>
    chunks
      .map((chunk, index) => (claimed.has(index) ? chunk.text : ""))
      .join("")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );

  return { base, slices, chunks };
}

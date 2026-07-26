import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { splitCss, tokensIn } from "./lib/split-open-ui-css.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "src/components");
const outputRoot = resolve(root, "r");

/** Specifiers the consuming project already provides, so they are never shipped or declared. */
const AMBIENT = new Set(["react", "react-dom", "@/lib/utils"]);
/** Import specifier -> npm package name, where they differ. */
const PACKAGE_OF = { "motion/react": "motion" };

export const MANIFEST = JSON.parse(await readFile(resolve(sourceRoot, "manifest.json"), "utf8")).components;

const IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g;

const exists = async (path) => { try { await access(path); return true; } catch { return false; } };

async function resolveLocal(specifier, fromDir) {
  for (const extension of [".tsx", ".ts"]) {
    const candidate = resolve(fromDir, `${specifier}${extension}`);
    if (await exists(candidate)) return candidate;
  }
  return null;
}

/**
 * Walks a component's import graph. Returns every local file that must ship with it
 * and every external package it depends on. Throws on an import that cannot be
 * installed into a consumer project, so the failure surfaces at build time.
 */
export async function collectComponent(slug) {
  const entry = resolve(sourceRoot, `${slug}.tsx`);
  if (!await exists(entry)) throw new Error(`open-ui: "${slug}" is in manifest.json but ${slug}.tsx does not exist.`);

  const files = new Map();
  const dependencies = new Set();
  const queue = [entry];

  while (queue.length) {
    const path = queue.shift();
    if (files.has(path)) continue;
    const source = await readFile(path, "utf8");
    files.set(path, source);

    for (const [, specifier] of source.matchAll(IMPORT)) {
      if (AMBIENT.has(specifier)) continue;
      if (specifier.startsWith(".")) {
        const resolved = await resolveLocal(specifier, dirname(path));
        if (!resolved) throw new Error(`open-ui: "${slug}" imports "${specifier}" which does not resolve to a .ts/.tsx file.`);
        queue.push(resolved);
        continue;
      }
      if (specifier.startsWith("@/")) {
        throw new Error(
          `open-ui: "${slug}" imports "${specifier}". Alias imports outside @/lib/utils cannot be installed by shadcn. ` +
          `Move the module into app/components/open-ui/ and import it relatively.`,
        );
      }
      const scoped = specifier.startsWith("@");
      dependencies.add(PACKAGE_OF[specifier] ?? specifier.split("/").slice(0, scoped ? 2 : 1).join("/"));
    }
  }

  return {
    files: [...files].map(([path, content]) => ({
      path: `components/open-ui/${path.slice(sourceRoot.length + 1)}`,
      content,
      type: "registry:ui",
    })),
    dependencies: [...dependencies].sort(),
  };
}

/** Where the published registry lives, so a payload can point at its own base. */
const ORIGIN = "https://unsloppable.style";
export const BASE_ITEM = "open-ui-base";
export const BASE_URL = `${ORIGIN}/r/${BASE_ITEM}.json`;
/** Registry path -> installed path is flattened by the CLI, so these end up as
    siblings of the component and `./name.css` resolves. Verified against the
    real `shadcn add`, not assumed. */
export const BASE_CSS_PATH = `components/open-ui/${BASE_ITEM}.css`;

/**
 * Adds the stylesheet imports to a component's entry file.
 *
 * The registry used to ship the whole 200 KB stylesheet and tell nobody to
 * import it: `shadcn add unfurl` wrote `src/components/open-ui.css`, left
 * `globals.css` untouched, and the component rendered unstyled. Every install
 * was broken, and it was broken quietly, which is the worst way for it to be.
 *
 * So the component imports its own CSS. A file the reader has to find and wire
 * up by hand is a file that stays unwired.
 *
 * AFTER the `"use client"` directive, never before it. A directive is only a
 * directive while it is the first statement in the file; an import above it
 * silently demotes it to a string expression, and the component becomes a
 * server component that throws on its first hook.
 */
function withStyleImports(source, imports) {
  const block = `${imports.map((path) => `import "${path}";`).join("\n")}\n`;
  const directive = source.match(/^\s*(["'])use (?:client|server)\1;?[^\S\n]*\n/);
  if (!directive) return `${block}\n${source}`;
  return `${directive[0]}\n${block}${source.slice(directive[0].length).replace(/^\n/, "")}`;
}

export async function buildRegistryItem(slug, css = "") {
  const { files, dependencies } = await collectComponent(slug);
  const entry = `components/open-ui/${slug}.tsx`;
  const styles = [`./${BASE_ITEM}.css`, ...(css ? [`./${slug}.css`] : [])];

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: slug,
    type: "registry:ui",
    dependencies,
    /* A full URL, because this is not shadcn's own registry and a bare name
       would resolve against theirs. */
    registryDependencies: [BASE_URL],
    files: [
      ...files.map((file) => (file.path === entry ? { ...file, content: withStyleImports(file.content, styles) } : file)),
      ...(css ? [{ path: `components/open-ui/${slug}.css`, content: `${css}\n`, type: "registry:ui" }] : []),
    ],
  };
}

const BASE_HEADER = `/*
  Unsloppable base: the tokens every component reads.

  Installed automatically as a dependency of any component, and imported by that
  component, so there is nothing to wire up. The component's own rules live
  beside it in its own file.

  Retint the library by overriding these in your own stylesheet after the import.
*/

`;

/**
 * Every published item, base first. The build writes these and the contract
 * test reads them, so the guardrail is checking the payload the reader gets
 * rather than a second implementation of it.
 */
export async function buildItems() {
  const source = await readFile(resolve(root, "src/open-ui.css"), "utf8");

  const tokenSets = [];
  for (const { slug } of MANIFEST) {
    const { files } = await collectComponent(slug);
    tokenSets.push(tokensIn(files.map((file) => file.content)));
  }
  const { base, slices } = splitCss(source, tokenSets);

  const items = [{
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: BASE_ITEM,
    type: "registry:ui",
    dependencies: /** @type {string[]} */ ([]),
    /* Empty rather than absent, so every published item has the same shape and
       a consumer can read the field without checking which kind it holds. */
    registryDependencies: /** @type {string[]} */ ([]),
    files: [{ path: BASE_CSS_PATH, content: `${BASE_HEADER}${base}\n`, type: "registry:ui" }],
  }];
  for (const [index, { slug }] of MANIFEST.entries()) items.push(await buildRegistryItem(slug, slices[index]));
  return items;
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const items = await buildItems();

  let bytes = 0;
  for (const item of items) {
    const json = `${JSON.stringify(item, null, 2)}\n`;
    bytes += json.length;
    await writeFile(resolve(outputRoot, `${item.name}.json`), json);
  }
  const base = items[0].files[0].content.length;
  const average = Math.round((bytes - base) / MANIFEST.length / 1024);
  console.log(`Generated ${MANIFEST.length} Open UI registry items plus ${BASE_ITEM} (${Math.round(base / 1024)} KB), averaging ${average} KB.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

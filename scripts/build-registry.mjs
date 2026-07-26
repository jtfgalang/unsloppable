import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "app/components/open-ui");
const outputRoot = resolve(root, "public/r");

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

export async function buildRegistryItem(slug, sharedCss) {
  const { files, dependencies } = await collectComponent(slug);
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: slug,
    type: "registry:ui",
    dependencies,
    files: [...files, { path: "styles/open-ui.css", content: sharedCss, type: "registry:style" }],
  };
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const sharedCss = await readFile(resolve(root, "app/open-ui.css"), "utf8");
  for (const { slug } of MANIFEST) {
    const item = await buildRegistryItem(slug, sharedCss);
    await writeFile(resolve(outputRoot, `${slug}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }
  console.log(`Generated ${MANIFEST.length} Open UI registry items.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

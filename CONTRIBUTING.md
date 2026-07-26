# Contributing

Add a component only when it is reusable across at least three page contexts and cannot be expressed by composing existing primitives.

## Adding a component

`manifest.json` is the single source of truth. The registry build, the library UI, and the demo map all derive from it.

1. Write `<slug>.tsx` in this folder.
2. Export it from `index.ts`.
3. Add one entry to `manifest.json`. Set `stable: true` if it should appear in `/library`, which also requires a demo.
4. Add metadata to `AUTHORED_COMPONENTS` in `app/lib/component-registry.ts`.
5. If stable, add `app/components/demos/<slug>-demo.tsx` and register it in `OPEN_UI_DEMOS`.
6. Add behavior tests to `tests/components.test.tsx`.

`tests/component-contract.test.ts` fails if any of steps 2–5 is missed, so a half-wired component breaks the suite instead of silently shipping. Run `npm test` before opening a pull request.

## Import rules

The registry publishes each component by walking its import graph, so imports decide what a consumer receives.

- **Relative imports are shipped.** `./use-hydrated-reduced-motion` and `./motion-tokens` are copied into the registry item automatically.
- **`@/lib/utils` is assumed.** shadcn provides `cn` in the consuming project.
- **Every other `@/` alias fails the build.** It would not resolve after `shadcn add`. Move the module into this folder and import it relatively.
- **Bare imports become declared dependencies.** They are derived from source, so `dependencies` in the registry metadata must match what the file actually imports; the contract test asserts this.

## Requirements

Every contribution must include:

- a typed public API with narrow defaults;
- keyboard and focus behavior for interactions;
- reduced-motion behavior for animation;
- a live workbench demo;
- usage and avoidance guidance;
- no invented product copy or proof.

Defaults must survive both surfaces. A component whose shell inverts with the color scheme cannot hard-code a white overlay — derive it from `currentColor` so it stays visible on either background.

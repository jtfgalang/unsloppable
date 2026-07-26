# Unsloppable

131 React components that do not look like everything else.

AI writes most interfaces now, and it writes the same one every time: the cream
background, the glass card, the gradient that means nothing, four features in a
row. That output has a look, everybody has learned to recognise it, and it reads
as a shortcut. This is the library for people who would rather not ship that.

Every component here is drawn rather than dropped in. No icon fonts, no stock
illustration, no image that stops matching your palette the moment you change
it. If it is on the screen it is CSS, SVG or canvas, which means it retints with
your theme, stays crisp at any size, adds nothing to your bundle, and carries
nobody else's trademark.

**[Browse the library](https://unsloppable.style/library)** ·
[Templates](https://unsloppable.style/templates) ·
[Design rules](https://unsloppable.style/library#principles)

## Install

Nothing to `npm install`. This is a [shadcn](https://ui.shadcn.com) registry, so
a component arrives as source in your repo and belongs to you from that moment.
Rename it, gut it, delete half of it. It is yours.

```bash
npx shadcn@latest add https://unsloppable.style/r/unfurl.json
```

Grab several at once:

```bash
npx shadcn@latest add https://unsloppable.style/r/lumen.json https://unsloppable.style/r/reckon.json https://unsloppable.style/r/drift.json
```

Then use it:

```tsx
import { Unfurl } from "@/components/ui/unfurl";

export function Hero() {
  return <Unfurl className="text-6xl">Ship something that looks authored.</Unfurl>;
}
```

Every component has a page in the library with its own install command, a live
demo you can poke at, the full prop table, and the reasoning for why it behaves
the way it does. Start at
**[unsloppable.style/library](https://unsloppable.style/library)**.

## Working with a coding agent

Point your agent at the registry and it can find and install components without
you naming files. The library exposes an MCP server:

```
https://unsloppable.style/api/mcp/library
```

Add it to Claude Code:

```bash
claude mcp add --transport http unsloppable https://unsloppable.style/api/mcp/library
```

Then ask for what you want in plain language. "Give me a pricing section with a
magnetic CTA" gets back real components and real install commands, instead of a
hallucinated import from a package that does not exist.

## What is in here

131 components across ten categories, 121 of them stable: loaders, typography,
interaction, motion, effects, media, structure and layout, proof and data, forms
and conversion, feedback and status.

A few worth opening first:

| | |
|---|---|
| [Lumen](https://unsloppable.style/library/lumen) | A border that lights where your pointer is |
| [Orrery](https://unsloppable.style/library/orrery) | Things in orbit, on real ellipses |
| [Shooting Stars](https://unsloppable.style/library/shooting-stars) | Meteors, but they actually arc |
| [Reckon](https://unsloppable.style/library/reckon) | Counts up without ever fabricating the final value |
| [Unfurl](https://unsloppable.style/library/unfurl) | Word-level entrance that still wraps like text |
| [Terra](https://unsloppable.style/library/terra) | Drawn, not a texture map |

## House styles

`StyleProvider` keeps behaviour separate from visual taste. Wrap anything in it
and the components inside take that style's palette and type, with no props
threaded through:

```tsx
<StyleProvider styleName="void">
  <MagneticButton>Get started</MagneticButton>
</StyleProvider>
```

Void, Aera and Concrete are the flagship three, across OLED dark, glass and
brutalist. The rest are at
[unsloppable.style/styles](https://unsloppable.style/styles).

## The rules every component follows

Not aspirations. This is the review checklist, and a component that fails one
does not ship.

1. **It is drawn.** No raster asset, no icon font, no third party's logo.
2. **It respects `prefers-reduced-motion`,** and not by freezing into a broken
   half state. It has a designed resting state that looks deliberate.
3. **It works on a keyboard** wherever there is something to interact with, with
   a focus ring that stays visible on light and dark grounds.
4. **It never invents content.** A number ticker lands on the number you gave
   it. A stat tile does not round your figure to something friendlier.
5. **It has one job.** Nothing here is a page section wearing a small name.

The full contract, including what is banned and why, is at
[unsloppable.style/library#principles](https://unsloppable.style/library#principles).

## Requirements

React 19, plus `clsx` and `tailwind-merge` for the `cn` helper that shadcn
projects already have. Components that animate pull in
[`motion`](https://motion.dev). The `shadcn` CLI installs what it needs.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md). Short version: a new component needs
authored source, a demo that shows it doing its actual job, a reduced motion
path, and a reason it is not just a div. Ideas without those stay Beta.

## License

MIT. Build a product with it, sell that product, no attribution required. See
[LICENSE](./LICENSE).

# Yuki — Renderer core + primitives (the engine)

**Mission:** the deterministic renderer — IR in, DOM out — and the 14 primitives at basic
fidelity. Every agent's output flows through your code. Read `PRD.md` §7.2, §9 and
`build/CONTRACT.md`.

## You own
- `render(node, ctx) -> HTMLElement` + the `PRIMITIVES` registry (one renderer per `type`).
- The 14 primitive renderers: card, collection, table, text, status, timeline, diff, chart,
  tree, graph, map, media, control. (Jonathan fills the `gate` renderer; you leave a slot.)
- **NEST** (containers render their `children`), **ANNOTATE** (fixed affordance mapping:
  confidence→badge, provenance→expandable, freshness→timestamp, uncertainty→interval, risk→badge),
  **ZOOM** (summary/full).
- **The fallback rule:** unknown/invalid type or any error → `Card(Text)` with raw JSON. NEVER throw.
- The static host page (like a single-file board) + a **raw-IR-visible toggle** next to each render.

## Depends on / provides
- Depends on: Valli's node shape (H0). **Provides: `render()` to everyone + the host page for the demo.**

## Talk to (who / when)
- **Valli — FIRST, H0.** Lock the node shape + `render()` signature. Don't build a primitive before this.
- **Jonathan — H0–H1.** Agree the `ctx`/`emit` interface: how primitives register, how LINK/BIND
  hook into `ctx`, and where the `gate` renderer plugs in.
- **Moon — H3+.** Make the four skins look genuinely good (esp. gstack + Linzumi — judges' own products).

## Build order (5h)
- **H0 (0:00–0:30):** lock node shape + `render()` sig with Valli.
- **H0.5–1.5:** card, collection, table, text, status + host page + the fallback rule.
- **H1.5–2.5:** timeline, diff, chart, tree + **NEST** (Table cell holds a Chart) + ANNOTATE.
- **H2.5–3.5:** graph, map, media, control + ZOOM + polish.
- **H3.5+:** polish the four skins with Moon.

## Done when
- All 14 render at basic fidelity; NEST works (a Table cell holds a Chart); an unknown type
  degrades to Card(Text) without throwing; the four skins render from the **unmodified** renderer.

## Priority
Build the primitives the four skins need FIRST: card, table, text, diff, gate(stub), status,
timeline, chart, collection. graph/map/media/tree can be basic boxes.

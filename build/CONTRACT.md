# Facet — the locked shared contract

**All four workstreams code to THIS.** Valli owns it; changes are broadcast loudly because
everyone is blocked on the schema. Lock it (Valli + Yuki) in the first 30 minutes, before
anyone builds a primitive. Full spec: `PRD.md` §7, §10.

## Document shape

```json
{
  "root": <node>,
  "data": { "...": "payload the IR binds against" },
  "links":  [ { "on": "<node_id>.select", "target": "<node_id>" } ],
  "params": { "<name>": <value> }
}
```

## Node shape (every primitive is this)

```json
{
  "type": "card|collection|table|tree|graph|timeline|chart|map|text|media|diff|control|gate|status",
  "id": "optional-string",
  "...": "type-specific fields, see PRD §7.2",
  "children": [ <node>, "..." ],          // NEST: any container slot holds any node
  "annotations": { "confidence": {}, "provenance": {}, "freshness": {}, "uncertainty": {}, "risk": {} },
  "zoom": "summary | full",
  "bind": "dotted.path.into.data"          // resolve a value from doc.data
}
```

- **No `value` primitive.** Scalars = `text` with `bind` + optional `format` (`currency|date|number`).
- `bind` resolves a dotted path from `doc.data`. `"{x.y}"` inside a string interpolates from data.

## Renderer API (Yuki owns; everyone calls it)

```
render(node, ctx) -> HTMLElement          // ctx = { data, params, emit }
PRIMITIVES[type] = (node, ctx) => HTMLElement   // registry, one per primitive
```

- **Fallback rule (mandatory):** unknown/invalid `type`, or any render error → `renderCardText(rawJSON)`.
  The renderer NEVER throws. Nothing fails to display; it only degrades. (PRD §7.1.4)

## Interaction (Jonathan owns)

- **LINK:** a node calls `ctx.emit("select", nodeId, payload)`; `doc.links` route `select → target`;
  the target re-renders with `payload` as its context. (Master-detail: select a row → detail Card.)
- **BIND (v0-lite, local only — no MCP):** a `params` store `{ get, set, subscribe }`. A `control`
  calls `set(param, val)`; subscribed nodes re-render. Showcase: the agent-run scrub (PRD use case #20).
- **Gate resolution event — EXACT shape (compliance depends on it):**

```json
{
  "gate_id": "gate_123",
  "resolution": "approve | deny | modify",
  "actor": "user_or_service_id",
  "timestamp": "ISO-8601",
  "effect_summary_hash": "sha256:...",
  "modifications": null,
  "comment": "optional"
}
```

## The 14 primitives (build these; PRD §7.2 has details)

card · collection · table · tree · graph · timeline · chart · map · text · media · diff · control · gate · status

## The 6 operators

NEST (v0) · LINK (v0) · BIND (v0-lite) · ANNOTATE (v0) · ZOOM (v0) · STREAM (v1, skip)

## Priority for a 5-hour build

Build the primitives the four demo skins need FIRST: **card, table, text, diff, gate, status,
timeline, chart, collection.** graph / map / media / tree can be basic. Gate is the centerpiece.

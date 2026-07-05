# PRD: Composable UI Kernel

**Working names:** Palette, Facet, IRis  
**Status:** Clean hackathon PRD v0.1  
**Date:** July 5, 2026  
**Decision:** Build the hackathon version as a **Skill + JSON Schema + static deterministic renderer**. Design, but do not overbuild, the MCP runtime for v1.

---

## 1. Executive summary

AI agents are increasingly good at producing structured work, but the human-facing output is still usually prose, raw JSON, or generated one-off UI code. That creates a bottleneck exactly where precision matters most: review, verification, and approval.

The **Composable UI Kernel** is a rendering layer for agent output. Agents emit a compact, typed intermediate representation (IR) against a closed vocabulary of **14 UI primitives** and **6 composition operators**. A deterministic renderer turns the IR into UI. Human interactions, especially approvals through **Gate**, return as structured, auditable events.

**One-liner:** Agents finish work in seconds, then wait on humans reading essays. We turn every agent answer into an interface you can act on at a glance, and every approval into an audit trail.

**Product thesis:** Dynamic UI should be compiled, not generated. The model fills out a schema; the renderer draws the interface.

**Hackathon wedge:** Do not pitch this as “all UI for all agents.” Pitch it as **auditable approval surfaces for agent decisions**, then show that the same kernel generalizes to dashboards, comparisons, workflows, and inspectors.

---

## 2. Problem

### 2.1 Human decision throughput is the bottleneck

Agent execution is fast. Human review is not. The decision often already exists in structured form inside agent state, but it is serialized into a chat message, a long summary, or raw JSON. The human becomes the parser.

### 2.2 The most consequential moments are the least structured

Approvals for merges, workflow steps, financial actions, contracts, data changes, or compliance exceptions often arrive as free text. That is slow to read, easy to misinterpret, and difficult to audit.

### 2.3 Existing approaches are weak in opposite ways

| Approach | Failure mode |
|---|---|
| Generated UI/code | Flexible, but unvalidatable, inconsistent, expensive in tokens, hard to certify, and often “dead” because clicks do not return structured state to the agent. |
| Vendor widget lists | Useful proof that structured UI helps, but closed, non-portable, usually non-composable, and not approval/audit-first. |
| Hand-built app integrations | Good UX, but slow and expensive to build per product, per workflow, and per customer. |

---

## 3. Product vision

Composable UI Kernel defines a small declarative language for agent-human interaction:

- **Closed vocabulary:** the renderer supports a fixed primitive set.
- **Open composition:** primitives can nest, link, bind, stream, annotate, and zoom.
- **Deterministic rendering:** the same valid IR renders the same way everywhere.
- **Graceful degradation:** invalid or unknown nodes degrade to `Card(Text)` rather than failing.
- **Structured interaction:** human decisions become data, not chat messages.

The long-term analogy is **HTML for agent-human interaction**. The practical starting point is narrower: **approval UI for agent workflows**.

---

## 4. Users and buyers

| User / buyer | Role | Need |
|---|---|---|
| Agent platform teams | Orchestration products, workflow builders, coding-agent platforms, internal agent infra | A reusable face for structured agent state without owning a full design system. |
| Human-in-the-loop operators | Engineers, PMs, analysts, loan officers, compliance reviewers | Decide and verify quickly, with the right context visible. |
| Agent developers | Developers using Claude Code, Cursor, custom harnesses, MCP tools | A drop-in skill/schema that upgrades agent output from prose to UI. |
| Compliance and audit teams | Regulated enterprises | Deterministic rendering and approval events that can become audit artifacts. |

---

## 5. Goals and non-goals

### 5.1 Product goals

1. Any schema-conformant agent output renders deterministically.
2. Human decisions return to the agent as structured events.
3. Common task UIs emerge from composition, not from one-off widgets.
4. The vocabulary remains small enough for models to emit reliably.
5. Approval moments are auditable by construction.

### 5.2 Hackathon success criteria

| Metric | Target |
|---|---|
| Schema validation | ≥95% first-try valid emissions across 50 varied prompts. |
| Renderer coverage | Static renderer supports all 14 primitives, plus at least NEST, ANNOTATE, and ZOOM. |
| Demo integrations | Four demos render through one unmodified schema/renderer path. |
| Live prompt | One unrehearsed prompt renders sensibly; `Card(Text)` fallback is acceptable, hallucinated unsupported widgets are not. |
| Token benchmark | Publish one measured comparison: generated UI/code vs. IR for the same view. |
| Gate proof | At least one approval surface produces a structured resolution event, even if mocked for the hackathon. |

### 5.3 Non-goals

- Free-form creation tools such as canvas editors, CAD, DAWs, or games.
- Full rich-text editing beyond form-like controls.
- Brand-expressive marketing UI.
- Sub-100ms interaction loops such as drawing or instruments.
- Consumer monetization.

Every non-goal gets an escape hatch: embed via `Media` or degrade to `Card(Text)`.

---

## 6. Product scope

### 6.1 v0: Hackathon MVP

The hackathon build should prove the risky core claim: **models can reliably emit compact valid IR, and one deterministic renderer can make it useful.**

**In scope:**

- `SKILL.md` that teaches an agent to emit the kernel IR.
- One versioned JSON Schema.
- Static one-way renderer: IR in, UI out.
- 14 primitives implemented at basic fidelity.
- Composition support for NEST, ANNOTATE, and ZOOM.
- Basic LINK state if feasible.
- Static/mock Gate UI with structured approval event output.
- Validation harness for 50 prompts.
- Token benchmark on one real example.
- Demo script and sample IRs.

**Out of scope for v0:**

- Full MCP runtime.
- Production BIND state management.
- Real STREAM subscriptions.
- Auth, permissions, retention policies, and enterprise audit export.
- Complete theming system.

### 6.2 v1: Product version

- MCP runtime with `render(ir)`.
- Gate round-trip as structured tool result.
- BIND parameter state and re-rendering.
- STREAM updates.
- Exportable audit log.
- Host-agnostic renderer embed API.
- First design partner integration.

---

## 7. Kernel specification

### 7.1 Design constraints

1. **Closed vocabulary, open composition.** No primitive is added for one use case.
2. **Every primitive has a schema, deterministic render, and interaction affordances.**
3. **Every container slot accepts any primitive.**
4. **Graceful degradation is mandatory.** Invalid or unrecognized IR renders as `Card(Text)`.

### 7.2 The 14 primitives

| # | Primitive | Purpose | Core affordance |
|---:|---|---|---|
| 1 | Card | A single entity or record. | Fields, optional media, optional actions. |
| 2 | Collection | A set of children. | `list`, `grid`, `carousel`, `feed`, `kanban`. |
| 3 | Table | Attribute-aligned comparison. | Rows as entities, columns as attributes, cells as primitives. |
| 4 | Tree | Hierarchy and containment. | Disclosure per node. |
| 5 | Graph | Arbitrary relations. | Nodes, edges, `dag` or `network`. |
| 6 | Timeline | Entities located in time. | Events, spans, Gantt-like views. |
| 7 | Chart | Quantitative magnitude. | Line, bar, scatter, area, distribution, heatmap. |
| 8 | Map | Spatial substrate. | Geo, floorplan, abstract canvas. |
| 9 | Text | Structured prose. | Inline entities, citations, chips, links. |
| 10 | Media | Opaque rich content. | Image, audio, video, file, 3D preview. |
| 11 | Diff | Aligned before/after comparison. | Text diff, table diff, graph diff, media overlay. |
| 12 | Control | User input as data. | Field, choice, range, toggle, always bound to a parameter. |
| 13 | Gate | Commitment point. | Effect summary plus approve, deny, or modify. |
| 14 | Status | Live process state. | Progress, phase, health, log tail. |

**Important schema rule:** There is no separate `Value` primitive in v0. Single values should render as `Text` with `bind` and optional `format`, or as a field inside `Card`. This keeps the closed-vocabulary claim clean.

### 7.3 The 6 composition operators

| Operator | Meaning | Example |
|---|---|---|
| NEST | Any primitive can appear inside container slots. | Table cell contains Chart; Graph node contains Card. |
| LINK | Selection in one component controls context in another. | Select a row, see detail Card. |
| BIND | Control updates a named parameter and re-renders subscribed views. | Budget slider updates projection Chart. |
| STREAM | Component subscribes to live data. | Status and Timeline update during an agent run. |
| ANNOTATE | Metadata attaches to any node through fixed affordances. | Confidence badge, provenance citation, uncertainty interval. |
| ZOOM | Primitive has summary and full fidelity levels. | Timeline zooms from eras to events to full Cards. |

### 7.4 Molecules

Molecules are named reusable compositions. They help the model emit reliable IR without adding primitives.

| Molecule | Formula |
|---|---|
| Comparison | `Table(rows=Card, annotated cells) + Control(filters) via BIND` |
| Dashboard | `Collection[grid](Chart | Status | Card) + STREAM` |
| Wizard / intake | `Collection[sequence](Control) + Gate` |
| Explorer | `Tree LINK Card` |
| Plan editor | `Graph[dag](nodes=Card+Status) + BIND(drag) + Gate` |
| Extraction view | `Text LINK Card(Controls, missing fields highlighted)` |
| Counterfactual | `Control(range) BIND (Chart | Graph | Table)` |
| Review queue | `Collection[feed](Diff + Gate)` |
| Monitor | `Timeline STREAM LINK Card` |
| Decision aid | `Collection(Card) + ANNOTATE(confidence, evidence) + Gate` |

---

## 8. Interaction model

### 8.1 Gate

`Gate` is the product’s most important primitive. It is not just a button. It is a commitment surface.

A Gate must render:

- The proposed action.
- A structured summary of effects.
- Reversibility.
- Blast radius.
- Evidence or context, usually nested as `Diff`, `Chart`, `Table`, `Map`, `Text`, or `Card`.
- Allowed resolutions: `approve`, `deny`, `modify`.

A Gate resolution must produce:

```json
{
  "gate_id": "gate_123",
  "resolution": "approve",
  "actor": "user_or_service_id",
  "timestamp": "2026-07-05T00:00:00Z",
  "effect_summary_hash": "sha256:...",
  "modifications": null,
  "comment": "optional human note"
}
```

For v0, this may be mocked. For v1, it must round-trip to the agent as a tool result and append to an audit log.

### 8.2 Control

A `Control` captures user intent as structured data. It always binds to a named parameter. In v0, controls may render statically or update local renderer state. In v1, parameter state is queryable by the agent and can re-render subscribed components without model regeneration.

### 8.3 Annotation

Annotations let the model emit metadata without designing UI.

| Annotation | Render affordance |
|---|---|
| Confidence | Badge, opacity, or score display. |
| Provenance | Expandable citation/source panel. |
| Freshness | Timestamp or staleness indicator. |
| Uncertainty | Interval, range band, or warning. |
| Risk | Badge and expandable rationale. |

---

## 9. Architecture

| Layer | Description | v0/v1 |
|---|---|---|
| Skill | `SKILL.md` containing grammar summary, schema, examples, molecules, and validation instruction. Shapes what the agent emits. | v0 |
| Schema | One JSON Schema shared by skill and runtime. The contract and long-term moat. | v0 |
| Renderer | Pure library: IR in, pixels out. Deterministic and host-agnostic. | v0 |
| MCP runtime | Protocol wrapper around renderer. Holds BIND state, manages STREAM, and returns Gate resolutions as structured tool results. | v1 |

**Architectural principle:** Renderer ≠ MCP server. The renderer is the engine. MCP is one vehicle that carries the engine and provides interaction round-trip.

**Why MCP matters later:** A skill can shape model output, but it cannot receive events. Gate resolutions, Control changes, and STREAM ticks are data flowing back to the agent. That requires a runtime protocol.

---

## 10. Data and IR contract

### 10.1 IR requirements

- Every node has a `type` from the 14-primitives vocabulary.
- Values come from data payloads through `bind` wherever possible.
- Components may include `annotations`, `zoom`, `children`, and operator declarations.
- Invalid nodes degrade to `Card(Text)`.
- The renderer never executes arbitrary model-generated code.

### 10.2 Example IR

```json
{
  "type": "table",
  "id": "flight_comparison",
  "rows": { "source": "results", "as": "flight" },
  "columns": [
    {
      "label": "Flight",
      "cell": {
        "type": "card",
        "title": { "bind": "flight.carrier" },
        "fields": [
          { "label": "Departure", "bind": "flight.dep" },
          { "label": "Arrival", "bind": "flight.arr" }
        ]
      }
    },
    {
      "label": "Price",
      "cell": {
        "type": "text",
        "bind": "flight.price",
        "format": "currency",
        "annotations": {
          "confidence": { "bind": "flight.price_stability" }
        }
      }
    },
    {
      "label": "Legs",
      "cell": {
        "type": "timeline",
        "items": { "bind": "flight.segments" },
        "zoom": "summary"
      }
    }
  ],
  "links": [
    { "on": "row.select", "target": "flight_detail" }
  ],
  "controls": [
    {
      "type": "control",
      "kind": "choice",
      "bind": "filter.stops",
      "options": [0, 1, 2]
    }
  ]
}
```

---

## 11. Demo plan

### 11.1 Recommended hackathon narrative

The pitch should be tighter than the full product vision.

1. **Show the pain:** A wall-of-text agent approval with the key decision buried inside.
2. **Show the primitive:** The same decision rendered as `Gate + Diff + Status`.
3. **Reveal the kernel:** 14 primitives, 6 operators, one schema.
4. **Show portability:** Same renderer, multiple “skins” or integrations.
5. **Close with audit:** The approval produces a structured event.

### 11.2 Demo script, 90 seconds

| Time | Beat |
|---|---|
| 0:00–0:10 | Wall of text with buried approval. “This is how agent decisions look today.” |
| 0:10–0:25 | 14-tile palette and schema. “Closed vocabulary, open composition.” |
| 0:25–0:45 | Skill demo: model emits validated IR and renderer displays it. |
| 0:45–1:05 | Workflow demo: intake Wizard, run Status, approval Gate, structured resolution event. |
| 1:05–1:20 | Data/review demo: Comparison molecule and Review Queue molecule. |
| 1:20–1:30 | Kicker: “We did not build four demos. We built one vocabulary and pointed it at four products.” |

### 11.3 Best demo centerpiece

Use **agent approval / run inspection**, not a generic dashboard.

Recommended centerpiece:

```text
Agent proposes file changes or workflow action
→ Diff shows what changes
→ Status shows checks/run state
→ Gate summarizes effects and asks approve/deny/modify
→ Gate resolution returns structured event
```

This makes the idea concrete, credible, and differentiated.

---

## 12. Evaluation plan

### 12.1 Emission reliability

Run 50 prompts across diverse task categories. For each model output, record:

- Valid JSON.
- Valid schema.
- No unsupported primitive types.
- Correct use of `bind` for payload values.
- Sensible fallback behavior.
- Primitive count per view.

Target: ≥95% first-try schema validity.

### 12.2 Token benchmark

Compare the same view in two modes:

1. Generated React or equivalent generated UI code.
2. Kernel IR.

Report:

- Output tokens.
- Validation or execution failures.
- Retry count.
- Time to first render.

Expected result: IR should be materially smaller and more reliable. Avoid quoting “10–50x” until measured.

### 12.3 Renderer benchmark

For v0, measure:

- Render success rate.
- Fallback rate.
- Time to render representative IR.
- Snapshot consistency across repeated runs.

---

## 13. Business model

### 13.1 Distribution

Open-source the skill and schema. Developers adopt it because it improves agent output immediately. Every adoption seeds the vocabulary.

### 13.2 First revenue

License the renderer/runtime to agent platforms and workflow products. Pricing options:

- Platform license.
- Usage-based per rendered session.
- Seat-based pricing through the host product.

### 13.3 Expansion revenue

Sell compliance-grade runtime capabilities to regulated enterprises:

- On-prem deployment.
- Certified renderer builds.
- Audit-log export and retention.
- Gate policy controls.
- Localization.

### 13.4 Do not monetize consumers directly

End users should experience this as “the interfaces inside my tools got better.” Platforms pay for runtime. Enterprises pay for audit. Developers pay nothing and drive distribution.

---

## 14. Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| v0 Hackathon | Skill, schema, static renderer, demo surfaces, validation harness. | One live demo, measured benchmark, useful fallback. |
| v0.5 Hardening | Schema versioning, prompt eval suite, examples, docs, publishable repo. | ≥95% valid emissions across ≥2 model families. |
| v1 Runtime | MCP server, Gate round-trip, BIND state, STREAM updates, audit log. | First real workflow approval resolved through Gate. |
| v1.5 Enterprise | On-prem, certified builds, retention/export, localization, policy controls. | First compliance-driven paid design partner. |

---

## 15. Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Too broad for hackathon | “HTML for agents” can sound abstract and impossible to finish. | Lead with Gate approval surfaces; show breadth only after the concrete demo lands. |
| Emission reliability is lower than expected | If models cannot emit valid IR, the product fails. | Use molecules as macros, include examples, validate-and-retry, keep schema small. |
| Schema creep | Every requested widget will pressure the primitive set. | New primitive requires proof that existing compositions cannot cover it. |
| Vendor competition | A major platform could bless its own widget vocabulary. | Be open, cross-platform, compliance-first, and host-agnostic. |
| MCP UI churn | Embedded UI conventions may change. | Keep renderer independent from MCP. Treat MCP as a channel, not the foundation. |
| Audit claims overreach | Compliance buyers will not accept vague “auditability.” | Define exact Gate event schema, hashes, actor identity, timestamps, and export format. |
| Generated demo looks fake | Judges may think it is a UI mock, not a kernel. | Keep composition tree and raw IR visible in the demo. |

---

## 16. Locked decisions (v0 — do NOT re-litigate during the build)

1. **Name: Facet.** (Taste call; `IRis` is the only fallback. Frozen for the build.)
2. **Positioning:** headline "the rendering layer for agent output"; **demo and sell through the auditable-approval (Gate) wedge.** Locked per §1 and §20.
3. **Schema governance:** single owner (Valli), one versioned JSON Schema, semver, additive-only within a major version. Anything beyond that is a v1 concern.
4. **Gate ↔ Relay:** they are the **same primitive** — a structured commit. Relay is the *optional commit-backend behind a Gate*. We build **only the UI kernel** for the demo; Relay is the Q&A answer to "what enforces the commit behind the Gate," not a second build.
5. **`Value` primitive:** stays **out** of v0. Scalars render as `Text` with `bind` + `format`, or as a `Card` field.
6. **Live interactivity:** v0 **must** include LINK (select→detail) and one BIND showcase (the agent-run scrub, use case #20). Static-only was the earlier plan; it is overruled — live interaction is the differentiator vs one-shot generators. STREAM/MCP stay v1.

## 16b. The build. See the four role files.

Shared contract every workstream codes to: `build/CONTRACT.md`.
Per-person briefs: `build/valli.md`, `build/jonathan.md`, `build/yuki.md`, `build/moon.md`.
The make-or-break seam: Valli + Yuki lock the IR node shape + `render()` signature in the first 30 minutes, before anyone builds a primitive.

---

## 17. Immediate next actions

1. Write `SKILL.md` with the grammar, schema summary, examples, molecules, and validation instruction.
2. Create the JSON Schema and enforce the 14-type vocabulary.
3. Build the static renderer.
4. Create 8–10 polished sample IR files, including one Gate-heavy approval surface.
5. Run the 50-prompt validation eval.
6. Measure generated-code vs. IR token usage on one real view.
7. Record the 90-second demo with raw IR and rendered UI side by side.

---

# Appendix A: Coverage catalog

This appendix is a proof aid, not the pitch. Keep it out of the main demo unless asked.

## Travel and local

1. Flight comparison — `Table(rows=Card(flight); price Text annotated; Timeline legs) + Controls(stops, airline) BIND`.
2. Trip itinerary — `Timeline LINK Map LINK Card(stop) + Gate(booking)`.
3. Restaurant picker — `Map LINK Collection[list](Card) + Controls(cuisine, price)`.
4. Visa / entry requirements — `Tree(country → conditions) + Card leaves + Text citations via ANNOTATE`.

## Commerce

5. Product comparison — `Comparison + Media thumbnails + Chart price-history sparklines`.
6. Checkout — `Collection(Card items) + Gate(total charge, shipping effects)`.
7. Price watch — `Chart STREAM + Gate(auto-buy policy)`.
8. Returns triage — `Wizard + Gate(refund/exchange effects)`.

## Finance

9. Portfolio dashboard — `Dashboard + Cards LINK per-asset Chart + Text thesis`.
10. Budget what-if — `Controls(savings, retirement age) BIND Chart + Table cashflows`.
11. Invoice extraction — `Text(invoice) LINK Card(fields as Controls)`.
12. Trade approval — `Gate(position delta, fees, exposure) + Chart context + ANNOTATE confidence`.
13. Expense audit — `Collection[feed](Card expense + Diff policy vs actual + Gate)`.

## Health

14. Symptom triage — `Wizard + Tree decision path + ZOOM`.
15. Lab results — `Table analytes + Chart history sparkline + ANNOTATE reference range`.
16. Medication schedule — `Timeline doses/courses + Status adherence + Gate interaction warning`.
17. Treatment decision aid — `Collection(Card options) + ANNOTATE evidence + Gate`.

## Dev tools and agents

18. Code review — `Tree(files) LINK Diff(code) + Card comments + Gate(merge) + Status(CI)`.
19. Stack-trace explorer — `Tree(frames) LINK Text(source) LINK Card(variable state)`.
20. Agent run inspector — `Timeline(steps) LINK Card(tool I/O) + Diff(state) + Control(scrub) BIND`.
21. Auto-derived approval surface — `Gate + nested Diff/Map/Card based on effect type`.
22. Plan steering — `Graph[dag] + BIND edits + Gate before resume`.
23. Eval results — `Table(runs × metrics with Chart cells) LINK Card transcript + Diff(two runs)`.
24. Incident response — `Status + Timeline STREAM + Graph dependencies + Gate mitigations`.
25. CI/CD pipeline — `Graph[dag](Status nodes) STREAM + LINK logs/artifacts`.
26. Shadow-mode comparison — `Diff(Table prod vs candidate) STREAM + Gate(promote)`.
27. Dependency upgrade — `Diff(lockfile) + Graph affected modules + Gate breaking changes`.

## Knowledge and research

28. Literature review — `Collection(Card papers) + Graph citations LINK Text synthesis`.
29. Fact-check — `Text claims ANNOTATE confidence LINK evidence Cards`.
30. Semantic-zoom conversation history — `ZOOM over Timeline(Text)`.
31. Competitive landscape — `Map[abstract-canvas] + Table feature matrix LINKed`.
32. Research monitor — `Collection[feed](Card result ANNOTATE relevance) STREAM + Control topics`.

## Paperwork and legal

33. Contract review — `Diff(template vs draft) + Text clauses LINK Card risk + Gate(sign)`.
34. Bureaucratic form from conversation — `Extraction view + missing fields + Gate(file)`.
35. Compliance checklist — `Tree requirements with Status + LINK evidence Cards`.
36. Visa application — `Wizard + Timeline deadlines + Status docs + Gate(submit)`.

## Ops and logistics

37. Fleet tracking — `Map STREAM LINK Timeline(vehicle) LINK Card(shipment)`.
38. Inventory — `Table STREAM + Chart velocity + Gate reorder`.
39. Shift scheduling — `Timeline[gantt](Card person) + Control drag BIND + Gate publish`.

## Education

40. Adaptive lesson — `Text + Control quiz BIND next content + Status mastery + Tree curriculum`.
41. Math counterfactual explorer — `Control(range) BIND Chart(function)`.
42. Spaced repetition drill — `Collection[carousel](Card prompt/reveal) + Status queue + Chart retention`.

## People and coordination

43. Candidate pipeline — `Collection[kanban](Card) LINK Card detail with Timeline + Text`.
44. Meeting scheduling — `Timeline availability + Control(slot) + Gate(send invites)`.
45. Outreach campaign — `Table contacts + Diff message variants + Gate(send)`.

## Creative, property, and science

46. Image iteration — `Collection[grid](Media) + Control(prompt delta) BIND regenerate + Diff(Media)`.
47. Home search — `Map LINK Table LINK Card + Control budget + ANNOTATE commute`.
48. Experiment monitor — `Chart training curves STREAM + Status + Gate early stop + Diff checkpoint`.

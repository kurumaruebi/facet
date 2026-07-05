# Jonathan — Interaction + Gate + emission (the differentiator)

**Mission:** build the **Gate** (the star primitive) and the live interaction that makes the
whole thing feel like software, not a screenshot — plus the model→IR emission path. Read
`PRD.md` §8, §11.3 and `build/CONTRACT.md`.

## You own
- **Gate primitive** (the centerpiece): renders the proposed action + a structured **effect
  summary** (reversibility, blast radius) + nested evidence (Diff/Status/Table/Card) +
  `approve | deny | modify`. On resolve, produces the **EXACT** event from CONTRACT
  (`gate_id, resolution, actor, timestamp, effect_summary_hash, modifications, comment`).
- **LINK** (select→detail): wire `ctx.emit("select", …)` → `doc.links` → target re-render.
- **BIND-lite** (local params store) + the **agent-run scrub** (PRD use case #20): drag the
  timeline position, the tool-call Card + before/after Diff recompute live. This is the "it's
  alive" beat — the differentiator vs one-shot generators. Do not skip it.
- **Emission path:** if there's an LLM key, wire `SKILL.md` → live model → IR for the live-prompt
  beat. No key → pre-capture emissions with Valli and play them back (still valid demo).

## Depends on / provides
- Depends on: Valli's schema (Gate node fields) + Yuki's renderer (register Gate, hook LINK/BIND
  into `ctx`). **Provides: the interaction layer + Gate events.**

## Talk to (who / when)
- **Yuki — H0–H1.** Agree the `ctx`/`emit` interface, primitive registration, and where Gate plugs in.
- **Valli — H0–H1.** Gate node fields + the emission path (skill → model → IR).

## Build order (5h)
- **H0 (0:00–0:30):** agree the interaction interface with Yuki.
- **H0.5–1.5:** the **Gate** primitive + structured resolution event. Build this early — it's the
  centerpiece and the whole pitch (auditable approval).
- **H1.5–2.5:** LINK (select→detail) working in ≥1 skin.
- **H2.5–3.5:** the agent-run scrub (BIND-lite) on use case #20.
- **H3.5+:** emission path / pre-captured emissions with Valli.

## Done when
- A Gate renders effect + nested evidence and resolves to a structured event (shown/logged);
  select→detail works in ≥1 skin; scrubbing the agent-run timeline recomputes the Card + Diff live.

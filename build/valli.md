# Valli — Schema + Skill (you are the contract)

**Mission:** own the IR schema and the `SKILL.md` that makes an agent emit valid IR. Everyone
codes to your schema; you are upstream of the whole build. Read `PRD.md` §7, §10, §12 and
`build/CONTRACT.md`.

## You own
- `build/CONTRACT.md` — finalize it in H0 (with Yuki).
- `schema/facet.schema.json` — the one versioned JSON Schema. 14 `type`s, closed vocabulary,
  `bind`, `children`, `annotations`, `zoom`. No `value` primitive (scalars = `text`+`bind`+`format`).
- `SKILL.md` — teaches a stock agent to emit valid IR: grammar summary, the 10 molecules as
  macros (PRD §7.4), 3-4 worked examples, and a **validate-and-retry** instruction.
- `eval/` — the 50-prompt validation harness (PRD §12.1).

## Depends on / provides
- Depends on: nothing (you're the source). **Provides: the schema + skill to EVERYONE.**

## Talk to (who / when)
- **Yuki — FIRST, H0, 30 min.** Lock the node shape + `render()` signature together so schema
  and renderer agree. This is the make-or-break seam. Nobody builds primitives until it's locked.
- After H0 you're mostly async, but **broadcast any schema change loudly** — everyone is blocked on it.
- Moon reports IR that won't validate → you fix the schema or the skill.

## Build order (5h)
- **H0 (0:00–0:30):** lock CONTRACT + node shape + `render()` sig with Yuki.
- **H0.5–1.5:** JSON Schema (14 types) + first `SKILL.md` draft + 3 worked examples.
- **H1.5–2.5:** molecules as macros + validate-and-retry loop.
- **H2.5–3.5:** run the 50-prompt eval. **Needs an LLM key.** No key → curate pre-captured
  emissions with Jonathan instead, and note it in the demo.
- **H3.5+:** unblock Moon on any skin that won't validate.

## Done when
- 14 types in the schema; ≥95% first-try valid emissions across the eval set; `SKILL.md` makes a
  stock agent emit valid IR for the four demo skins.

## Hard rule
Never add a primitive to fit a use case. A new primitive requires proof that existing
compositions can't cover it. Closure is the product.

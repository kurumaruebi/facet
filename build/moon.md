# Moon — Skins + demo + pitch + benchmark (win the room)

**Mission:** turn the engine into a demo that wins — the four company skins, the 90-second
narrative, the pitch, and the two proof points (token benchmark, Gate audit event). You are the
integration canary: you author IR early and surface breakage fast. Read `PRD.md` §11, §12.2, §13.

## You own
- **The four sample-IR skins** (all validate against Valli's schema, all render in Yuki's renderer):
  1. **gstack** — a `/review` output → `Collection[feed]( Card(finding) + Diff(code) + Gate(apply/skip) )`.
     (Real data available from prior gstack runs. This flatters the lead judge; lead the montage with it.)
  2. **Linzumi** — an agent unblock request → `Gate + Diff + Status` (Review Queue molecule). This IS
     their thesis; use case #21.
  3. **Crustdata** — a data query → `Table(Card) + Chart(sparkline) + Timeline` + ANNOTATE(freshness).
  4. **Jinba** — a workflow → intake `Wizard + Status + Timeline + Gate` (compliance angle).
- **Composition-tree-visible view** + raw-IR shown next to each render (kills "it's a mock").
- **The 90s demo script** (PRD §11.2) + recording a backup video.
- **The pitch:** lead with the wall-of-text pain → the Gate → "one vocabulary, four products."
  Keep the vocabulary/IR jargon for Q&A. Kicker: *"We didn't build four demos; we built one
  vocabulary and pointed it at your companies."*
- **Token benchmark** (PRD §12.2): generated React vs IR for ONE view. Report a measured number;
  do NOT claim "10-50x" until measured.
- **Loaded Q&A**, including the **Gate ↔ Relay** answer: "the Gate resolution is a structured
  commit; Relay is the backend that enforces it safely across owners." (Q&A only, not a second build.)

## Depends on / provides
- Depends on: Valli's schema (author IR against it) + Yuki's renderer (skins must render).
  **Provides: the demo + the pitch.**

## Talk to (who / when)
- **Valli** — report any IR that won't validate, continuously.
- **Yuki** — report render gaps; drive the four skins' polish from H3.
- Start authoring the **gstack** skin IR in **H0** against the draft schema; don't wait for the renderer.

## Build order (5h)
- **H0:** start the gstack skin IR. **H1:** Linzumi + Crustdata skins. **H2:** Jinba skin +
  composition-tree view. **H2.5:** token benchmark on one view. **H3–4:** polish skins (esp.
  gstack + Linzumi) + write the pitch. **H4–5:** rehearse ×3 + record the backup video.

## Done when
- Four skins render from one unmodified renderer, raw IR visible beside each; 90s script rehearsed;
  one measured token number; pitch leads with the wedge (auditable approval), not the mechanism.

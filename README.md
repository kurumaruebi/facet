# Facet

A rendering layer for agent output. Agents emit a typed **IR** against a closed vocabulary of
**14 UI primitives + 6 composition operators**; a **deterministic renderer** turns it into UI.
Human decisions — especially the **Gate** approval primitive — return as structured, auditable events.

**Thesis:** dynamic UI should be *compiled, not generated*. The model fills out a schema; the
renderer draws the interface.

**Wedge:** auditable approval surfaces for agent decisions, then generalize to dashboards,
comparisons, workflows, and inspectors.

Built at the c0mpiled in Japan pt 3 hackathon (YC RFS Summer 2026 — Software for Agents / Dynamic
Software Interfaces).

## Repo

- `PRD.md` — the product spec and 5-hour build plan (source of truth).
- `build/CONTRACT.md` — the locked shared IR contract; everyone codes to this.
- `build/{valli,yuki,jonathan,moon}.md` — per-person build briefs.

The renderer is a plain library (`render(ir) → DOM`), not an MCP server. MCP is v1.

## gstack

This repo requires [gstack](https://github.com/garrytan/gstack) for AI-assisted work. Install once:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Then restart your AI coding tool. See `CLAUDE.md`.

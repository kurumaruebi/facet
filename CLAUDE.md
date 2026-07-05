# Facet — composable UI kernel (hackathon build)

**What we're building:** a rendering layer for agent output. Agents emit a typed IR
against a closed vocabulary of 14 UI primitives + 6 composition operators; a deterministic
renderer turns the IR into UI. Human decisions (especially the **Gate** approval primitive)
return as structured, auditable events. **The wedge: auditable approval surfaces for agent
decisions**, then generalize.

- **Source of truth:** `PRD.md`.
- **Shared contract everyone codes to:** `build/CONTRACT.md`. Lock it before building primitives.
- **Your job:** `build/valli.md`, `build/jonathan.md`, `build/yuki.md`, `build/moon.md`.

The renderer is a **plain library** (`render(ir) → DOM`), NOT an MCP server. MCP is v1.

---

# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:

- `/office-hours`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/design-consultation`
- `/design-shotgun`
- `/design-html`
- `/review`
- `/ship`
- `/land-and-deploy`
- `/canary`
- `/benchmark`
- `/browse`
- `/connect-chrome`
- `/qa`
- `/qa-only`
- `/design-review`
- `/setup-browser-cookies`
- `/setup-deploy`
- `/setup-gbrain`
- `/retro`
- `/investigate`
- `/document-release`
- `/document-generate`
- `/codex`
- `/cso`
- `/autoplan`
- `/plan-devex-review`
- `/devex-review`
- `/careful`
- `/freeze`
- `/guard`
- `/unfreeze`
- `/gstack-upgrade`
- `/learn`

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

- Product ideas / brainstorming → `/office-hours`
- Strategy / scope → `/plan-ceo-review`
- Architecture → `/plan-eng-review`
- Design/UI review → `/design-review` or `/design-consultation`
- Bugs / errors → `/investigate`
- QA / does-it-work → `/qa`
- Code review before landing → `/review`
- Ship / deploy / PR → `/ship`

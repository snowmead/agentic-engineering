# Primitives

Reusable agent primitives — skills, plugins, and supporting tools used across AI coding environments.

Skills follow the [Agent Skills](https://agentskills.io/) open standard (`SKILL.md` + optional scripts/references/assets). They live under [`.agents/skills/`](.agents/skills/), the cross-client project path used by Cursor, VS Code / Copilot, and other compatible agents ([spec](https://agentskills.io/specification), [quickstart](https://agentskills.io/skill-creation/quickstart)).

## Installation

### All agents

Works with any host supported by the [skills CLI](https://github.com/vercel-labs/skills) (Cursor, Claude Code, Codex, Copilot, Gemini, OpenCode, Windsurf, and many more):

```bash
bunx skills add snowmead/agentic-engineering
```

Target specific agents with `-a` (repeatable), e.g. `-a cursor -a claude-code`.

<details>
<summary><strong>Cursor</strong></summary>

Skills:

```bash
bunx skills add snowmead/agentic-engineering -a cursor
```

As a Cursor plugin (uses [`.cursor-plugin/`](.cursor-plugin/)):

- Install from the [Cursor Marketplace](https://cursor.com/marketplace) or in-editor with `/add-plugin`
- On Teams/Enterprise: import this GitHub repo as a [team marketplace](https://cursor.com/docs/plugins) under **Dashboard → Plugins**

</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude plugin marketplace add snowmead/agentic-engineering
claude plugin install primitives@primitives
```

Or from Claude chat:

```text
/plugin marketplace add snowmead/agentic-engineering
/plugin install primitives@primitives
```

</details>

<details>
<summary><strong>Codex</strong></summary>

```bash
codex plugin marketplace add snowmead/agentic-engineering
codex plugin add primitives@primitives
```

Skills-only (no plugin marketplace):

```bash
bunx skills add snowmead/agentic-engineering -a codex
```

</details>

<details>
<summary><strong>Pi</strong></summary>

```bash
pi install git:github.com/snowmead/agentic-engineering
```

</details>

## Contents

| Path | What it is |
|------|------------|
| [`.agents/skills/`](.agents/skills/) | Agent Skills (open standard) |
| [`.cursor-plugin/`](.cursor-plugin/) | Cursor plugin |
| [`.claude-plugin/`](.claude-plugin/) | Claude Code plugin + marketplace |
| [`.codex-plugin/`](.codex-plugin/) | Codex plugin |
| [`.agents/plugins/`](.agents/plugins/) | Codex marketplace |
| [`package.json`](package.json) | Pi package manifest |

### Skills

| Skill | Description |
|-------|-------------|
| [`map`](.agents/skills/map/) | Interactive codebase map (Cursor Canvas or Bun React) |

## License

MIT — see [LICENSE](LICENSE).

# Agentic Engineering

Personal toolkit for agentic engineering — skills, plugins, and supporting tools used across AI coding environments.

Skills follow the [Agent Skills](https://agentskills.io/) open standard (`SKILL.md` + optional scripts/references/assets). They live under [`.agents/skills/`](.agents/skills/), the cross-client project path used by Cursor, VS Code / Copilot, and other compatible agents ([spec](https://agentskills.io/specification), [quickstart](https://agentskills.io/skill-creation/quickstart)).

## Installation

```bash
bunx skills add snowmead/agentic-engineering
```

Optional native plugins/packages (same skills, no duplication):

| Host | Packaging |
|------|-----------|
| Cursor | [`.cursor-plugin/`](.cursor-plugin/) |
| Claude Code | [`.claude-plugin/`](.claude-plugin/) |
| Codex | [`.codex-plugin/`](.codex-plugin/) |
| Pi | [`package.json`](package.json) `pi.skills` — `pi install git:github.com/snowmead/agentic-engineering` or a local path |

## Contents

| Path | What it is |
|------|------------|
| [`.agents/skills/`](.agents/skills/) | Agent Skills (open standard) |
| [`.cursor-plugin/`](.cursor-plugin/) | Cursor plugin |
| [`.claude-plugin/`](.claude-plugin/) | Claude Code plugin |
| [`.codex-plugin/`](.codex-plugin/) | Codex plugin |
| [`package.json`](package.json) | Pi package manifest |

### Skills

| Skill | Description |
|-------|-------------|
| [`map`](.agents/skills/map/) | Interactive codebase map (Cursor Canvas or Bun React) |

## License

MIT — see [LICENSE](LICENSE).

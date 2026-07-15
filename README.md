# Primitives

Reusable agent primitives — skills, plugins, and supporting tools used across AI coding environments.

Skills follow the [Agent Skills](https://agentskills.io/) open standard.

## What's included

### Skills

| Skill | Description |
|-------|-------------|
| [`map`](.agents/skills/map/) | Interactive codebase map (Cursor Canvas or Bun React). Requires [Bun](https://bun.sh) on `PATH`. |

### MCP tools (oxcode)

Plugin installs for **Cursor**, **Claude Code**, **Codex**, and **Grok** ship the [oxcode](https://github.com/oxgraph/oxcode) MCP server (stdio: `oxcode mcp`). The plugin is config-only — run `/primitives-setup` once (oxcode binary today; any future prerequisites later), then approve the MCP server when prompted.

| Tool | What it answers |
|------|-----------------|
| `oxcode_watch` | Build the index and keep it current as files change. **Call this first.** |
| `oxcode_explore` | Top symbols by graph centrality + relations, blast radius, call flow |
| `oxcode_search` | Search indexed symbols by keyword |
| `oxcode_callers` | Incoming call graph for a symbol |
| `oxcode_callees` | Outgoing call graph for a symbol |
| `oxcode_symbol` | Describe one symbol by selector |
| `oxcode_files` | Search indexed files by keyword |
| `oxcode_status` | Database status plus this instance's watch role |

## Installation

### All agents (skills only)

Works with any host supported by the [skills CLI](https://github.com/vercel-labs/skills) (Cursor, Claude Code, Codex, Copilot, Gemini, OpenCode, Windsurf, and many more):

```bash
bunx skills add snowmead/agentic-engineering
```

Target specific agents with `-a` (repeatable), e.g. `-a cursor -a claude-code`.

**Skills CLI does not install MCP.** For oxcode tools, use a host plugin install below (Cursor / Claude / Codex / Grok), then run `/primitives-setup`.

<details>
<summary><strong>Cursor</strong></summary>

Requires [Bun](https://bun.sh) on `PATH` for the `map` skill.

The `map` skill is **not** auto-applied. After install, invoke it with `/map` (or attach the skill) when you want a codebase map.

Skills:

```bash
bunx skills add snowmead/agentic-engineering -a cursor
```

As a Cursor plugin (uses [`.cursor-plugin/`](.cursor-plugin/); ships skills, `/primitives-setup`, and oxcode MCP):

- Install from the [Cursor Marketplace](https://cursor.com/marketplace) or in-editor with `/add-plugin`
- On Teams/Enterprise: import this GitHub repo as a [team marketplace](https://cursor.com/docs/plugins) under **Dashboard → Plugins**
- Run `/primitives-setup` for required deps (oxcode binary and any future setup), then approve the **oxcode** MCP server when prompted

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

Then run `/primitives-setup` for required deps, and approve the **oxcode** MCP server when prompted (check with `/mcp`).

</details>

<details>
<summary><strong>Codex</strong></summary>

```bash
codex plugin marketplace add snowmead/agentic-engineering
codex plugin add primitives@primitives
```

Approve the **oxcode** MCP server when prompted. Run `/primitives-setup` if your host exposes that command, or install the binary manually:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/oxgraph/oxcode/releases/latest/download/oxcode-cli-installer.sh | sh
```

Skills-only (no plugin marketplace — **no MCP**):

```bash
bunx skills add snowmead/agentic-engineering -a codex
```

</details>

<details>
<summary><strong>Grok</strong></summary>

```bash
grok plugin marketplace add snowmead/agentic-engineering
grok plugin install primitives --trust
```

Or install this repo directly:

```bash
grok plugin install snowmead/agentic-engineering --trust
```

Then run `/primitives-setup` for required deps, and approve the **oxcode** MCP server when prompted.

</details>

<details>
<summary><strong>Pi</strong></summary>

Pi packages ship skills only (no plugin MCP). Install skills:

```bash
pi install git:github.com/snowmead/agentic-engineering
```

For oxcode MCP, install the binary, then wire a project or user MCP config (e.g. via [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter)):

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/oxgraph/oxcode/releases/latest/download/oxcode-cli-installer.sh | sh
```

```json
{
  "mcpServers": {
    "oxcode": {
      "command": "oxcode",
      "args": ["mcp"]
    }
  }
}
```

</details>

## License

MIT — see [LICENSE](LICENSE).

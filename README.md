# Primitives

Reusable agent primitives — skills, plugins, agents, and supporting tools used across AI coding environments.

Skills follow the [Agent Skills](https://agentskills.io/) open standard.

## What's included

### Skills

| Skill | Description |
|-------|-------------|
| [`map`](.agents/skills/map/) | Interactive codebase map (Cursor Canvas or Bun React). Uses the **cartographer** agent for subsystem exploration. |
| [`erasure`](.agents/skills/erasure/) | Standing half-budget for removal, compression, and GC (swap rule, comment/prose pruning, branch metrics) — domain-general, plus TypeScript and Rust tactics and project guardrails (ESLint/Biome/Clippy, dead-code GC). Dedicated passes use the **erasure** agent when plugin agents are available. |

### Agents

| Agent | Description |
|-------|-------------|
| [`cartographer`](agents/cartographer.md) | Readonly Task subagent: search, learn, and map a topic via oxcode + Parallel Search. Shipped for **Cursor**, **Claude Code**, and **Grok** (shared `agents/` directory). Codex has no plugin agents surface today — MCP still ships. |
| [`erasure`](agents/erasure.md) | Read-write Task subagent: scoped remove/compress/GC following the erasure skill. Applies only clear erasures; leaves open questions alone and reports them. Cursor / Claude Code / Grok; Codex has no plugin agents today. |

### MCP tools

Plugin installs for **Cursor**, **Claude Code**, **Codex**, and **Grok** ship both MCP servers below (config-only). Run `/primitives-setup` once for the oxcode binary, then approve the MCP servers when prompted.

#### oxcode

[oxcode](https://github.com/oxgraph/oxcode) — stdio: `oxcode mcp`.

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

#### Parallel Search

[Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/quickstart) — Streamable HTTP: `https://search.parallel.ai/mcp`. Free anonymous use; no API key required by default.

| Tool | What it answers |
|------|-----------------|
| `web_search` | Low-latency web search for agent loops |
| `web_fetch` | Token-efficient markdown from specific URLs |

For higher rate limits, set `PARALLEL_API_KEY` and pass a Bearer `Authorization` header, or use `https://search.parallel.ai/mcp-oauth` (see [Parallel docs](https://docs.parallel.ai/integrations/mcp/search-mcp)). Do not commit API keys.

## Installation

### All agents (skills only)

Works with any host supported by the [skills CLI](https://github.com/vercel-labs/skills) (Cursor, Claude Code, Codex, Copilot, Gemini, OpenCode, Windsurf, and many more):

```bash
bunx skills add snowmead/agentic-engineering
```

Target specific agents with `-a` (repeatable), e.g. `-a cursor -a claude-code`.

**Skills CLI does not install MCP or plugin agents.** For oxcode / Parallel Search and the **cartographer** / **erasure** agents, use a host plugin install below (Cursor / Claude / Codex / Grok), then run `/primitives-setup` for the oxcode binary.

<details>
<summary><strong>Cursor</strong></summary>

The `map` skill is **not** auto-applied. After install, invoke it with `/map` (or attach the skill) when you want a codebase map. Exploration goes through the **cartographer** agent.

Skills:

```bash
bunx skills add snowmead/agentic-engineering -a cursor
```

As a Cursor plugin (uses [`.cursor-plugin/`](.cursor-plugin/); ships skills, agents, `/primitives-setup`, and MCP):

- Install from the [Cursor Marketplace](https://cursor.com/marketplace) or in-editor with `/add-plugin`
- On Teams/Enterprise: import this GitHub repo as a [team marketplace](https://cursor.com/docs/plugins) under **Dashboard → Plugins**
- Run `/primitives-setup` for required deps (oxcode binary and any future setup), then approve the **oxcode** and **parallel-search** MCP servers when prompted

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

Then run `/primitives-setup` for required deps, and approve the **oxcode** and **parallel-search** MCP servers when prompted (check with `/mcp`).

</details>

<details>
<summary><strong>Codex</strong></summary>

```bash
codex plugin marketplace add snowmead/agentic-engineering
codex plugin add primitives@primitives
```

Approve the **oxcode** and **parallel-search** MCP servers when prompted. Codex does **not** load plugin slash-commands (`/primitives-setup` is Cursor/Claude/Grok only) — install the oxcode binary manually:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/oxgraph/oxcode/releases/latest/download/oxcode-cli-installer.sh | sh
```

Codex does **not** load plugin `agents/` today — cartographer and erasure agents are Cursor/Claude/Grok only. Skills-only (no plugin marketplace — **no MCP**):

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

Then run `/primitives-setup` for required deps, and approve the **oxcode** and **parallel-search** MCP servers when prompted.

</details>

<details>
<summary><strong>Pi</strong></summary>

Pi packages ship skills only (no plugin MCP or agents). Install skills:

```bash
pi install git:github.com/snowmead/agentic-engineering
```

For MCP, install the oxcode binary, then wire a project or user MCP config (e.g. via [pi-mcp-adapter](https://www.npmjs.com/package/pi-mcp-adapter)):

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/oxgraph/oxcode/releases/latest/download/oxcode-cli-installer.sh | sh
```

```json
{
  "mcpServers": {
    "oxcode": {
      "command": "oxcode",
      "args": ["mcp"]
    },
    "parallel-search": {
      "url": "https://search.parallel.ai/mcp",
      "directTools": true
    }
  }
}
```

</details>

## License

MIT — see [LICENSE](LICENSE).

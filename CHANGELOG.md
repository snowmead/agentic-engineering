# Changelog

## 0.2.0 — 2026-07-15

- **MCP:** ship [oxcode](https://github.com/oxgraph/oxcode) via shared root `.mcp.json` for Cursor, Claude Code, Codex, and Grok plugins
- **Setup:** add `/primitives-setup` for the `oxcode` binary and any future setup the plugin needs (config-only; cannot bundle natives)
- **Docs:** README covers per-host MCP approval + Pi / skills-CLI fallbacks

## 0.1.7 — 2026-07-14

- **map:** `disable-model-invocation: true` — invoke with `/map` (not ambient auto-apply)
- **map:** Canvas IDE contract — `metadata.surfaces: [ide]`, hard-require built-in canvas skill

## 0.1.6 — 2026-07-14

- **map:** deslop scripts/UI/docs — valid example Mermaid JSON, sync without double reads, scaffold rewrites all `./host` imports, Bun `Button` forwards `disabled`, hover on native `div`s
- **map:** docs consolidate so each contract has one home (SKILL runbook/gates, canvas-pattern layout, architecture-viewport, code-preview FILE_MAP)

## 0.1.5 — 2026-07-14

- **map:** Bun host path is `$TMPDIR/<repo-slug>/maps/<name>/` via `scripts/map-dir.ts` (Cursor/Canvas unchanged)

## 0.1.4 — 2026-07-14

- **map:** Bun React host clones to `$TMPDIR/maps/<name>/` instead of `<repo>/maps/` (keeps Vite/node_modules out of the project)

## 0.1.3 — 2026-07-14

- **map:** Bun/Vite host `FileTreePanel` uses `@pierre/trees` (Canvas keeps builtin fallback in Map.tsx)

## 0.1.2 — 2026-07-14

- **map:** Bun host migrated from `Bun.serve` HTML to **Vite** so `@pierre/diffs` workers emit correctly
- **map:** Bun `DiffView` now uses `@pierre/diffs` `File` + `WorkerPoolContextProvider` (any Shiki language)
- **map:** docs — pierre allowed only in Bun host; Canvas still `cursor/canvas`; no DIY tokenizer

## 0.1.1 — 2026-07-14

- **map:** rename default export `Map` → `MapView` (avoids shadowing `globalThis.Map` / stack overflow on Bun load)
- **map:** Bun host `DiffView` syntax colors (interim tokenizer; superseded in 0.1.2 by pierre)
- **map:** docs clarify Canvas vs Bun DiffView; `bun run verify` / `bun run test:host` smoke gate

## 0.1.0 — 2026-07-14

- Initial release as **Primitives**
- Skills under `.agents/skills/` (Agent Skills open standard)
- Cursor, Claude Code, Codex, Grok, and Pi plugin/package packaging
- `map` skill with dual hosts: Cursor Canvas + Bun React (`app/`)
- Marketplace assets: `assets/logo.png`

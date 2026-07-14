# Changelog

## 0.1.1 — 2026-07-14

- **map:** rename default export `Map` → `MapView` (avoids shadowing `globalThis.Map` / stack overflow on Bun load)
- **map:** Bun host `DiffView` now syntax-colors TS/TSX/JS from `path` (sync tokenizer; Canvas still uses `cursor/canvas` Shiki)
- **map:** docs clarify Canvas vs Bun DiffView; ban `@pierre/diffs` installs under Bun.serve
- **map:** `bun run verify` / `bun run test:host` smoke gate (MapView SSR + DiffView colors + scaffold sync)

## 0.1.0 — 2026-07-14

- Initial release as **Primitives**
- Skills under `.agents/skills/` (Agent Skills open standard)
- Cursor, Claude Code, Codex, Grok, and Pi plugin/package packaging
- `map` skill with dual hosts: Cursor Canvas + Bun React (`app/`)
- Marketplace assets: `assets/logo.png`

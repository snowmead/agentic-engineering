# Research brief: Pierre libraries inside Cursor Canvases

**Date:** 2026-07-14  
**Branch:** `cursor/pierre-canvas-compatibility-research-78e4`  
**Scope:** Research only (no product/code change)

## Verdict

**Not possible today** to import or run `@pierre/diffs` / `@pierre/trees` inside an in-IDE `.canvas.tsx`.

**Possible only via workaround layers that are not "real pierre at canvas runtime":**

| Host | Real `@pierre/*` at runtime? |
|------|------------------------------|
| In-IDE `.canvas.tsx` | **No** |
| Published / web canvas (`cursor-canvas-web` shim) | **Only if you leave the pure-canvas contract** and add npm in the Vite app (not shipped as an IDE canvas) |
| Bun/Vite map host (`app/src/host`) | **Yes** (already wired) |

Closest in-IDE path to pierre *looks*: author-time SSR HTML embed (path B). That can approximate static highlighting; it does **not** give interactive pierre components. For the map skill goal of "pierre fidelity inside Cursor canvases," the decisive recommendation is **product ask (A) + keep status quo (D) until then**.

---

## 1. Hard platform constraint: no npm in canvases

### Evidence (platform, not just skill prose)

Cursor's canvas builder does **not** bundle arbitrary packages. It:

1. Runs **esbuild `transform` only** (JSX/TS → ESM), not a full bundler resolve of `node_modules`.
2. **Strips every `import …` line** from the transformed module before serving it as `appModule`.
3. For TypeScript language service / SDK bootstrap, maintains an allowlist resolution table of exactly:

   - `cursor/canvas`
   - `react`
   - `react/jsx-runtime`
   - `react/jsx-dev-runtime`

Source (local Cursor Agent Exec build in this environment):

- `/home/ubuntu/.cursor-server/bin/bf249e6efb5b097f23d7e21d7283429f0760b740/extensions/cursor-agent-exec/dist/main.js`
  - `_runCanvasTransform` → `gn.transform(..., { loader, jsx, format: "esm", … })`
  - `_buildCanvas` → `appModule: n.code.replace(/^\s*import\b[\s\S]*?;\s*$/gm, "")`
  - `resolutionTable = new Map([["cursor/canvas", …], ["react", …], …])`
- Runtime module served at `/runtime/canvas-runtime.esm.js` (bundled React + canvas primitives).

Implication: `import { File } from "@pierre/diffs/react"` would be **deleted at build**, leaving unbound identifiers at runtime. Same for relative imports and Node built-ins.

### Evidence (docs / skills / ecosystem)

- Official product framing: canvases use a **first-party** React component library ("tables, boxes, diagrams, charts" + existing Cursor components like diffs and to-dos). No mention of third-party npm.  
  - [Canvases changelog (2026-04-15)](https://cursor.com/changelog/04-15-26)  
  - [Canvas blog](https://cursor.com/blog/canvas)  
  - [Canvas docs](https://cursor.com/docs/agent/tools/canvas)
- Authoritative canvas skill path referenced by first-party plugins: `~/.cursor/skills-cursor/canvas/SKILL.md` (not present in this cloud image; referenced by [docs-canvas](https://github.com/cursor/plugins/blob/main/docs-canvas/skills/docs-canvas/SKILL.md) / [pr-review-canvas](https://github.com/cursor/plugins/blob/main/pr-review-canvas/skills/pr-review-canvas/SKILL.md)).
- Public restatements of the skill rule (import only `cursor/canvas`; no npm / relative / network; embed data inline): e.g. [sage-framework AGENTS.md](https://github.com/IgoRory/sage-framework/blob/main/AGENTS.md).
- Map skill already encodes the same constraint: `.agents/skills/map/SKILL.md`, `canvas-pattern.md`.
- Community confirmation that canvases compile via **esbuild-wasm** in-IDE: [forum thread](https://forum.cursor.com/t/canvas-never-renders-in-3-7-27-macos-arm64-esbuild-wasm-build-worker-exits-immediately-the-service-is-no-longer-running-the-service-was-stopped/163065).
- Web shim projects exist precisely because `cursor/canvas` is **IDE-provided, not an npm package**: [cursor-canvas-web README](https://github.com/thisismydesign/cursor-canvas-web).

### Future third-party packages / plugins?

- **Plugins** extend agents (skills, MCP, rules). They do **not** add npm dependencies to the canvas module graph. [Canvas blog](https://cursor.com/blog/canvas) + [cursor/plugins](https://github.com/cursor/plugins) treat canvas skills as layout/policy docs over the fixed SDK.
- No public Cursor doc found that promises canvas npm dependencies, CDN imports, or a plugin-provided module allowlist.
- Kill criterion for "wait for npm in canvases": treat as **not planned** until Cursor ships an explicit canvas dependency / bundling feature.

---

## 2. `cursor/canvas` surface inventory

From SDK typings in this environment:

`…/agent-sdk/cursor/canvas/index.d.ts` (+ siblings)

**Present (relevant):**

- `DiffView`, `DiffStats` (`diff-view.d.ts`) — monospaced unified diff / file body; optional Shiki via `path` / `language`; per-line tokenization (multi-line constructs may not colorize across boundaries).
- Layout/typography/forms/charts/todos/DAG layout helpers, host hooks (`useHostTheme`, `useCanvasState`, `useCanvasAction`).

**Absent:**

- No `FileTree`, `Tree`, or pierre-like tree primitive.
- No `@pierre/*` re-exports.

### Is `DiffView` pierre-derived?

**No.** Independent Shiki-backed implementation inside `canvas-runtime.esm.js`:

- `function DiffView({ lines, path, language, … })` uses host theme tokens + `tokenizeStructuredSync` / Shiki core (`createHighlighterCoreSync`, `codeToHtml`).
- Zero string matches for `pierre` / `@pierre` in `canvas-runtime.esm.js`.
- LICENSE file for that bundle lists React only, not Pierre.

Bun map host *does* wrap pierre: `app/src/host/index.tsx` exports `DiffView` as `@pierre/diffs/react` `File`, and `FileTreePanel` as `@pierre/trees/react`. Canvas scaffold swaps `./host` → `cursor/canvas` and falls back to `BuiltinFileTreePanel` in `Map.tsx`.

---

## 3. Ranked options (with kill criteria)

### A. Product ask: vendor/wrap pierre (or pierre-like) APIs into `cursor/canvas`

| | |
|--|--|
| **Feasibility** | High *as a request*; zero control over ship date |
| **Effort (map skill)** | Docs + feature request only until Cursor ships |
| **Risk** | Dependency on Cursor product; API may be a subset, not full pierre |
| **Kill if** | Cursor declines, or ships a non-pierre tree/diff that still lacks map needs (expand-on-hover, selection sync, worker highlighting) |

**Ask shape:** add `FileTree` (+ selection/expand APIs) and optionally deepen `DiffView` toward pierre `File` fidelity (or re-export vendored pierre under `cursor/canvas`). Only path that puts *real* pierre (or equivalent) **inside** in-IDE canvases.

### B. Author-time pierre SSR → embed HTML in canvas

| | |
|--|--|
| **Feasibility** | Partial for **static** code chrome; weak for interactive tree |
| **Effort** | Medium–high (author pipeline, blob size, theme CSS, no hydration) |
| **Risk** | Huge inline strings; lost interactivity; shadow-DOM tree quirks; payload limit |
| **Kill if** | Need runtime hover/select/virtualized tree, or per-focus snippet swaps without regenerating HTML |

**APIs (installed `@pierre/diffs@1.2.12`, `@pierre/trees@1.0.0-beta.5`):**

```ts
// diffs — author/CI time only
import { preloadFile } from "@pierre/diffs/ssr";
const { prerenderedHTML, file, options } = await preloadFile({
  file: { name: "example.ts", contents: "…" },
  options: { theme: "pierre-dark", disableFileHeader: true },
});
// embed: <div dangerouslySetInnerHTML={{ __html: prerenderedHTML }} />
```

Also available: `preloadFileDiff`, `preloadMultiFileDiff`, `preloadPatchDiff`, `preloadPatchFile`, `preloadUnresolvedFile`, `renderHTML` — see [diffs.com/docs SSR](https://diffs.com/docs).

```ts
// trees — author/CI time only
import { preloadFileTree, serializeFileTreeSsrPayload } from "@pierre/trees/ssr";
const payload = preloadFileTree({
  paths: ["src/a.ts", "README.md"],
  id: "map-tree",
  initialExpansion: "closed",
  search: false,
  icons: "minimal",
});
// for innerHTML / dangerouslySetInnerHTML:
const html = serializeFileTreeSsrPayload(payload, "dom");
// payload shape: { id, outerStart, domOuterStart, shadowHtml, outerEnd }
```

Docs: [trees.software/docs](https://trees.software/docs).

**Empirical notes (this research):**

- `preloadFile` HTML ~50KB for a 2-line file (sprite + CSS + highlighted body); self-contained `<style>`, **no** shadow root → workable for static `dangerouslySetInnerHTML`.
- Tree SSR uses **declarative/open shadow DOM** (`<file-tree-container>` + `data-file-tree-shadowrootmode`); designed for **hydrate with `@pierre/trees` on the client**. Without runtime pierre, you get a static (and virtualized) shell, not map-grade hover/selection.
- Map already embeds Mermaid via `dangerouslySetInnerHTML` (`Map.tsx` / `scaffold.canvas.tsx`) — so HTML embed is an established canvas pattern for **static** chrome.
- Canvas serve path has a **content-too-large** gate (~5MB gzipped payload budget in Agent Exec). Pre-rendering every `FILE_CONTENTS` blob as pierre HTML will blow size and regenerate cost.

**Not equivalent to importing pierre in the canvas.** Hydration APIs require the npm packages at runtime.

### C. Web shim host that can import pierre

| | |
|--|--|
| **Feasibility** | High for *web publishing* |
| **Effort** | Medium (Vite app + alias; optional pierre in that app) |
| **Risk** | Diverges from in-IDE canvas; shim fidelity gaps |
| **Kill if** | Goal is in-IDE Agents Window canvas |

[cursor-canvas-web](https://github.com/thisismydesign/cursor-canvas-web) aliases `cursor/canvas` → Mantine shim. Pure canvases stay import-only-from-`cursor/canvas`. To use pierre you add `@pierre/*` in the **Vite app**, not in the `.canvas.tsx` if you still want IDE compatibility. That is a third host, not "pierre in Cursor canvases."

Note: shim `DiffView` currently skips Shiki (plain text). Pierre in the Vite app would be a separate component path.

### D. Status quo: canvas `DiffView` + builtin tree; pierre only on Bun host

| | |
|--|--|
| **Feasibility** | Already shipped |
| **Effort** | None for compatibility; optional UX polish |
| **Risk** | Canvas tree/diff lag Bun fidelity |
| **Kill if** | Stakeholders require pixel/behavior parity with pierre in-IDE |

This remains the correct dual-host design: same `Map.tsx` data, host-specific DiffView/FileTree.

### E. Undocumented escape hatches

| Hatch | Status |
|-------|--------|
| `import("@pierre/…")` / dynamic import | **Dead.** Imports are stripped; no bundler graph. |
| Relative imports / local wrappers | **Dead.** Same strip + no resolve table entry. |
| CDN `<script>` / ESM URLs | **Unsupported** as an authoring model; not in SDK; transform does not fetch URLs. |
| `fetch` / network at runtime | **Policy-forbidden** for canvases; product docs emphasize embed-inline. Runtime is local canvas server (`127.0.0.1`) with token/origin checks. |
| iframe to local Vite pierre app | Not an SDK primitive; would be a hacky split-brain UI, break publish/share snapshot model, and still not be "pierre inside the canvas module." **Disprove as supported path.** |
| `dangerouslySetInnerHTML` | **Allowed in practice** (map Mermaid). Useful only for static HTML (path B), not for loading pierre JS. |

---

## 4. Host separation (explicit)

```
┌─────────────────────────────────────────────────────────────┐
│ In-IDE .canvas.tsx                                          │
│  imports: cursor/canvas + react only                        │
│  DiffView = Shiki (Cursor), FileTree = BuiltinFileTreePanel │
│  @pierre/* = impossible at runtime                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Published / shared canvas (Cursor snapshot) OR              │
│ cursor-canvas-web Vite deploy                               │
│  still not IDE runtime; shim ≠ pierre unless you add npm    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Bun/Vite map host (app/)                                    │
│  app/src/host uses @pierre/diffs + @pierre/trees + workers  │
│  full pierre fidelity                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Recommendation for the map skill

**If the goal is "pierre fidelity inside Cursor canvases":**

1. **Treat runtime pierre in `.canvas.tsx` as impossible** until Cursor changes the platform (option A).
2. **Keep D (status quo)** as the supported architecture: Canvas = `cursor/canvas` DiffView + builtin tree; Bun = pierre in `app/src/host`.
3. **File a product ask (A)** for first-party `FileTree` (and optionally richer file view) on `cursor/canvas`. That is the only honest path to in-IDE parity.
4. **Do not invest in B** unless someone explicitly wants static "pretty HTML" code blocks and accepts no hydration, large blobs, and a weak tree. Prefer improving canvas DiffView usage (`path` always set) and builtin tree UX over SSR HTML.
5. **Do not sell C as in-IDE pierre.** Use Bun host or a dedicated Vite app when pierre is mandatory.

### Concrete next steps

| Track | Action |
|-------|--------|
| **Docs** | Record this verdict in map skill docs (SKILL / canvas-pattern): "pierre in canvas = not possible; Bun host only; product ask for FileTree." |
| **Code** | No compatibility implementation required. Optional later: polish builtin tree; ensure DiffView always gets `path`. |
| **Product ask** | Request `cursor/canvas` FileTree (expand/select/hover APIs) and confirm whether DiffView will stay Shiki-minimal or move toward pierre-class file rendering. |

### Impossible vs possible (one line each)

- **Impossible:** `import` from `@pierre/diffs` / `@pierre/trees` (or any npm) in in-IDE `.canvas.tsx` today.
- **Possible:** pierre on Bun/Vite host; static SSR HTML embed (lossy); web app with npm; Cursor first-party expansion of `cursor/canvas`.

---

## Sources

**Local / repo**

- `.agents/skills/map/SKILL.md`, `canvas-pattern.md`, `code-preview.md`
- `.agents/skills/map/app/src/host/index.tsx`, `Map.tsx`, `main.tsx`, `workerFactory.ts`
- Cursor Agent Exec: `…/agent-sdk/cursor/canvas/*.d.ts`, `…/canvas-runtime/canvas-runtime.esm.js`, `…/dist/main.js` (canvas build + resolution table)
- Installed packages: `@pierre/diffs@1.2.12`, `@pierre/trees@1.0.0-beta.5` (`dist/ssr/*`)

**Web**

- [Cursor Canvases docs](https://cursor.com/docs/agent/tools/canvas)
- [Cursor Canvas blog](https://cursor.com/blog/canvas)
- [Canvases changelog 2026-04-15](https://cursor.com/changelog/04-15-26)
- [cursor/plugins docs-canvas / pr-review-canvas](https://github.com/cursor/plugins)
- [cursor-canvas-web](https://github.com/thisismydesign/cursor-canvas-web)
- [Forum: canvas esbuild-wasm build](https://forum.cursor.com/t/canvas-never-renders-in-3-7-27-macos-arm64-esbuild-wasm-build-worker-exits-immediately-the-service-is-no-longer-running-the-service-was-stopped/163065)
- [diffs.com docs (SSR)](https://diffs.com/docs)
- [trees.software docs (SSR)](https://trees.software/docs)
- [@pierre/diffs npm](https://www.npmjs.com/package/@pierre/diffs)

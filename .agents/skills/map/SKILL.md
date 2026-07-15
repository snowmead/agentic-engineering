---
name: map
description: >-
  Builds an interactive codebase map: beautiful-mermaid architecture diagrams
  (flowchart/sequence/class/ER/state), a navigable snake flowchart, interleaved
  prose+code sidebars, and a file tree. Delivers via Cursor Canvas or a Bun
  React page. Invoke with /map when the user wants a codebase map, architecture
  explanation, onboarding brief, interactive flow chart, navigable walkthrough,
  "show me how X works" as a diagram/map, or a visual mental model of a
  feature/subsystem with clickable jumps into files.
license: MIT
compatibility: Requires Bun on PATH. Cursor Canvas host also needs Cursor canvases.
disable-model-invocation: true
metadata:
  surfaces:
    - ide
---

# Map

Produce a **navigable spatial map**: wrapped rows, concise node teasers,
**clickable edges** (dependencies), a **left resizable sidebar** with
interleaved prose + code excerpts + file backlinks, and a **right file tree**
built from every path referenced in the map.

## Host selection

| Environment | Host | Deliverable |
|-------------|------|-------------|
| Cursor with canvases | **Canvas** (default on Cursor; IDE-only) | `.canvas.tsx` in project canvases dir |
| Claude / Codex / Pi / no canvases | **Bun React** | copy of `app/` under `$TMPDIR/<repo-slug>/maps/<name>/` |

Same data contracts, scripts, and quality bars for both. Do not invent chrome from scratch.

## Agent runbook (read order)

Do this in order — skip steps and you will ship a broken map:

1. **Prereqs:** [Bun](https://bun.sh) on `PATH`. Resolve `SKILL_DIR` as the directory
   that contains this `SKILL.md`.
   - **Canvas host:** load the Cursor **canvas** skill before writing any `.canvas.tsx`.
     Do not skip.
2. **Contracts (mandatory reads):**
   - [canvas-pattern.md](canvas-pattern.md) — layout, data shape, snake map, tree
   - [architecture-viewport.md](architecture-viewport.md) — Mermaid pan/zoom/Fit
     (static scrollable SVGs are a ship blocker)
   - [code-preview.md](code-preview.md) — `FILE_MAP` + `bun update.ts` (previews + tree)
3. **Explore via cartographer:** Launch the **cartographer** Task subagent
   (`subagent_type: cartographer`) with the target subsystem/question. Do **not**
   use ad-hoc Grep/Read as the primary exploration path when cartographer is
   available. Use its returned map (symbols, files, edges, open questions, and
   any candidate `NODES` / `EDGES` / paths) to distill 5–12 nodes + edges and
   pick Mermaid kind(s).
   - **Fallback** (skills-CLI-only / Pi / no plugin agents): explore with oxcode
     + Parallel Search MCP if present, otherwise manual explore — then continue.
4. **Clone the host template** (pick one):

### Canvas host (Cursor)

```bash
cp "$SKILL_DIR/scaffold.canvas.tsx" \
  ~/.cursor/projects/<workspace>/canvases/<descriptive-name>.canvas.tsx
MAP_FILE=~/.cursor/projects/<workspace>/canvases/<descriptive-name>.canvas.tsx
```

`scaffold.canvas.tsx` is **generated** from [`app/src/Map.tsx`](app/src/Map.tsx).
Skill authors regenerate with `bun "$SKILL_DIR/scripts/build-canvas-scaffold.ts"`.
Agents only copy the scaffold — do not edit the generator path unless changing shared UI.

### Bun React host (other agents)

**Cursor / Canvas does not use this path** — canvases already live under
`~/.cursor/projects/<workspace>/canvases/` (per workspace). Use the block
below only for Claude / Codex / Pi / no-canvases Bun hosts.

Clone the Vite app into a **per-project system temp directory** — never under
the target repo (`maps/`, `node_modules`, or Vite `dist/` must not land in the
project). Resolve the path via `map-dir.ts` (git toplevel basename → slug):

```bash
# from the target repo root (or pass --root /abs/repo)
MAP_DIR=$(bun "$SKILL_DIR/scripts/map-dir.ts" <descriptive-name> --init)
MAP_FILE="$MAP_DIR/src/Map.tsx"
# → $TMPDIR/<repo-slug>/maps/<name>/   e.g. /tmp/opt-stackless/maps/provision
```

`map-dir.ts` without `--init` only prints the path (reproducible; same repo +
name → same dir). With `--init` it wipes that dir and copies `$SKILL_DIR/app`.

`ROOT` in the map data still points at the real repo (for `FILE_MAP`); only the
host app lives in `$MAP_DIR`.

Then from `$MAP_DIR`: `bun install && bun run dev` → Vite on http://localhost:5173.
Before shipping a Bun map, also run host verify (from skill scripts or `$MAP_DIR`
— see Quality bar).

5. **Replace all placeholders** in `MAP_FILE` before delivery:
   - `ROOT` → absolute repo root
   - `FILE_MAP` → every real path/range (delete the demo `src/example.ts` entry)
   - `NODES` / `EDGES` → real walkthrough (`fileRef` / `{ type:"code", ref }`)
   - `ARCH_DIAGRAMS` → beautiful-mermaid SVGs + hotspots
   - Title / intro copy

6. **Scripts** (from this skill’s `scripts/`):

```bash
cd "$SKILL_DIR/scripts"
bun install                                          # once
bun render-mermaid.mjs --json --file diagrams.json > rendered.json
# embed SVGs into ARCH_DIAGRAMS, then:
bun update.ts --file "$MAP_FILE"
bun update.ts --file "$MAP_FILE" --check
# --canvas is an alias for --file
```

Authors regenerating chrome / before shipping a Bun map:

```bash
cd "$SKILL_DIR/scripts"
bun run verify
# or from the copied map dir: bun run test:host
```

`verify` checks MapView naming (no `Map` shadow), SSR render, Vite worker
chunk emission, pierre DiffView wiring, and scaffold sync.
7. **Optional depth (after the React Flow section only).** The map ends the
   durable UI with a comment `Add more context below.` Agents **may** insert
   extra sections after that comment when they help the reader. Nothing there is
   required — do **not** add a ritual “Gotchas” block. Mermaid + the React Flow
   map are the only always-on top-level sections.
8. **Ship only if** the Quality bar below passes.
   Never deliver the scaffold’s placeholder nodes/paths as a finished map.

**Single source of truth:** all code links live in `FILE_MAP`. `bun update.ts`
rewrites `FILE_CONTENTS` + `MAP_PATHS` from that block only — never hand-edit
generated blocks, never scrape NODES for paths or the tree.

**Chrome source of truth:** [`app/src/Map.tsx`](app/src/Map.tsx)
(Bun) / generated [`scaffold.canvas.tsx`](scaffold.canvas.tsx) (Canvas). Grow the
map by filling data + optional ad-hoc sections; do not re-derive pan/zoom,
sidebars, tree, or preview from prose alone.

**Canvas constraint:** import **only** from `cursor/canvas` (+ React hooks/types)
in `.canvas.tsx`. **Bun app:** use `app/src/host` polyfills (already wired). Do
**not** npm-import `@pierre/trees`, `@pierre/diffs`, or `beautiful-mermaid` into
`Map.tsx` / `.canvas.tsx` — Bun highlighting + tree live in `app/src/host` via
`@pierre/diffs` / `@pierre/trees` (Vite).

Default export in `Map.tsx` must be named **`MapView`** (never `Map` — that
shadows `globalThis.Map` and stack-overflows on load).

Host DiffView / tree / Mermaid package mapping:
[canvas-pattern.md § External UX mapping](canvas-pattern.md#external-ux-mapping).

## Architecture diagrams (beautiful-mermaid)

Every map should open with 1–3 **architecture** diagrams that explain *shape*,
not the step-by-step walkthrough (that’s the snake map). Choose the Mermaid
kind that matches the question:

| Question | Mermaid kind | Example |
|----------|--------------|---------|
| How do stages connect? | `flowchart` / `graph TD` | provision pipeline |
| Who calls whom, in order? | `sequenceDiagram` | substrate → registry → ops |
| What types / traits? | `classDiagram` | Hostable / CatalogResource / ProviderOps |
| What persists where? | `erDiagram` | tables / resources |
| What states can it be in? | `stateDiagram-v2` | lifecycle / checkpoint |

### Authoring workflow

1. Write Mermaid source (keep labels short; match node labels to map hotspots).
2. Declare `hotspots: { label, nodeId? | edgeKey? }[]` — `label` must match SVG
   `data-label` / text from beautiful-mermaid.
3. Render offline (from this skill’s `scripts/`; Bun preferred):

```bash
cd "$SKILL_DIR/scripts"
bun install   # once (beautiful-mermaid)
bun render-mermaid.mjs --json --file diagrams.json > rendered.json
```

4. Embed `svg` strings into `ARCH_DIAGRAMS` (no runtime import).
5. **Keep `ArchitecturePanel` per [architecture-viewport.md](architecture-viewport.md)**
   (already in the shared UI). Do not invent a simpler SVG box.
6. Wire code preview per [code-preview.md](code-preview.md): author **`FILE_MAP`**
   (every path/range), use `fileRef` / `snippet` / `{ type: "code", ref }`, then
   one update for previews + file tree:

```bash
cd "$SKILL_DIR/scripts"
bun update.ts --file "$MAP_FILE"
bun update.ts --file "$MAP_FILE" --check
```

7. Wire the rest:
   - Tab / pills to switch diagram kinds (Fit on switch)
   - Hotspot chips → `selectNode` / `selectEdge` + `previewFiles` on hover

Architecture pan/zoom/hotspot quality:
[architecture-viewport.md § Required UX checklist](architecture-viewport.md#required-ux-checklist).

## Distill limits

| Element | Limit |
|--------|--------|
| Nodes | 5–12 · 2–3 per row |
| Node (on card) | Label + teaser ≤ ~10 words |
| Edge label (on connector) | ≤ 3 words |
| Sidebar body | 1–3 prose + 1–3 code blocks per node/edge |
| Code excerpt | 4–14 lines, verbatim from disk |
| Files per node/edge | 1–3 in Source index (+ refs from code blocks) |
| Edge gaps | Generous (`GAP_X` ≥ 90, `GAP_Y` ≥ 100); labels sit in a chip clear of nodes |

**Surfaces:** node/edge chips stay short; detail lives in the sidebar
(`body: DocBlock[]` + Source + Prev/Next or endpoint jumps). File tree (right)
lists nested paths from all `FileRef`s — compact by default; hover expands
ancestors.

**Prose-only sidebars are an anti-pattern.** Every node and edge sidebar must
interleave 1–3 short prose blocks with 1–3 verbatim code excerpts so the reader
never has to reconstruct meaning by jumping around the codebase.

Edges are first-class: explain the *relationship* (trait, API, step variant,
registry lookup), not just the hop name — with real code snippets.

## Quality bar

Ship only if all of these pass:

- [ ] Placeholder demo paths/nodes replaced; `bun update.ts --check` clean
- [ ] Host verify passes (`bun run verify` from skill `scripts/` or `bun run test:host` in map dir)
- [ ] Built from Canvas scaffold **or** Bun `app/` template (not from-scratch chrome)
- [ ] Default export is `MapView` (not `Map`)
- [ ] Satisfies linked contracts: [canvas-pattern.md](canvas-pattern.md),
  [architecture-viewport.md](architecture-viewport.md),
  [code-preview.md](code-preview.md)

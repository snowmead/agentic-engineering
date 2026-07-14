---
name: map
description: >-
  Builds an interactive codebase map: beautiful-mermaid architecture diagrams
  (flowchart/sequence/class/ER/state), a navigable snake flowchart, interleaved
  prose+code sidebars, and a file tree. Delivers via Cursor Canvas or a Bun
  React page. Use when the user asks for a codebase map, architecture
  explanation, onboarding brief, interactive flow chart, navigable walkthrough,
  "show me how X works" as a diagram/map, or a visual mental model of a
  feature/subsystem with clickable jumps into files.
license: MIT
compatibility: Requires Bun on PATH. Cursor Canvas host also needs Cursor canvases.
---

# Map

Produce a **navigable spatial map**: wrapped rows, concise node teasers,
**clickable edges** (dependencies), a **left resizable sidebar** with
interleaved prose + code excerpts + file backlinks, and a **right file tree**
built from every path referenced in the map.

## Host selection

| Environment | Host | Deliverable |
|-------------|------|-------------|
| Cursor with canvases | **Canvas** (default on Cursor) | `.canvas.tsx` in project canvases dir |
| Claude / Codex / Pi / no canvases | **Bun React** | copy of `app/` under `$TMPDIR/<repo-slug>/maps/<name>/` |

Same data contracts, scripts, and quality bars for both. Do not invent chrome from scratch.

## Agent runbook (read order)

Do this in order — skip steps and you will ship a broken map:

1. **Prereqs:** [Bun](https://bun.sh) on `PATH`. Resolve `SKILL_DIR` as the directory
   that contains this `SKILL.md`.
   - **Canvas host:** also read the Cursor **canvas** skill
     (`~/.cursor/skills-cursor/canvas/SKILL.md`) before any `.canvas.tsx`.
2. **Contracts (mandatory reads):**
   - [canvas-pattern.md](canvas-pattern.md) — layout, data shape, snake map, tree
   - [architecture-viewport.md](architecture-viewport.md) — Mermaid pan/zoom/Fit
     (static scrollable SVGs are a ship blocker)
   - [code-preview.md](code-preview.md) — `FILE_MAP` + `bun update.ts` (previews + tree)
3. **Explore** the target subsystem; distill 5–12 nodes + edges; pick Mermaid kind(s).
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
8. **Ship only if** architecture + FILE_MAP quality bars below both pass.
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

## Goal

1. **Architecture first** — interactive beautiful-mermaid diagram(s) that explain
   the system shape (pick the right Mermaid kind)
2. See the whole primary flow at once (wrapped snake rows)
3. Short **teasers** on nodes — never clipped essays
4. Click a **node or edge** → left sidebar with interleaved prose + code + Source index
5. **Right file tree** — all paths from nodes/edges, collapsed by default; hover map or sidebar to highlight + expand; drag left edge to resize
6. Resize left sidebar (font scales), right tree, and map height; pan/zoom the diagram

## Content split

| Surface | Content |
|--------|---------|
| Node | Label + teaser (≤ ~10 words) |
| Edge label | ≤ 3 words on the connector |
| Sidebar (node) | `body: DocBlock[]` + Source + Prev/Next |
| Sidebar (edge) | `body: DocBlock[]` + Source + jump to endpoints |
| File tree (right) | Nested paths from all `FileRef`s; compact by default; hover expands ancestors |

**Prose-only sidebars are an anti-pattern.** Every node and edge sidebar must
interleave 1–3 short prose blocks with 1–3 verbatim code excerpts (4–14 lines
each) so the reader never has to reconstruct meaning by jumping around the
codebase.

Edges are first-class: explain the *relationship* (trait, API, step variant,
registry lookup), not just the hop name — with real code snippets.

## External UX mapping

Do **not** import Pierre / Mermaid into `Map.tsx` or `.canvas.tsx`. Hosts own
DiffView:

| Inspiration | Package | Primitive |
|-------------|---------|-----------|
| [diffs.com](https://diffs.com/) | `@pierre/diffs` | **`DiffView`** — Canvas: Shiki via `cursor/canvas` + `path`; Bun/Vite: `@pierre/diffs` `File` in `app/src/host` (worker pool in `main.tsx`) |
| [trees.software](https://trees.software/) | `@pierre/trees` | **File tree** — Canvas: builtin panel in `Map.tsx`; Bun/Vite: `@pierre/trees` in `app/src/host` `FileTreePanel` |
| [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | `beautiful-mermaid` | **Pre-render SVG** via `scripts/render-mermaid.mjs`, embed + hotspot interactivity |

Bun map apps use **Vite** (`bun run dev` → `vite`). Do not revert to
`Bun.serve` HTML for the map UI — pierre workers need Vite’s `?worker&url`.
Do not invent a DIY highlighter in `Map.tsx`.

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

### Quality bar (architecture)

- [ ] Right diagram *kind* for the story (not everything as a flowchart)
- [ ] SVG pre-rendered with beautiful-mermaid (not hand-drawn boxes)
- [ ] Hotspots cover every primary map node referenced in the diagram
- [ ] Click/hover updates sidebar focus + file-tree highlights
- [ ] No `beautiful-mermaid` import inside the map UI module
- [ ] **Pan / wheel-zoom / Zoom± / Fit** on the architecture viewport
- [ ] **Vertical resize** via bottom `data-arch-resize` (`archViewportH`)
- [ ] SVG at **intrinsic viewBox** size inside `translate+scale` world (not live `width="100%"`)
- [ ] Hotspot clicks work **with** `setPointerCapture` (`downTargetRef` + `elementFromPoint`; never bare `e.target` on pointerup)
- [ ] **Selected** hotspot accent-highlighted in the SVG
- [ ] **Pointer** cursor over hotspots; grab / grabbing otherwise

## Distill limits

| Element | Limit |
|--------|--------|
| Nodes | 5–12 · 2–3 per row |
| Node teaser | ≤ ~10 words |
| Edge label | ≤ 3 words |
| Sidebar body | 1–3 prose + 1–3 code blocks per node/edge |
| Code excerpt | 4–14 lines, verbatim from disk |
| Files per node/edge | 1–3 in Source index (+ refs from code blocks) |
| Edge gaps | Generous (`GAP_X` ≥ 90, `GAP_Y` ≥ 100); labels sit in a chip clear of nodes |

## Required UX

- Wrapped snake layout (not one wide horizontal rank)
- **Three-column layout:** left detail sidebar | map | right file tree
- Left sidebar; drag its right edge to resize; type scales with width
- Right file tree; drag its left edge to resize (persisted `treeW`, ~200–720px)
- Click node **or** edge opens sidebar
- Pan map; drag bottom handle to resize map height
- Code path / Source / tree / snippet click → **in-host code preview** (full file + highlight); diagonal arrow → IDE `openFile` (see [code-preview.md](code-preview.md)); snippets via **`DiffView`**; **Source** footer lists all refs
- **Tree highlight layers:** `selectedPaths` (from focused node/edge — sticky) ∪ `hoverPaths` (ephemeral). Selection stays highlighted after mouse leave; hovering other nodes/edges/links **adds** highlights without clearing selection. Expand ancestors for the union.
- Tree default: top-level folders only (closed); click tree file → preview popup
- **Architecture panel** matches [architecture-viewport.md](architecture-viewport.md) end-to-end

## Quality bar

- [ ] Whole path visible at Fit
- [ ] Edge labels not touching nodes; edges have hit targets
- [ ] Edge sidebars cite real dependency symbols with code excerpts
- [ ] Every sidebar interleaves prose + code (no prose-only)
- [ ] Code blocks have clickable path:line headers → preview popup (not IDE-only)
- [ ] Preview shows **whole file** with line/range highlight + open-in-editor arrow
- [ ] Global `FILE_MAP` is the only path registry; `bun update.ts` keeps `FILE_CONTENTS` + `MAP_PATHS` in sync (`--check` clean)
- [ ] File tree is driven by `MAP_PATHS` (not a hand-built tree / NODES scrape)
- [ ] Source footer lists union of file refs
- [ ] Sidebar on the left; width + font scale work
- [ ] Right file tree lists all map paths; collapses when hover clears
- [ ] Hover on node/edge/sidebar code highlights tree files
- [ ] Architecture viewport pans, zooms, Fits, and resizes vertically
- [ ] Architecture hotspot clicks work under pointer capture
- [ ] Architecture selection highlight + pointer cursor on hotspots
- [ ] Architecture section uses beautiful-mermaid SVGs + hotspots
- [ ] No `@pierre/*` or `beautiful-mermaid` imports in `Map.tsx` / `.canvas.tsx`
- [ ] Bun host DiffView uses `@pierre/diffs` (in `app/src/host`, not Map.tsx)
- [ ] Bun host FileTreePanel uses `@pierre/trees` (Canvas falls back to builtin)
- [ ] Default export is `MapView` (not `Map` — shadows `globalThis.Map`)
- [ ] Bun sidebar/preview code shows syntax colors via pierre (Vite worker pool)
- [ ] No clipped long text on nodes
- [ ] No static `overflow:auto` Mermaid box
- [ ] Built from Canvas scaffold **or** Bun `app/` template (not a from-scratch reimplementation)
- [ ] Placeholder demo paths/nodes replaced; `--check` clean
- [ ] Host verify passes (`bun run verify` from skill `scripts/` or `bun run test:host` in map dir)
- [ ] Extra sections (if any) only **below** the “Add more context below.” comment
- [ ] No mandatory Gotchas / ritual footer sections

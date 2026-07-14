# Canvas pattern — spatial map

Canvases import **only** `cursor/canvas` (+ React hooks/types). Build a
React Flow–like map with wrapped rows, pan/zoom, resizable left sidebar, concise
teasers, **clickable edges** that open dependency detail with interleaved code,
and a **right file tree** for hover-preview navigation.

**Start from the host template** — do not invent chrome from scratch:

- **Cursor Canvas:** copy [scaffold.canvas.tsx](scaffold.canvas.tsx) (generated from
  [`app/src/Map.tsx`](app/src/Map.tsx)) into the project `canvases/` dir
- **Bun React:** copy [`app/`](app/) into `<repo>/maps/<name>/`

Then replace `ROOT` / `FILE_MAP` / `NODES` / `EDGES` / `ARCH_DIAGRAMS`. Durable
top-level sections are (1) Mermaid architecture and (2) the React Flow
three-column map. After the `Add more context below.` comment, agents may add
optional ad-hoc sections; do not bake in a required “Gotchas” section.

**Do not** npm-import `@pierre/trees`, `@pierre/diffs`, `beautiful-mermaid`,
or React Flow.

## External UX mapping

| Inspiration | Package | Canvas substitute |
|-------------|---------|---------------------|
| [diffs.com](https://diffs.com/) | `@pierre/diffs` | **`DiffView`** — Shiki highlighting via `path` / extension |
| [trees.software](https://trees.software/) | `@pierre/trees` | **Custom `FileTree` panel** — right sidebar, hover highlight + ancestor expand |
| [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | `beautiful-mermaid` | **Pre-render SVG** with `scripts/render-mermaid.mjs`; embed + hotspots |

Anti-pattern: `import … from "@pierre/*"` or `beautiful-mermaid` in `.canvas.tsx`.

## Architecture diagrams

Place **above** the three-column map. 1–3 diagrams; switch with pills.

**STOP — read and implement [architecture-viewport.md](architecture-viewport.md)
in full before writing `ArchitecturePanel`.** That file is the source of truth
for pan/zoom/Fit, vertical resize, click hit-testing under pointer capture,
selection chrome, and pointer cursor. A static scrollable SVG is a **ship
blocker**.

### Pick the right Mermaid kind

| Kind | Use when |
|------|----------|
| `flowchart` / `graph TD` | Pipeline / stage graph |
| `sequenceDiagram` | Ordered calls across modules |
| `classDiagram` | Types, traits, impl relationships |
| `erDiagram` | Persistent entities / schema |
| `stateDiagram-v2` | Lifecycle / state machine |

### Data + interactivity

```ts
type ArchHotspot = { label: string; nodeId?: string; edgeKey?: string };
type ArchDiagram = {
  id: string;
  title: string;
  kind: "flowchart" | "sequence" | "class" | "er" | "state";
  svg: string; // from beautiful-mermaid — never runtime-rendered in canvas
  hotspots: ArchHotspot[];
};
```

- Render at authoring time: `bun scripts/render-mermaid.mjs --json --file …`
- Keep `viewBox`; drop `@import` fonts. For the **camera world**, rewrite
  width/height to intrinsic viewBox pixels via `svgForCamera` (see
  architecture-viewport.md) — do **not** leave the live camera SVG at
  `width="100%"`.
- Persist `archDiagram`, `archView`, `archViewportH`
- Hotspot chips + SVG shapes both select map nodes/edges
- Hover hotspot chip → `previewFiles(collectFiles(entity))`

### Architecture viewport (summary — details in architecture-viewport.md)

| Affordance | Implementation |
|------------|----------------|
| Pan / zoom / Fit | `archView` + wheel + Zoom−/+/Fit; world layer `translate+scale` |
| Vertical resize | Bottom `data-arch-resize` → `archViewportH` |
| Click hotspot | `downTargetRef` + `elementFromPoint` after capture; ignore if panned |
| Selection chrome | `svgWithHotspotChrome` accent stroke/fill for active `data-label`s |
| Cursor | `pointer` over hotspot, `grab` else, `grabbing` while panning |

```tsx
<div data-arch-viewport /* height: archH, overflow:hidden, grab/pointer cursor */>
  <div
    style={{
      width: world.w,
      height: world.h,
      transform: `translate(${archView.x}px, ${archView.y}px) scale(${archView.zoom})`,
      transformOrigin: "0 0",
    }}
    dangerouslySetInnerHTML={{ __html: cameraSvg }}
  />
</div>
<div data-arch-resize /* ns-resize handle → setArchH */ />
```

## Holistic layout

Snake wrap (2–3 nodes/row). Generous gaps so connectors + labels breathe:

| Constant | Value |
|----------|--------|
| `NODE_W` / `NODE_H` | ~240 × 96 |
| `GAP_X` | **≥ 90** |
| `GAP_Y` | **≥ 100** |
| `PAD` | ≥ 36 |

```
[1] → [2] → [3]
              ↓
[6] ← [5] ← [4]
 ↓
[7] → [8] → [9]
```

Edge labels sit in a small chip **offset from the stroke** (above along-edges;
beside wrap-edges) with an editor-bg pill so they never collide with nodes.

## Page structure

1. Title + one-sentence overview
2. **Architecture** — beautiful-mermaid SVG tabs + hotspot chips (**full viewport contract**)
3. Toolbar
4. **Row:** **left sidebar** (+ right-edge resize) | **map** (viewport + height resize) | **right file tree** (+ left-edge resize, `treeW` ~200–720)
5. Optional gotchas

### Three-column layout

```
[ detail sidebar ] | [ pan/zoom map ] | [ file tree ]
```

- Left: focus detail (`DocBlock[]`, Source, navigation)
- Center: snake-wrapped nodes + clickable edges
- Right: paths referenced anywhere in `NODES` + `EDGES` (not the whole monorepo)

Tree is rooted at the repo `ROOT`; display relative paths (`crates/...`).
Default: top-level folders only, closed. Hover expands ancestors and highlights
matching rows.

## Data shape

**`FILE_MAP` is the global registry** — every path/range lives there once.
Nodes and edges only hold keys (`fileRef("…")`, `{ type: "code", ref: "…" }`).
Sidebar text is `snippet(key)` from `FILE_CONTENTS` (generated by Bun sync).

```ts
type FileRef = {
  path: string;
  line?: number;
  endLine?: number; // inclusive highlight end; omit → same as line
  label?: string;
};

// Author this block; sync reads ONLY it (never scrapes NODES/EDGES).
const FILE_MAP = {
  "crates/foo/src/bar.rs:Trait": {
    path: `${ROOT}/crates/foo/src/bar.rs`,
    line: 42,
    endLine: 58,
    label: "Trait",
  },
} as const satisfies Record<string, FileRef>;

type DocBlock =
  | { type: "prose"; text: string }
  | { type: "code"; ref: string; caption?: string }; // key of FILE_MAP

type MapNode = {
  id: string;
  label: string;
  teaser: string;   // ON node
  body: DocBlock[]; // sidebar — interleaved prose + code
  files: FileRef[]; // bottom Source index — use fileRef("…")
};

type MapEdge = {
  from: string;
  to: string;
  label: string;    // ON edge chip (≤ 3 words)
  body: DocBlock[]; // sidebar — explain the dependency with code
  files: FileRef[]; // traits, APIs, types, call sites
};

type Focus =
  | { kind: "node"; id: string }
  | { kind: "edge"; key: string }; // `${from}->${to}`
```

Every primary-path node **and** edge needs `body: DocBlock[]` with at least one
code block. Prose-only sidebars are an anti-pattern.

## Sidebar (left, required)

- Persisted `sidebarOpen`, `sidebarW` (clamp ~240–900)
- Drag handle on the **right** edge of the sidebar (`cursor: ew-resize`)
- **Auto type scale** from width, e.g.:

```ts
function sidebarType(width: number) {
  const t = clamp((width - 240) / (900 - 240), 0, 1);
  return {
    title: 14 + t * 6,
    body: 12 + t * 4,
    meta: 11 + t * 3,
    code: 11 + t * 3,
    gap: 10 + t * 6,
    pad: 12 + t * 8,
  };
}
```

Apply via `style={{ fontSize }}` on `Text` (string children don't inherit markdown sizing alone).

### Body rendering

Render `body` as a vertical stack:

| Block | UI |
|-------|-----|
| `prose` | `Text` with `richInline` (backtick splitter) at `typeScale.body` |
| `code` | Resolve `fileRef(block.ref)` + `snippet(block.ref)`. Compact panel: ghost `Button` header (`path:line` → **preview popup**), optional caption, **`DiffView`**. See [code-preview.md](code-preview.md). |

After all blocks: **Source** section listing `files` as ghost buttons (same as today).

**Node focus:** step pill, label, body blocks, Source, Prev/Next  
**Edge focus:** "Dependency" pill, `label: from → to`, body blocks, Source, buttons to jump to endpoint nodes

Selecting a node or edge always opens the sidebar.

## File tree (right, required)

Build from `collectFiles` over `NODES` + `EDGES` (`files` + `body` refs →
`fileRef`). Strip `ROOT` prefix for display.

Persisted width: `useCanvasState("treeW", 280)` clamped ~200–720. Drag handle on
the **left** edge of the tree (`cursor: ew-resize`); dragging left widens the
panel (`width - (clientX - originX)`).

```ts
const ROOT = "/abs/path/to/repo";

function relPath(abs: string): string {
  return abs.startsWith(`${ROOT}/`) ? abs.slice(ROOT.length + 1) : abs;
}

function collectFiles(entity: { files: FileRef[]; body: DocBlock[] }): FileRef[] {
  // union entity.files + fileRef(code.ref); dedupe by path:line
}

// Ephemeral hover state — not persisted
const [hoverPaths, setHoverPaths] = useState<string[]>([]); // relative paths

function previewFiles(refs: FileRef[]) {
  setHoverPaths([...new Set(refs.map((r) => relPath(r.path)))]);
}
function clearPreview() { setHoverPaths([]); }
```

### Hover-preview contract

Wire `onMouseEnter` / `onMouseLeave` on:

| Source | `previewFiles` payload |
|--------|------------------------|
| Map node card | `collectFiles(node)` |
| Map edge `<g>` | `collectFiles(edge)` |
| Sidebar Source button | `[file]` |
| Sidebar code block (header + `DiffView` wrapper) | `[fileRef(block.ref)]` |

On leave: `clearPreview()` — use `relatedTarget` containment checks when
moving between children (header → DiffView) to avoid flicker.

### Highlight layers

| Layer | Source | Behavior |
|-------|--------|----------|
| `selectedPaths` | Focused node/edge `collectFiles(...)` | Sticky while selection remains |
| `hoverPaths` | Mouse enter on node/edge/Source/code | Clears on leave; **adds** to selection highlights |

Tree expands for `selectedPaths ∪ hoverPaths`. Collapse to compact top-level
only when **both** are empty. Selected file rows use stronger fill; hover-only
rows use lighter fill. Both get accent border.

Hover handlers must be on native DOM elements (`div`, `g`, etc.). Canvas
`Button` / `Stack` do **not** forward `onMouseEnter` / `onMouseLeave` — wrap
Source links and code panels in a `div` for preview wiring.

Click tree file row → **preview popup** (`previewFile({ path: absPath })`), not IDE.

Pass `previewFile` / `onPreviewFiles` / `onClearPreview` into `renderDocBlocks`.

### Code preview popup (required)

**STOP — implement [code-preview.md](code-preview.md).** Ordinary code links
must not `dispatch(openFile)`. Modal: full file + highlight range +
diagonal-arrow open-in-editor.

**Global `FILE_MAP` is the only path registry** (see [code-preview.md](code-preview.md)).
Nodes/edges use `fileRef("key")` and `{ type: "code", ref: "key" }` — never
scatter ad-hoc FileRefs or inline `code:\`…\``. Sync with Bun:

```bash
# SKILL_DIR = directory containing this skill's SKILL.md
cd "$SKILL_DIR/scripts"
bun update.ts --file "$MAP_FILE"
bun update.ts --file "$MAP_FILE" --check
```

Add/edit entries only in `FILE_MAP` (`path` + `line`/`endLine` + `label`); one
`bun update.ts` regenerates `FILE_CONTENTS` **and** file-tree `MAP_PATHS`. Do
not hand-edit generated blocks; do not scrape NODES to build the tree.

## Clickable edges

- Wide invisible stroke (`strokeWidth` ~16–20, `transparent`) under the visible path for hit testing
- Visible stroke + arrow; active when focused (or adjacent to focused node)
- Label chip is part of the same clickable `<g data-map-edge>`
- `onClick` → `setFocus({ kind: "edge", key })`

## Nodes

Teaser only on the card. Click → node focus + sidebar.
**Do not** pan/translate the camera on node or edge click — only user pan/zoom/Fit moves the view.

## Viewport (snake map)

- Pan empty background; dotted background
- Height resize handle under map
- Zoom / Fit

## Inline code

```tsx
function richInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1
      ? <Code key={i}>{part.slice(1, -1)}</Code>
      : part,
  );
}
```

## Authoring code excerpts

- Add every path/range to **`FILE_MAP`** first; never inline `code:\`…\`` in nodes
- Sidebar blocks use `{ type: "code", ref: "<FILE_MAP key>" }` → `snippet(ref)`
- Source arrays use `fileRef("<key>")` (same registry)
- Prefer real 4–14 line ranges (`line` + `endLine`) over single-line stubs
- After edits: `bun sync-file-map.ts --file …` then `--check`

## Anti-patterns

- Sidebar on the right **only** (detail belongs left; tree belongs right)
- npm-importing `@pierre/trees`, `@pierre/diffs`, or `beautiful-mermaid` into `.canvas.tsx`
- Hand-drawn architecture boxes when Mermaid would be clearer — pre-render instead
- Architecture diagrams with no hotspots / no link to map focus
- **Static / scroll-only Mermaid** (`overflow: auto` + `width="100%"`) — must use the architecture viewport contract
- **Hotspot click via `e.target` after `setPointerCapture`** — nodes will not activate; use `downTargetRef` + `elementFromPoint`
- Architecture diagram with no selection highlight / no pointer cursor on hotspots
- Fixed sidebar width with unreadably small/large type when resized
- Tight gaps / labels overlapping nodes
- Edges that are decoration only (no body/files)
- Plain `<pre>` code in the sidebar (no language coloring — use `DiffView`)
- Code link → IDE only (must open in-canvas preview first)
- Preview shows excerpt only / missing `FILE_CONTENTS` embeds
- Long copy on node cards
- **Prose-only sidebars** — always interleave code excerpts for nodes and edges

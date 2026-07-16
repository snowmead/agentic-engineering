# Canvas pattern — spatial map

Canvases import **only named exports** from `cursor/canvas` (+ React hooks/types).
Never `import * as MapHost from "cursor/canvas"` — the canvas runtime does not
bind namespace imports, and the SDK has no `FileTreePanel` (use the scaffold’s
inlined `BuiltinFileTreePanel`). Build a React Flow–like map with wrapped rows,
pan/zoom, resizable left sidebar, concise teasers, **clickable edges** that open
dependency detail with interleaved code, and a **right file tree** for
hover-preview navigation.

**Start from the host template** — do not invent chrome from scratch:

- **Cursor Canvas:** copy [scaffold.canvas.tsx](scaffold.canvas.tsx) (generated from
  [`app/src/Map.tsx`](app/src/Map.tsx)) into the project `canvases/` dir
- **Bun React:** `bun scripts/map-dir.ts <name> --init` → `$TMPDIR/<repo-slug>/maps/<name>/` (never under the target repo; Canvas/Cursor skips this)

### Native `cursor/canvas` chrome

Use SDK surfaces for overlay and chrome. Keep pan/zoom, snake layout, Mermaid
world, modal backdrop, and resize handles custom.

| UI | SDK composition |
|----|-----------------|
| Left/right floating panels | Absolute positioning wrapper + `Card` / `CardHeader` / `CardBody` |
| Sidebar title + close | `CardHeader` with `trailing={<IconButton…/>}` (plain text title) |
| Code excerpts | `Card` + `CardHeader` + `CardBody style={{ padding: 0 }}` + `DiffView` |
| Builtin tree folders | Compact custom rows (18px). Skip `CollapsibleSection` (too tall for dense trees). |
| Modal missing-file tip | `Callout tone="info"` in the modal body |
| Toolbar grouping | `Card` shell + `Row` / `Grid` / `Divider` / `Spacer` |
| Style tweaks on SDK comps | `mergeStyle(base, override)` |

**`Link` vs `Button`.** `Link` is for real `http(s)` URLs in the browser. File
preview and open-in-IDE stay `Button` + `previewFile` / `useCanvasAction`.
`richInline` turns markdown links and bare URLs into `Link`; backtick code
stays `Code`.

Bun preview polyfills the same named exports in [`app/src/host`](app/src/host)
so `Map.tsx` stays one source of truth. Canvas gets the real SDK via scaffold.

Then replace `ROOT` / `FILE_MAP` / `NODES` / `EDGES` / `ARCH_DIAGRAMS`. Durable
UI is one **full-bleed** pan/zoom world: Mermaid architecture SVG stacked above
the snake flowchart in a shared camera, with floating left/right overlays.
After the `Add more context below.` comment, agents may add optional ad-hoc
sections; do not bake in a required “Gotchas” section.

**Do not** npm-import `@pierre/trees`, `@pierre/diffs`, `beautiful-mermaid`,
or React Flow into `.canvas.tsx` or Bun `Map.tsx`. Bun pierre DiffView stays in
`app/src/host` (Vite).

## External UX mapping

| Inspiration | Package | Host DiffView |
|-------------|---------|---------------|
| [diffs.com](https://diffs.com/) | `@pierre/diffs` | **Canvas:** Shiki via `cursor/canvas` + `path` / `language`. **Bun/Vite:** `@pierre/diffs` `File` in `app/src/host` (worker pool via `?worker&url` in `main.tsx`) |
| [trees.software](https://trees.software/) | `@pierre/trees` | **Canvas:** builtin `FileTreePanel` in Map.tsx. **Bun/Vite:** `@pierre/trees` in `app/src/host` `FileTreePanel` |
| [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | `beautiful-mermaid` | **Pre-render SVG** with `scripts/render-mermaid.mjs`; embed + hotspots |

Anti-patterns:
- `import … from "@pierre/*"` or `beautiful-mermaid` in `.canvas.tsx` or Bun
  `Map.tsx`. Pierre belongs only in the Bun **host** (`app/src/host` + diffs
  worker pool in `main.tsx`). Do not use `Bun.serve` HTML for the map app —
  Vite is required for diffs workers.
- `import * as … from "cursor/canvas"` (or any `MapHost` bridge) in a
  `.canvas.tsx` — causes `MapHost is not defined` at runtime. The scaffold
  generator strips this; Bun keeps `import * as MapHost from "./host"` only.

## Architecture diagrams

Place **above** the snake nodes in the **same** camera world (`ARCH_SNAKE_GAP`
between regions). 1–3 diagrams; switch with floating toolbar pills.
Pick Mermaid kind while authoring — see [SKILL.md](SKILL.md) Mermaid kind table.

**STOP — read and keep [architecture-viewport.md](architecture-viewport.md)
in full.** That file is the source of truth for shared pan/zoom/Fit, hotspot
click hit-testing under pointer capture, selection chrome, and pointer cursor.
A static scrollable SVG is a **ship blocker**. Scaffold already embeds the arch
SVG in the unified `MapView` world; do not invent a second viewport.

### Data + interactivity

```ts
type ArchHotspot = { label: string; nodeId?: string; edgeKey?: string };
type ArchDiagram = {
  id: string;
  title: string;
  kind: "flowchart" | "sequence" | "class" | "er" | "state" | "c4";
  svg: string; // from beautiful-mermaid — never runtime-rendered in canvas
  hotspots: ArchHotspot[];
};
```

- Render at authoring time: `bun scripts/render-mermaid.mjs --json --file …`
- Keep `viewBox`; drop `@import` fonts. Camera world sizing via `svgForCamera`
  — see [architecture-viewport.md](architecture-viewport.md).
- Persist `archDiagram` + shared `view` (no separate `archView` / height keys)
- SVG hotspot shapes select map nodes/edges (no toolbar hotspot chip row)
- Hover hotspot chip → `previewFiles(collectFiles(entity))`

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

1. **Full-bleed shell** (`position: fixed; inset: 0` — escapes CanvasShell
   page padding) with one `data-map-viewport`
2. **Unified world** — Mermaid arch SVG at `y≈0`, snake map below (`ARCH_SNAKE_GAP`)
3. **Floating toolbar** — bottom-center overlay; icon Zoom/Fit/Prev/Next only
4. **Overlay sidebars** — left detail + right file tree hover over the diagram
5. Optional ad-hoc sections **only** below `Add more context below.` — no ritual Gotchas

### Full-bleed overlay layout

```
┌─────────────────────────────────────────────┐
│  ┌────────┐              ┌──────────────┐   │
│  │ left   │   full-bleed │ right tree   │   │
│  │ detail │   pan/zoom   │              │   │
│  │ overlay│   world      │   overlay    │   │
│  └────────┘              └──────────────┘   │
│           [ floating toolbar · bottom ]     │
└─────────────────────────────────────────────┘
```

- Diagram: edge-to-edge; no map border, no height-resize gutters, no flex columns
- Sidebars float with inset (`OVERLAY_INSET` ~14px from top/bottom/outer edge);
  toolbar floats bottom-center (`data-map-toolbar`, `bottom: 16`)
- Left overlay: focus detail (`DocBlock[]`, navigation); right-edge resize
- Right overlay: paths from `NODES` + `EDGES` (`treeW` ~200–720); left-edge resize
- Overlays float (`position: absolute`); they must **not** shrink map width
- Default camera / Fit: `{ x: 0, y: 0, zoom: 1 }` — no offset dead space at top-left

Tree is rooted at the repo `ROOT`; display relative paths (`crates/...`).
Default: top-level folders only, closed. Hover expands ancestors and highlights
matching rows.

## Data shape

**`FILE_MAP` is the global registry** — see [code-preview.md](code-preview.md).
Nodes and edges only hold keys (`fileRef("…")`, `{ type: "code", ref: "…" }`).
Sidebar text is `snippet(key)` from `FILE_CONTENTS` (generated by `bun update.ts`).

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
  files: FileRef[]; // tree + hover collection — use fileRef("…")
};

type MapEdge = {
  from: string;
  to: string;
  label: string;    // ON edge chip (≤ 3 words)
  body: DocBlock[]; // sidebar — explain the dependency with code
  files: FileRef[]; // tree + hover collection
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
| `prose` | `Text` with `richInline` (backticks → `Code`; `http(s)` / markdown links → `Link`) at `typeScale.body` |
| `code` | Resolve `fileRef(block.ref)` + `snippet(block.ref)`. Ghost `Button` path (`path:line` → **preview popup**), optional caption, then `Card` / `CardHeader` / `CardBody` + **`DiffView`**. See [code-preview.md](code-preview.md). |

Do **not** add a separate Source footer — code block headers already open previews.

**Node focus:** step pill, label, body blocks  
**Edge focus:** "Dependency" pill, `label: from → to`, body blocks

Selecting a node or edge always opens the sidebar.

## File tree (right, required)

Build from `collectFiles` over `NODES` + `EDGES` (`files` + `body` refs →
`fileRef`). Strip `ROOT` prefix for display. Tree paths themselves come from
generated `MAP_PATHS` — see [code-preview.md](code-preview.md).

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
| Sidebar code block (header + `DiffView` wrapper) | `[fileRef(block.ref)]` |

On leave: `clearPreview()` — use `relatedTarget` containment checks when
moving between children (header → DiffView) to avoid flicker.

### Highlight layers

| Layer | Source | Behavior |
|-------|--------|----------|
| `selectedPaths` | Focused node/edge `collectFiles(...)` | Sticky while selection remains |
| `hoverPaths` | Mouse enter on node/edge/code | Clears on leave; **adds** to selection highlights |

Tree expands for `selectedPaths ∪ hoverPaths`. Collapse to compact top-level
only when **both** are empty. Selected file rows use stronger fill; hover-only
rows use lighter fill. Both get accent border.

Hover handlers must be on native DOM elements (`div`, `g`, etc.). Canvas
`Button` / `Stack` do **not** forward `onMouseEnter` / `onMouseLeave` — wrap
code panels in a `div` for preview wiring.

Click tree file row → **preview popup** (`previewFile({ path: absPath })`), not IDE.
Pass `previewFile` / `onPreviewFiles` / `onClearPreview` into `renderDocBlocks`.

Code preview popup + `FILE_MAP` sync: [code-preview.md](code-preview.md)
(`bun update.ts --file "$MAP_FILE"`; `--check` clean before ship).

## Clickable edges

- Wide invisible stroke (`strokeWidth` ~16–20, `transparent`) under the visible path for hit testing
- Visible stroke + arrow; active when focused (or adjacent to focused node)
- Label chip is part of the same clickable `<g data-map-edge>`
- `onClick` → `setFocus({ kind: "edge", key })`

## Nodes

Teaser only on the card. Click → node focus + sidebar.
**Do not** pan/translate the camera on node or edge click — only user pan/zoom/Fit moves the view.

## Viewport (unified map)

- Single full-bleed viewport; pan empty background; dotted background
- Shared Zoom / Fit for arch + snake (no per-panel height resize)
- Skip pan start on `[data-map-node]`, `[data-map-edge]`, overlay panels

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
- After edits: `bun update.ts --file …` then `--check` — see [code-preview.md](code-preview.md)

## Anti-patterns

- Flex three-column layout that **pushes** the map narrower (overlays float instead)
- Separate arch and snake cameras / height resizers
- Sidebar on the right **only** (detail belongs left; tree belongs right)
- Canvas `Button` / `Stack` for hover — they don't forward mouse events; wrap in `div`/`g`
- npm-importing `@pierre/trees`, `@pierre/diffs`, or `beautiful-mermaid` into `.canvas.tsx`
  or Bun `Map.tsx` (pierre DiffView belongs in `app/src/host` only)
- Serving the Bun map with `Bun.serve` HTML instead of Vite (breaks pierre workers)
- Naming the default export `Map` (shadows `globalThis.Map` → stack overflow)
- Fixed sidebar width with unreadably small/large type when resized
- Tight gaps / labels overlapping nodes
- Edges that are decoration only (no body/files)
- Long copy on node cards
- **Prose-only sidebars** — always interleave code excerpts for nodes and edges

# In-canvas code preview — required contract

**Mandatory.** Code links in a map must open an **in-host
popup** showing the full file with the target line/range highlighted. Jumping
straight to the IDE is only via an explicit “open in editor” control.

Canvases cannot `fetch()` or read the filesystem at runtime. Embed every
referenced file’s full text at author time in `FILE_CONTENTS`.

## Single source of truth: `FILE_MAP`

Every code path, sidebar excerpt, Source footer entry, **file tree path**, and
preview body **derives from one global registry** — `FILE_MAP`.

```tsx
// <map:file-map>
const FILE_MAP = {
  "crates/foo/src/bar.rs:TraitName": {
    path: `${ROOT}/crates/foo/src/bar.rs`,
    line: 42,
    endLine: 58,
    label: "TraitName",
  },
  // …
} as const satisfies Record<string, FileRef>;

type FileMapKey = keyof typeof FILE_MAP;
function fileRef(key: FileMapKey | string): FileRef { /* … */ }
function snippet(key: FileMapKey | string): string { /* slice FILE_CONTENTS */ }
// </map:file-map>

// <map:file-contents>
/** @generated — do not edit */
const FILE_CONTENTS: Record<string, string> = { /* … */ };
// </map:file-contents>

// <map:map-paths>
/** @generated — do not edit; drives the right-hand file tree */
const MAP_PATHS: string[] = [ /* unique abs paths from FILE_MAP */ ];
// </map:map-paths>
```

| Concern | Source |
|---------|--------|
| Path + highlight range | `FILE_MAP[key]` |
| Sidebar DiffView excerpt | `snippet(key)` |
| Full-file preview popup | `FILE_CONTENTS[ref.path]` |
| Right file tree | `buildTree(MAP_PATHS)` (generated) |
| Node/edge `files` / DocBlock code | `fileRef("…")` / `{ type: "code", ref: "…" }` |

**Do not** invent ad-hoc `{ path, line, code: \`…\` }` in node bodies. Add a
`FILE_MAP` entry, then point at its key.

## One command: `bun update.ts`

Start from the Canvas scaffold or Bun `app/` template (markers + helpers already
present). Edit **only** `FILE_MAP` (and node/edge keys that reference it). Then
run **one** update — it regenerates preview bodies **and** the file tree:

```bash
# SKILL_DIR = directory containing this skill's SKILL.md
# MAP_FILE = .canvas.tsx (Canvas) or maps/<name>/src/Map.tsx (Bun)
cd "$SKILL_DIR/scripts"

bun update.ts --file "$MAP_FILE"
bun update.ts --file "$MAP_FILE" --check
bun update.ts --file "$MAP_FILE" --dry-run
```

`--canvas` is an alias for `--file`. Also: `bun sync-file-map.ts …`.

What the script does:

1. Reads `const ROOT = "…"` (or `--root`)
2. Parses **only** the `FILE_MAP` marked block — never scrapes NODES/EDGES
3. Unique-paths → parallel `Bun.file(path).text()`
4. Rewrites `FILE_CONTENTS` + `MAP_PATHS` with `Bun.write`
5. Warns on missing files / out-of-range `line`/`endLine`

**Ship rule:** `--check` must pass before delivering a map.

## UX

| Action | Result |
|--------|--------|
| Click path header / Source row / file-tree file / sidebar code panel | Open preview modal |
| Preview modal | Full file via `DiffView`; focus lines marked `type: "added"` + accent strip; auto-scroll to range |
| Diagonal-arrow `IconButton` in modal header | `dispatch({ type: "openFile", path, selection })` |
| Backdrop click / Close / Escape | Dismiss modal |

**DiffView highlighting:** always pass `path={file.path}` (extension drives language).

| Host | Coloring |
|------|----------|
| Cursor Canvas (`cursor/canvas`) | Shiki via `path` / optional `language` |
| Bun (`app/src/host`) | Sync TS/TSX/JS tokenizer in host DiffView (same `path` prop; not Shiki / not `@pierre/diffs`) |

`FILE_CONTENTS` stays plain text; highlighting is a host concern only.

Help affordance: path label shows `path:line` or `path:start-end`.

## FileRef (shape inside FILE_MAP)

```ts
type FileRef = {
  path: string;       // absolute — prefer `\`${ROOT}/rel\``
  line?: number;      // 1-based highlight start
  endLine?: number;   // inclusive; omit → same as line
  label?: string;
};
```

Sidebar excerpts use `snippet(key)` so ranges stay in sync with `FILE_MAP`
`line`/`endLine`. Prefer real ranges (4–14 lines), not single-line stubs.

## Modal shape (copy into canvas once)

- Fixed full-canvas overlay (`zIndex: 1000`), click backdrop to close
- Centered panel: header (path + `IconButton` open-external SVG + Close) +
  scrollable `DiffView` body
- `fileToPreviewLines(content, start, end)` — focus lines `added`, others
  `unchanged`, all numbered from 1
- Scroll on open: `scrollTop ≈ (start - 1) * 18 - 72`
- Open-external icon: northeast arrow (line out of box) — not emoji
- Bodies come from `FILE_CONTENTS[path]` (maintained by update script)

## Wiring

- `previewFile(ref)` → `setFilePreview(ref)` (ephemeral `useState`, not
  `useCanvasState`)
- `openInIde(ref)` → canvas `openFile` action with selection spanning
  `highlightRange(ref)`
- Do **not** call `openInIde` from ordinary code links
- Tree: `buildTree(collectAllMapPaths())` where `collectAllMapPaths` reads
  `MAP_PATHS` (fallback: unique paths from `FILE_MAP`)

## Anti-patterns

- Code link → IDE only (no popup)
- Popup shows only the excerpt, not the full file
- Runtime `fetch` / `fs.readFile` for file bodies
- Hand-editing `FILE_CONTENTS` or `MAP_PATHS`
- Building the tree by scraping NODES/EDGES instead of `MAP_PATHS` / `FILE_MAP`
- Scattering FileRefs / inline `code:\`…\`` instead of `FILE_MAP` keys
- Using npm/`node` for sync — use **Bun** (`bun update.ts`)
- Shipping with stale embed (`--check` would fail)
- Missing `FILE_CONTENTS` / `MAP_PATHS` for `FILE_MAP` paths
- No open-in-editor control on the modal

# Architecture viewport — required contract

Every map’s Mermaid architecture region must satisfy this contract. Do **not**
ship a static `overflow: auto` SVG box.

Architecture lives **inside the unified map camera** in
([`app/src/Map.tsx`](app/src/Map.tsx) / [`scaffold.canvas.tsx`](scaffold.canvas.tsx))
— stacked above the snake flowchart in one full-bleed `data-map-viewport`.
Do not invent a second pan/zoom box. If forking, preserve this contract
end-to-end (canvases cannot import sibling files, so any fork must carry the
helpers inline).

## Forbidden (regressions we already hit)

| Anti-pattern | Why it fails |
|--------------|--------------|
| `<div style={{ overflow: "auto", maxHeight }} dangerouslySetInnerHTML={svg} />` | No pan, no zoom |
| Embedding SVG with `width="100%"` as the camera world | Pan/zoom fights layout scaling |
| Activating hotspots with `onClick` / `e.target` after `setPointerCapture` | Capture **retargets** `pointerup` to the viewport — nodes look dead |
| Ignoring selection in the SVG | Reader loses the link between map focus and the diagram |
| Viewport always `cursor: grab` | Hotspots feel non-interactive |
| Separate arch camera (`archView`) + snake camera (`view`) | Breaks the single full-bleed world |
| Per-panel height resize (`archViewportH` / `viewportH`) | Dead space; shell is `100vh` |

## Required UX checklist

Before delivering a map, verify **all** of these on the unified viewport:

- [ ] Zoom − / Zoom + / Fit buttons + zoom % label (floating toolbar)
- [ ] Ctrl/Cmd+wheel zooms (plain wheel does not); drag empty background pans (shared camera)
- [ ] Click-without-drag on a hotspot selects the mapped node/edge (sidebar opens)
- [ ] Pan does **not** select (use `didPan` threshold ~3px)
- [ ] Arch SVG and snake nodes share one `view` transform; snake offset by `ARCH_SNAKE_GAP`
- [ ] SVG rendered at **intrinsic viewBox** size inside the world layer (`data-arch-world`)
- [ ] Focused hotspot has accent stroke (+ light accent fill on first rect)
- [ ] Hovering a hotspot shows `cursor: pointer`; elsewhere `grab`; while dragging `grabbing`
- [ ] Diagram pills reset camera via Fit when switching diagrams
- [ ] SVG hotspot click still selects mapped node/edge (no toolbar hotspot chips)
- [ ] Pan does not start on `[data-map-node]` / `[data-map-edge]` / overlay panels

## Constants

```ts
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const ARCH_SNAKE_GAP = 100;
```

Persist:

- `useCanvasState("archDiagram", …)` — active Mermaid tab
- `useCanvasState("view", { x, y, zoom })` — **shared** camera for arch + snake

Do **not** persist separate `archView` or `archViewportH` / `viewportH`.

## Helpers (in scaffold; preserve if forking)

```ts
/** Intrinsic SVG size from viewBox — needed so pan/zoom isn't fighting width=100%. */
function svgWorldSize(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) return { w: 800, h: 600 };
  const parts = m[1].trim().split(/[\s,]+/).map(Number);
  const w = parts[2];
  const h = parts[3];
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { w: 800, h: 600 };
  }
  return { w, h };
}

function svgForCamera(svg: string, w: number, h: number): string {
  return svg
    .replace(/\swidth="[^"]*"/, ` width="${w}"`)
    .replace(/\sheight="[^"]*"/, ` height="${h}"`);
}

function cssEscapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Pointer cursor on hotspot shapes + accent stroke on the focused hotspot. */
function svgWithHotspotChrome(
  svg: string,
  hotspots: ArchHotspot[],
  activeLabels: string[],
  accent: string,
): string {
  const pointerSel = hotspots
    .map((h) => `[data-label="${cssEscapeAttr(h.label)}"]`)
    .join(", ");
  const activeGroupSel = activeLabels
    .map((l) => `[data-label="${cssEscapeAttr(l)}"]`)
    .join(", ");
  const activeRectSel = activeLabels
    .map((l) => `[data-label="${cssEscapeAttr(l)}"] > rect`)
    .join(", ");

  const rules: string[] = [];
  if (pointerSel) {
    rules.push(`${pointerSel}, ${pointerSel} * { cursor: pointer; }`);
  }
  if (activeRectSel) {
    rules.push(
      `${activeRectSel} { stroke: ${accent} !important; stroke-width: 2.5 !important; }`,
    );
  }
  if (activeGroupSel) {
    rules.push(
      `${activeGroupSel} > rect:first-of-type { fill: color-mix(in srgb, ${accent} 18%, var(--_node-fill, transparent)) !important; }`,
    );
  }
  if (rules.length === 0) return svg;

  const style = `<style data-arch-hotspot-chrome>${rules.join("\n")}</style>`;
  return svg.replace(/<svg([^>]*)>/, `<svg$1>${style}`);
}
```

Build the camera SVG with `useMemo`:

```ts
const activeLabels = useMemo(
  () =>
    diagram.hotspots
      .filter((h) => {
        if (h.nodeId && focus.kind === "node") return focus.id === h.nodeId;
        if (h.edgeKey && focus.kind === "edge") return focus.key === h.edgeKey;
        return false;
      })
      .map((h) => h.label),
  [diagram.hotspots, focus],
);

const cameraSvg = useMemo(
  () =>
    svgWithHotspotChrome(
      svgForCamera(diagram.svg, archWorld.w, archWorld.h),
      diagram.hotspots,
      activeLabels,
      theme.accent.primary,
    ),
  [diagram.svg, diagram.hotspots, archWorld.w, archWorld.h, activeLabels, theme.accent.primary],
);
```

Hotspot hit-testing (beautiful-mermaid emits `data-label` on `.node` / `.actor` / `.class-node`):

```ts
function hitFromEvent(target: Element): ArchHotspot | null {
  const labeled = target.closest(
    "[data-label], .node, .actor, .class-node",
  );
  const fromAttr = labeled?.getAttribute("data-label")?.trim();
  const fromText = target.closest("text, tspan")?.textContent?.trim();
  const label = fromAttr || fromText;
  if (!label) return null;
  return (
    diagram.hotspots.find(
      (h) => label === h.label || label.includes(h.label),
    ) ?? null
  );
}
```

## Pointer capture — click activation (critical)

`setPointerCapture` on the unified viewport is required for reliable pan, but it
**retargets** subsequent events to the viewport. Never use `e.target` from
`pointerup` alone.

Skip pan start when the target is inside
`[data-map-node], [data-map-edge], [data-sidebar-resize], [data-tree-resize], [data-map-sidebar], [data-map-tree]`.

Required pattern:

```ts
const didPanRef = useRef(false);
const downTargetRef = useRef<Element | null>(null);

onPointerDown={(e) => {
  if (panStartBlocked(e.target as Element)) return;
  didPanRef.current = false;
  downTargetRef.current = e.target as Element;
  // … store drag origin, setPointerCapture …
}}

onPointerMove={(e) => {
  // if dragging: update view; set didPanRef if movement > 3px
  // else: updateHoverCursor(e.clientX, e.clientY)
}}

onPointerUp={(e) => {
  releasePointerCapture(…);
  if (!didPanRef.current) {
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const hit =
      (under ? hitFromEvent(under) : null) ??
      (downTargetRef.current ? hitFromEvent(downTargetRef.current) : null);
    if (hit) activateHotspot(hit);
  }
  downTargetRef.current = null;
  didPanRef.current = false;
  // … clear drag, refresh hover cursor …
}}
```

## Cursor

Viewport style (not only CSS on SVG — coordinate with drag state):

```ts
cursor: dragging ? "grabbing" : overHotspot ? "pointer" : "grab"
```

`overHotspot` from `elementFromPoint` + `hitFromEvent` while **not** dragging;
clear on `pointerLeave` and while a pan is active.

## World layout (arch + snake)

```tsx
<div data-map-viewport /* absolute inset 0; dotted bg; pointer handlers */>
  <div
    style={{
      position: "absolute",
      transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
      transformOrigin: "0 0",
      width: worldW,
      height: worldH,
    }}
  >
    <div
      data-arch-world
      style={{ position: "absolute", left: 0, top: 0, width: archWorld.w, height: archWorld.h }}
      dangerouslySetInnerHTML={{ __html: cameraSvg }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: archWorld.h + ARCH_SNAKE_GAP,
        width: layout.width,
        height: layout.height,
      }}
    >
      {/* snake SVG edges + HTML nodes */}
    </div>
  </div>
</div>
```

## Toolbar

Floating toolbar sits bottom-center over the diagram (`data-map-toolbar`):
icon Zoom/Fit/Prev/Next (and zoom %). Affordances: pan empty background,
Ctrl/Cmd+wheel zoom (or icon buttons), click SVG hotspot/shape to focus the
overlay sidebar. Exact wording is not mandated.

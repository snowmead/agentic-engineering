# Architecture viewport — required contract

Every map’s Mermaid architecture panel must satisfy this contract. Do **not**
ship a static `overflow: auto` SVG box.

Helpers and interaction below are **already in the host scaffold**
([`app/src/Map.tsx`](app/src/Map.tsx) / [`scaffold.canvas.tsx`](scaffold.canvas.tsx)).
Keep that chrome; do not invent a simpler viewport. If forking the panel,
preserve this contract end-to-end (canvases cannot import sibling files, so any
fork must carry the helpers inline).

## Forbidden (regressions we already hit)

| Anti-pattern | Why it fails |
|--------------|--------------|
| `<div style={{ overflow: "auto", maxHeight }} dangerouslySetInnerHTML={svg} />` | No pan, no zoom, no vertical resize |
| Embedding SVG with `width="100%"` as the camera world | Pan/zoom fights layout scaling |
| Activating hotspots with `onClick` / `e.target` after `setPointerCapture` | Capture **retargets** `pointerup` to the viewport — nodes look dead |
| Ignoring selection in the SVG | Reader loses the link between map focus and the diagram |
| Viewport always `cursor: grab` | Hotspots feel non-interactive |

## Required UX checklist

Before delivering a map, verify **all** of these on the architecture panel:

- [ ] Zoom − / Zoom + / Fit buttons + zoom % label
- [ ] Wheel zooms; drag empty background pans
- [ ] Click-without-drag on a hotspot selects the mapped node/edge (sidebar opens)
- [ ] Pan does **not** select (use `didPan` threshold ~3px)
- [ ] Bottom `data-arch-resize` handle changes height (`archViewportH`, clamp ~220–900)
- [ ] SVG rendered at **intrinsic viewBox** size inside a `translate + scale` world layer
- [ ] Focused hotspot has accent stroke (+ light accent fill on first rect)
- [ ] Hovering a hotspot shows `cursor: pointer`; elsewhere `grab`; while dragging `grabbing`
- [ ] Diagram pills reset camera via Fit when switching diagrams
- [ ] Hotspot chips still work; hover chips → `previewFiles`

## Constants

```ts
const MIN_ARCH_H = 220;
const MAX_ARCH_H = 900;
const DEFAULT_ARCH_H = 360;
const MIN_ARCH_ZOOM = 0.4;
const MAX_ARCH_ZOOM = 2.5;
```

Persist:

- `useCanvasState("archDiagram", …)`
- `useCanvasState("archView", { x, y, zoom })`
- `useCanvasState("archViewportH", DEFAULT_ARCH_H)`

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
      svgForCamera(diagram.svg, world.w, world.h),
      diagram.hotspots,
      activeLabels,
      theme.accent.primary,
    ),
  [diagram.svg, diagram.hotspots, world.w, world.h, activeLabels, theme.accent.primary],
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

`setPointerCapture` on the viewport is required for reliable pan, but it
**retargets** subsequent events to the viewport. Never use `e.target` from
`pointerup` alone.

Required pattern:

```ts
const didPanRef = useRef(false);
const downTargetRef = useRef<Element | null>(null);

onPointerDown={(e) => {
  didPanRef.current = false;
  downTargetRef.current = e.target as Element;
  // … store drag origin, setPointerCapture …
}}

onPointerMove={(e) => {
  // if dragging: update archView; set didPanRef if movement > 3px
  // else: updateHoverCursor(e.clientX, e.clientY)
}}

onPointerUp={(e) => {
  releasePointerCapture(…);
  if (!didPanRef.current) {
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const hit =
      (under ? hitFromEvent(under) : null) ??
      (downTargetRef.current ? hitFromEvent(downTargetRef.current) : null);
    if (hit) activate(hit);
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

## Vertical resize

Sibling under the viewport (not inside the capture target):

```tsx
<div
  data-arch-resize
  title="Drag to resize architecture height"
  onPointerDown={/* capture; store { py, height: archH } */}
  onPointerMove={/* setArchH(clamp(origin.height + dy, MIN_ARCH_H, MAX_ARCH_H)) */}
  onPointerUp={/* release */}
  style={{ height: 12, cursor: "ns-resize", /* bar chrome */ }}
/>
```

## Viewport shell

```tsx
<div
  data-arch-viewport
  style={{
    position: "relative",
    width: "100%",
    height: archH,
    overflow: "hidden",
    /* dotted bg, grab/pointer/grabbing cursor */
  }}
  /* pointer handlers as above */
  onWheel={(e) => setArchZoom(archView.zoom + (e.deltaY > 0 ? -0.08 : 0.08))}
>
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: world.w,
      height: world.h,
      transform: `translate(${archView.x}px, ${archView.y}px) scale(${archView.zoom})`,
      transformOrigin: "0 0",
      padding: 8,
      boxSizing: "content-box",
    }}
    dangerouslySetInnerHTML={{ __html: cameraSvg }}
  />
</div>
```

## Toolbar

Toolbar should expose Zoom − / Zoom + / Fit (and zoom %) and surface the
viewport affordances: pan, scroll-zoom, bottom-edge resize, click shape/chip to
focus the map sidebar. Exact wording is not mandated.

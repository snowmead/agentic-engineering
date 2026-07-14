#!/usr/bin/env bun
/**
 * Pre-render Mermaid → SVG with beautiful-mermaid for embedding in Cursor canvases.
 *
 * Canvases cannot `import 'beautiful-mermaid'` — run this at authoring time and
 * paste the SVG string into the `.canvas.tsx` (or write beside it).
 *
 * Usage:
 *   bun render-mermaid.mjs < diagram.mmd > diagram.svg
 *   bun render-mermaid.mjs --json --file diagrams.json > diagrams.out.json
 *
 * JSON input: [{ "id": "flow", "mermaid": "graph TD\\n...", "hotspots": [...] }, ...]
 * JSON output: [{ "id": "flow", "svg": "<svg...", "hotspots": [...] }, ...]
 */
import { readFileSync } from "node:fs";
import { renderMermaidSVG } from "beautiful-mermaid";

function parseArgs(argv) {
  const out = { json: false, bg: "#1e1e1e", fg: "#d4d4d4", accent: "#3794ff" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--bg") out.bg = argv[++i];
    else if (a === "--fg") out.fg = argv[++i];
    else if (a === "--accent") out.accent = argv[++i];
    else if (a === "--file") out.file = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv);
const raw = args.file
  ? readFileSync(args.file, "utf8")
  : readFileSync(0, "utf8");

const opts = {
  bg: args.bg,
  fg: args.fg,
  accent: args.accent,
  transparent: true,
};

if (args.json) {
  const diagrams = JSON.parse(raw);
  const rendered = diagrams.map((d) => ({
    id: d.id,
    title: d.title ?? d.id,
    kind: d.kind ?? "flowchart",
    mermaid: d.mermaid,
    svg: renderMermaidSVG(d.mermaid, opts),
    hotspots: d.hotspots ?? [],
  }));
  process.stdout.write(JSON.stringify(rendered, null, 2));
} else {
  process.stdout.write(renderMermaidSVG(raw, opts));
}

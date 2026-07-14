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

function usage(code = 2) {
  console.error(`Usage:
  bun render-mermaid.mjs < diagram.mmd > diagram.svg
  bun render-mermaid.mjs --json --file diagrams.json > diagrams.out.json
  Options: --bg <color> --fg <color> --accent <color> --file <path> --json`);
  process.exit(code);
}

function parseArgs(argv) {
  const out = { json: false, bg: "#1e1e1e", fg: "#d4d4d4", accent: "#3794ff" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--bg") {
      const next = argv[++i];
      if (!next) usage();
      out.bg = next;
    } else if (a === "--fg") {
      const next = argv[++i];
      if (!next) usage();
      out.fg = next;
    } else if (a === "--accent") {
      const next = argv[++i];
      if (!next) usage();
      out.accent = next;
    } else if (a === "--file") {
      const next = argv[++i];
      if (!next) usage();
      out.file = next;
    }
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
    svg: renderMermaidSVG(d.mermaid, opts),
    hotspots: d.hotspots ?? [],
  }));
  process.stdout.write(JSON.stringify(rendered, null, 2));
} else {
  process.stdout.write(renderMermaidSVG(raw, opts));
}

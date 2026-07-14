#!/usr/bin/env bun
/**
 * Smoke-test Bun map host templates (run from app/ so React resolves).
 *
 *   bun verify-host.ts          # from app/
 *   bun run test:host           # from app/
 *   bun run verify              # from scripts/ → re-execs here
 */
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MapView from "./src/Map";
import { DiffView, tokenizeLine } from "./src/host";

const appRoot = import.meta.dir;
const skillRoot = resolve(appRoot, "..");
const mapPath = resolve(appRoot, "src/Map.tsx");

function fail(msg: string): never {
  console.error(`verify-host: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`verify-host: ok — ${msg}`);
}

// 1. Static: default export must not be named Map (shadows globalThis.Map)
const mapSrc = await Bun.file(mapPath).text();
if (/export\s+default\s+function\s+Map\s*\(/.test(mapSrc)) {
  fail(`${mapPath} exports default function Map() — rename to MapView`);
}
if (!/export\s+default\s+function\s+MapView\s*\(/.test(mapSrc)) {
  fail(`${mapPath} missing export default function MapView()`);
}
ok("Map.tsx default export is MapView (no Map shadow)");

// 2. SSR MapView — must not stack-overflow
let html: string;
try {
  html = renderToStaticMarkup(createElement(MapView));
} catch (e) {
  fail(`MapView render threw: ${e instanceof Error ? e.message : String(e)}`);
}
if (html.length < 1000) {
  fail(`MapView SSR too small (${html.length} chars)`);
}
ok(`MapView SSR (${html.length} chars)`);

// 3. DiffView syntax colors (tokenizer)
const fixtureLines = [
  "const n: Promise<number> = 42;",
  "// a comment",
  'const s = "hello";',
];
const kinds = new Set(
  fixtureLines.flatMap((line) =>
    tokenizeLine(line, "ts").map((t) => t.kind),
  ),
);
for (const need of ["comment", "string", "keyword", "number", "type"] as const) {
  if (!kinds.has(need)) fail(`tokenizer missing kind: ${need}`);
}
ok(`tokenizer kinds: ${[...kinds].sort().join(", ")}`);

const diffHtml = renderToStaticMarkup(
  createElement(DiffView, {
    path: "src/example.ts",
    lines: fixtureLines.map((content, i) => ({
      type: "unchanged" as const,
      content,
      lineNumber: i + 1,
    })),
  }),
);
const colors = new Set(
  [...diffHtml.matchAll(/color:\s*(#[0-9A-Fa-f]{3,8})/g)].map((m) => m[1]!),
);
if (colors.size < 5) {
  fail(
    `DiffView expected ≥5 distinct colors, got ${colors.size}: ${[...colors].join(", ")}`,
  );
}
ok(`DiffView colors (${colors.size}): ${[...colors].join(", ")}`);

// 4. Scaffold in sync
const check = Bun.spawnSync({
  cmd: ["bun", resolve(skillRoot, "scripts/build-canvas-scaffold.ts"), "--check"],
  cwd: skillRoot,
  stdout: "inherit",
  stderr: "inherit",
});
if (check.exitCode !== 0) {
  fail("scaffold.canvas.tsx out of date (run build-canvas-scaffold.ts)");
}
ok("scaffold.canvas.tsx up to date");

console.log("verify-host: all checks passed");

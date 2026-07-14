#!/usr/bin/env bun
/**
 * Smoke-test Vite + @pierre/diffs Bun map host.
 *
 *   bun verify-host.ts          # from app/
 *   bun run test:host           # from app/
 *   bun run verify              # from scripts/
 */
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MapView from "./src/Map";

const appRoot = import.meta.dir;
const skillRoot = resolve(appRoot, "..");
const mapPath = resolve(appRoot, "src/Map.tsx");
const hostPath = resolve(appRoot, "src/host/index.tsx");
const mainPath = resolve(appRoot, "src/main.tsx");
const workerFactoryPath = resolve(appRoot, "src/workerFactory.ts");

function fail(msg: string): never {
  console.error(`verify-host: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`verify-host: ok — ${msg}`);
}

// 1. Static: default export must not be named Map
const mapSrc = await Bun.file(mapPath).text();
if (/export\s+default\s+function\s+Map\s*\(/.test(mapSrc)) {
  fail(`${mapPath} exports default function Map() — rename to MapView`);
}
if (!/export\s+default\s+function\s+MapView\s*\(/.test(mapSrc)) {
  fail(`${mapPath} missing export default function MapView()`);
}
ok("Map.tsx default export is MapView (no Map shadow)");

// 2. Host uses @pierre/diffs; main wires worker pool
const hostSrc = await Bun.file(hostPath).text();
if (!hostSrc.includes("@pierre/diffs/react") || !hostSrc.includes("PierreFile")) {
  fail("host DiffView must use @pierre/diffs File (PierreFile)");
}
if (hostSrc.includes("tokenizeLine") || hostSrc.includes("VS Code Dark+")) {
  fail("host still has DIY tokenizer — remove it");
}
ok("host DiffView uses @pierre/diffs");

const mainSrc = await Bun.file(mainPath).text();
if (!mainSrc.includes("WorkerPoolContextProvider")) {
  fail("main.tsx must wrap MapView in WorkerPoolContextProvider");
}
const workerSrc = await Bun.file(workerFactoryPath).text();
if (!workerSrc.includes("?worker&url")) {
  fail("workerFactory must use Vite ?worker&url import");
}
ok("Vite worker pool wired in main.tsx");

// 3. SSR MapView — must not stack-overflow
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

// 4. Vite build emits worker chunk
const build = Bun.spawnSync({
  cmd: ["bun", "run", "build"],
  cwd: appRoot,
  stdout: "pipe",
  stderr: "pipe",
});
if (build.exitCode !== 0) {
  fail(`vite build failed:\n${build.stderr.toString()}`);
}
const distAssets = resolve(appRoot, "dist/assets");
const assets = [...new Bun.Glob("worker-*.js").scanSync({ cwd: distAssets })];
if (assets.length === 0) {
  fail("vite build did not emit worker-*.js (pierre worker pool broken)");
}
ok(`vite build emitted worker chunk: ${assets[0]}`);

// 5. Scaffold in sync
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

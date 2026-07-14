#!/usr/bin/env bun
/**
 * Resolve (and optionally init) the Bun map host directory under
 *   $TMPDIR/<repo-slug>/maps/<name>/
 *
 *   bun map-dir.ts <name>              # print path only
 *   bun map-dir.ts <name> --init       # wipe, copy app/, print path
 *   bun map-dir.ts <name> --root /abs  # slug from this repo root
 *
 * Canvas / Cursor hosts do not use this — they live under
 * ~/.cursor/projects/<workspace>/canvases/.
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const skillRoot = resolve(import.meta.dir, "..");
const appSrc = resolve(skillRoot, "app");

function usage(code = 2): never {
  console.error(`Usage:
  bun map-dir.ts <descriptive-name> [--init] [--root <repo-root>]

Prints $TMPDIR/<repo-slug>/maps/<name>/ (stable per project + map name).
With --init: removes that dir, copies $SKILL_DIR/app into it, then prints.
Repo slug = basename of git toplevel (or cwd / --root), slugified.`);
  process.exit(code);
}

function slug(s: string): string {
  const out = s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return out.length > 0 ? out : "project";
}

function repoRoot(explicit?: string): string {
  if (explicit) return resolve(explicit);
  const r = Bun.spawnSync(["git", "rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  if (r.exitCode === 0) {
    const top = r.stdout.toString().trim();
    if (top.length > 0) return top;
  }
  return process.cwd();
}

function parseArgs(argv: string[]): {
  name: string;
  init: boolean;
  root?: string;
} {
  const positional: string[] = [];
  let init = false;
  let root: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--init") {
      init = true;
      continue;
    }
    if (a === "--root") {
      const next = argv[++i];
      if (!next) usage();
      root = next;
      continue;
    }
    if (a === "-h" || a === "--help") usage(0);
    if (a.startsWith("-")) usage();
    positional.push(a);
  }
  if (positional.length !== 1) usage();
  return { name: positional[0]!, init, root };
}

const { name, init, root } = parseArgs(Bun.argv.slice(2));
const tmp = (process.env.TMPDIR || "/tmp").replace(/\/+$/, "");
const mapDir = join(tmp, slug(basename(repoRoot(root))), "maps", slug(name));

if (init) {
  rmSync(mapDir, { recursive: true, force: true });
  mkdirSync(mapDir, { recursive: true });
  cpSync(appSrc, mapDir, { recursive: true });
}

console.log(mapDir);

#!/usr/bin/env bun
/**
 * Re-exec host verify from app/ (React resolution).
 *
 *   bun scripts/verify-host.ts
 *   bun run verify
 */
import { resolve } from "node:path";

const appVerify = resolve(import.meta.dir, "../app/verify-host.ts");
const result = Bun.spawnSync({
  cmd: ["bun", appVerify],
  cwd: resolve(import.meta.dir, "../app"),
  stdout: "inherit",
  stderr: "inherit",
});
process.exit(result.exitCode ?? 1);

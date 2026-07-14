#!/usr/bin/env bun
/**
 * Preferred entrypoint — regenerates FILE_CONTENTS + MAP_PATHS from FILE_MAP.
 *
 *   bun update.ts --file /abs/map.canvas.tsx
 *   bun update.ts --canvas /abs/map.canvas.tsx
 *   bun update.ts --file /abs/map.canvas.tsx --check
 */
const script = Bun.fileURLToPath(new URL("./sync-file-map.ts", import.meta.url));
const proc = Bun.spawnSync(["bun", script, ...Bun.argv.slice(2)], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});
process.exit(proc.exitCode ?? 1);

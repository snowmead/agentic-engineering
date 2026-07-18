# Erasure — TypeScript / JavaScript

Read [`../SKILL.md`](../SKILL.md) first. This file: syntax branches, tactics,
tooling.

---

## A. Erasure tactics

### What counts as a branch

- `if` / `else if` / `else`
- `switch` + each `case` (and a non-exhaustive `default` that papers over missing variants)
- Conditional `? :`
- Control-flow `&&` / `||` used to choose paths (not pure boolean combine for a value)
- Multi-way optional chains that encode stacked decisions

Nesting depth is a smell; the metric is **decision count**. A symptom-shield
`if` added in a "fix" is a failed erasure — re-derive so the branch is not needed.

### How to erase

| Move | What it throws away |
|------|---------------------|
| Discriminated union + exhaustive `switch` | `if` forests over optional fields; illegal combinations |
| Lookup map / strategy table | Repeated same-shape `switch` / `if` ladders |
| Parse once at the boundary | Repeated runtime checks deeper in |
| Shared pure helper | Duplicated conditionals across call sites |
| Reuse an existing module/type | A redundant parallel concept |
| Make illegal states unrepresentable | Runtime branches that only defend bad types |

Prefer type-level erasure: when the compiler proves a case impossible, delete the
runtime branch.

Swap rule, comments, and preserve rules: see SKILL.md. Finish kills of old
exports, `@deprecated` shims, dual named exports, and obsolete specs in the same
change — do not leave `export { newFn as oldFn }` unless the user asked for a
compat window.

### Verify (lossless)

1. Typecheck: `tsc --noEmit` or the repo’s script.
2. Tests for the touched behavior (update or delete obsolete ones — do not skip).
3. Optional reconstruct checklist: 3–5 behaviors the shorter form must still support.

### Before / after

**1. Optional-field bag → discriminated union**

```ts
// before — branches defend illegal states
type Job = { done: boolean; finishedAt?: Date; error?: string };

function label(j: Job): string {
  if (j.done && j.error) return "bad state";
  if (j.done) return `ok ${j.finishedAt?.toISOString() ?? "?"}`;
  if (j.error) return `err ${j.error}`;
  return "pending";
}

// after — type erased the bad combination
type Job =
  | { kind: "pending" }
  | { kind: "ok"; finishedAt: Date }
  | { kind: "err"; error: string };

function label(j: Job): string {
  switch (j.kind) {
    case "pending":
      return "pending";
    case "ok":
      return `ok ${j.finishedAt.toISOString()}`;
    case "err":
      return `err ${j.error}`;
  }
}
```

**2. Dual path after rename (swap rule)**

```ts
// bad — X kept "for compatibility"
export function fetchUser(id: string) { /* new */ }
/** @deprecated */
export const getUser = fetchUser;

// good — X gone; callers updated in the same change
export function fetchUser(id: string) { /* new */ }
```

**3. Parse once at the boundary**

```ts
// before — every consumer re-branches on wire shape
function fee(raw: unknown): number {
  if (typeof raw !== "object" || raw === null) return 0;
  const o = raw as { amount?: unknown; currency?: unknown };
  if (typeof o.amount !== "number") return 0;
  if (o.currency !== "USD") return 0;
  return o.amount;
}

// after
type UsdAmount = { amount: number };
function parseUsd(raw: unknown): UsdAmount | null { /* one validator */ }
function fee(money: UsdAmount): number {
  return money.amount;
}
```

---

## B. Project guardrails

### Detect first

| Signal | Path / clue |
|--------|-------------|
| ESLint | `eslint.config.*`, `.eslintrc*`, `eslint` in `package.json` |
| Biome | `biome.json`, `biome.jsonc`, `@biomejs/biome` |
| Formatter | Prettier config, or Biome `formatter` |
| Dead-code GC | `knip`, `ts-prune`, `eslint-plugin-unused-imports` |
| Typecheck | `tsc`, `tsconfig.json`, existing `typecheck` script |

**Policy:** match the repo. Never install ESLint **and** Biome as dual linters.
Formatter alone is not an erasure gate. Change guardrails only when setup is in
scope (see SKILL.md).

### Starting budgets (override if the repo already set numbers)

| Tool | Rule | Starting default |
|------|------|------------------|
| ESLint | `complexity` | `["error", 15]` |
| ESLint | `max-depth` | `["error", 4]` |
| ESLint | `max-nested-callbacks` | `["error", 3]` |
| ESLint | `@typescript-eslint/switch-exhaustiveness-check` | `error` when type-checked linting is available |
| ESLint | `@typescript-eslint/no-deprecated` (if available) | warn — pressure to finish swaps |
| Biome | `complexity.noExcessiveCognitiveComplexity` | error, `maxAllowedComplexity: 15` |
| knip | unused files / exports / deps | fail CI or local `knip` script |

Secondary only (not the erasure score — decisions beat LOC):

| Tool | Rule | Starting default |
|------|------|------------------|
| ESLint | `max-lines-per-function` | `["warn", { max: 80, skipBlankLines: true, skipComments: true }]` |

Tighten over time. Do not loosen to silence a god-function; erase the function.

### Setup checklist

Only when the user asked for setup/hardening or the task explicitly includes tooling:

1. Detect existing linter, formatter, dead-code tool, and typecheck script.
2. If a linter exists: add complexity budgets only (do not replace the stack).
3. If no linter: pick **one** (Biome if nearby/greenfield; else ESLint + typescript-eslint).
4. Add dead-code GC: prefer [knip](https://github.com/webpro-nl/knip).
5. Wire scripts:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "knip": "knip",
    "erasure:check": "npm run typecheck && npm run lint && npm run knip"
  }
}
```

For Biome, `lint` may be `biome check .`.

6. Do **not** enable rules that punish long names or multi-line clarity.
7. After erasure work, run `erasure:check` (or the repo equivalent).

### Example: ESLint flat config (complexity slice)

```js
// eslint.config.js — erasure-relevant slice only; merge into existing config
export default [
  {
    rules: {
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 3],
      // secondary — not the erasure score:
      "max-lines-per-function": [
        "warn",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // With type-checked typescript-eslint:
  // { rules: { "@typescript-eslint/switch-exhaustiveness-check": "error" } },
];
```

### Example: Biome complexity

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "error",
          "options": { "maxAllowedComplexity": 15 }
        }
      }
    }
  }
}
```

Not on by default in recommended sets — enable it. Default threshold is 15
(`maxAllowedComplexity`, range 1–254).

### Example: knip

```bash
bunx knip --init
# or: npx knip --init
```

Align entry/project config with real entrypoints so public API is not
false-positive "unused."

### Commands after an erasure pass

```bash
npm run typecheck
npm run lint
npm run knip   # if present
npm test       # or targeted suite; drop obsolete tests, do not skip them
```

### Anti-misconfig

| Do not | Why |
|--------|-----|
| Score success by format diff size | Format is not complexity |
| Ban long identifiers | Golf pressure |
| Dual ESLint + Biome | Stacks fight |
| Delete still-valid tests to green CI | Lossless failed; fix design |
| `complexity: 50` "temporarily" forever | Gate becomes theater |
| Leave deprecated re-exports after a rename | Swap rule unfinished |
| Add knip/ESLint unprompted on a feature task | Setup not in scope |

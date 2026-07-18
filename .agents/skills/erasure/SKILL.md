---
name: erasure
description: >
  Standing order: erase while editing — delete replaced things (swap rule),
  compress via abstraction, GC stale comments/docs/dead code. Preserve behavior;
  measure decisions not LOC. Read language pack for tooling. Use for /erasure
  passes or complexity/dead-code work. Never treat minification or golf as erasure.
license: MIT
---

# Erasure

Default agent bias is additive; this skill reverses that while preserving
invariants. A good abstraction expands back into what it discarded.

## Scope

Covers files/symbols the task touches, plus artifacts those edits make obsolete.
Repo-wide sweeps need an explicit scope. In-scope: implement the ask, delete what
it obsoleted, finish any swap, lossless-check. Do not expand scope to hunt
removals. Confusion in touched code: simplify in the same diff if lossless.
Elsewhere: residual debt only.

## When not to erase

- Public API, compat shims, feature flags, generated or vendored paths without
  an explicit prompt — leave alone and report.
- Cannot prove lossless — do not delete.
- Abstraction would add one-off generics/traits/indirection — leave flat.
- User asked to keep the old path — swap rule paused for that item only.
- Minimal/surgical fix — erase swap fallout and stale comments in the same diff;
  do not rewrite adjacent complexity.

## Core rules

1. **Preserve the invariant.** Behavior, facts, decisions, or required API must
   still hold after compression.
2. **Measure decisions, not characters.** Branch / decision count matters. LOC,
   bytes, and formatters are not the score.
3. **Compress via abstraction.** One expansion rule replaces many special cases;
   then delete what became dead. Reuse before inventing.
4. **Lossless check.** Reconstruct, re-answer, re-run tests/typecheck. Restore or
   refine if something important is gone.
5. **No golf.** Minification, name-stripping, or denser syntax without fewer
   decisions is not erasure.

A **branch** is a decision point: `if`, `else if`, `match` / `switch` / `case`,
and language-equivalent splits (see packs). Hiding a branch in a ternary without
fewer decisions is not erasure. A symptom-shield bug-fix `if` adds a branch;
re-derive so it is unnecessary.

## Swap rule

When X becomes Y, fully deleting X is part of the task unless the user asked to
keep it.

| Situation | Bad | Good |
|-----------|-----|------|
| Syntax / API change | Accepts both old and new | Old form gone from impl, tests, docs |
| Bug fix | Special-case `if` shields the symptom | Root cause dies; shield `if` never lands |
| Behavior change | Old tests linger or get skipped | Obsolete tests deleted; rest updated |
| Rename / move | Old name re-exported "just in case" | Old name removed; callers updated |
| Feature flag / dual path | Both paths live forever | Dead path deleted when the switch is done |

## Comments and prose

- No mid-function narration. If the code needs a play-by-play, simplify it.
- Keep only non-local *why*, invariants, hazards, and constraints types/names
  cannot carry.
- No session residue ("as discussed", "Phase 2 will…", "for the agent",
  foreshadowing unshipped work). Document what current code or a real external
  constraint makes true.
- Same-diff hygiene: rewrite or delete stale comments; remove done TODOs with
  the fix.

Same loop for process files (AGENTS.md, MEMORY, wikis, TODOs): compress claims,
delete obsolete sections and closed TODOs, fix orphan links.

## Erasure loop

1. **State the invariant** that must survive.
2. **Inventory load** — duplication, dead branches, dual paths, speculative
   cases, stale comments/docs, concepts already expressible elsewhere.
3. **Compress via abstraction** — one named concept replaces many cases.
4. **Lossless check** — reconstruct Q&A, tests/typecheck, or re-derive the
   decision from the shorter form.
5. **Garbage-collect** — delete what the change made dead. No stubs, no "kept
   for compatibility," no done TODOs.

## Done

- [ ] Invariant holds (tests/typecheck/reconstruct)
- [ ] Replaced X is gone (unless user asked to keep it)
- [ ] Branch / cognitive complexity down or flat with a clearer abstraction
- [ ] Dead matter deleted in scope; no narrating/stale/session comments
- [ ] No golf, minify, dual paths, dual ESLint+Biome, still-valid tests deleted, or silent tooling
- [ ] If setup was in scope: complexity + dead-code gates present and runnable

LOC is not scored.

## Language packs

Read the matching pack before language-specific tactics or tooling. Unsupported
languages: global rules only.

| When working in | Read |
|-----------------|------|
| TypeScript / JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`, TS/JS tooling) | [`references/typescript.md`](references/typescript.md) |
| Rust (`.rs`, `Cargo.toml`, `Cargo.lock`) | [`references/rust.md`](references/rust.md) |
| Any other language | Global rules only |

Each pack: **A.** tactics — **B.** project guardrails.

## Tooling and delegation

**Setup.** Change guardrails only when the user asked for setup/hardening or the
task explicitly includes tooling. If gates are missing on a normal code task,
note the gap; do not add knip/ESLint/Clippy unprompted. If guardrails exist, use
them — do not silently replace the stack. Formatter-only is not enough.

**Dedicated pass.** Prefer the **erasure** Task subagent (`subagent_type: erasure`)
when registered: scoped prompt with paths/subsystem, invariant, hard constraints.
If unavailable, apply this skill inline; do not invent a stub. Subagent applies
only clear erasures; uncertain items are reported. Small in-thread edits still
follow this skill.

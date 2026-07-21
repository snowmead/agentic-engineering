---
name: erasure
description: >
  Standing order while editing: finish deleting what you replaced (swap rule)
  and GC dead comments, docs, and code that edit made obsolete. Preserve
  behavior. Not golf or minification.
license: MIT
---

# Erasure

Agents default to adding. This skill is the opposite discipline on every edit:
when X becomes Y, finish deleting X and garbage-collect what that change made
dead—without breaking behavior.

**Scope.** Files and symbols the task touches, plus artifacts those edits make
obsolete. Do not expand the task to hunt removals. Repo-wide sweeps need an
explicit ask.

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
- No session residue ("as discussed", "Phase 2 will…", "for the agent").
- Same-diff hygiene: rewrite or delete stale comments; remove done TODOs with
  the fix.

If the edit touches process files (AGENTS.md, MEMORY, wikis, TODOs): delete
obsolete sections and closed TODOs; fix orphan links.

## Do not

- Touch public API, compat shims, feature flags, or generated/vendored paths
  without an explicit prompt — leave alone and report.
- Delete when you cannot prove the change is lossless.
- Keep the old path when the user asked to keep it (swap paused for that item).
- Rewrite adjacent complexity on a minimal/surgical fix — only swap fallout and
  stale comments in the same diff.
- Golf: minification, name-stripping, or denser syntax without fewer decisions.
- Add knip/ESLint/Clippy or other guardrails unprompted.

Verify with the repo’s tests/typecheck (or reconstruct) that behavior still holds.

## Done

- [ ] Invariant holds (tests/typecheck/reconstruct)
- [ ] Replaced X is gone (unless user asked to keep it)
- [ ] Fallout GC’d in scope — dead code, dual paths, stale/session comments
- [ ] No golf

## Language packs and dedicated passes

For TypeScript/JavaScript or Rust tactics (how to finish a swap in that
language), read the matching pack when working there. Other languages: this file
only.

| When working in | Read |
|-----------------|------|
| TypeScript / JavaScript | [`references/typescript.md`](references/typescript.md) |
| Rust | [`references/rust.md`](references/rust.md) |

For an explicit scoped cleanup pass, prefer the **erasure** Task subagent
(`subagent_type: erasure`) when registered; otherwise apply this skill inline.
Ordinary edits still follow the swap rule above.

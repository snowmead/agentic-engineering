---
name: erasure
description: >
  Standing order: half of intelligence is erasure (remove, compress, GC). Apply
  while writing or editing code, comments, docs, notes, memory, refactors, fixes,
  and migrations — prompted or not. Prefer fewer decision branches via better
  abstractions; fully delete replaced things (swap rule); prune stale comments
  and prose. Never treat minification or golf as erasure. Also use for complexity
  budgets (clippy, ESLint, Biome), dead-code GC, or /erasure.
license: MIT
---

# Erasure

This skill amends a training defect. Labs reward **adding** — answers, files,
patches, comments, rules. Almost none of the reward was for **removing**. So the
default reflex is to grow everything under care. Raw capability does not fill a
missing half.

Learning **is** compression. A good abstraction is a blob of information that
lets you throw other information away because it **expands back** into what was
discarded. Intelligence is not only producing knowledge; it is deleting bad or
redundant knowledge so the good remains. Unpruned growth is the symptom. Watch
for it everywhere: code, comments, docs, notes, memory — including places this
file never names.

## Standing order

Erasure claims **half of the cognitive budget**, 24/7, while working on the
user's material — even mid-task, even when the user did not say "simplify."

- **Hunt removals.** Duplicated concepts to unify, dead code to delete, tangled
  logic to simplify, stale comments and docs to cut.
- **Confusion is a signal.** If something surprised you or was hard to follow,
  that is a bad abstraction. Untangle it in the same pass when it is in scope
  (or note it and fix it before you finish if you touched the area).
- **Write the simplest shape.** Before introducing a concept, scan for one that
  already exists and reuse it.
- **A removing diff is at least as valuable as an adding one.** Prefer net
  deletion when behavior holds.

Rules cannot list every failure mode. The defect shows up as anything that only
ever grows. Act on the pattern, not only on named bullets below.

## Doctrine

1. **Preserve the invariant.** Behavior, facts, decisions, or required API must
   still hold after compression.
2. **Measure decisions, not characters.** Branch / decision count and tool
   cognitive complexity matter. LOC and bytes do not, except as a weak shadow of
   decisions removed.
3. **Compress via abstraction.** One expansion rule replaces many special cases.
   Then delete what became dead.
4. **Lossless check.** Reconstruct, re-answer, re-run tests/typecheck. If
   something important is gone, restore it or refine the abstraction.
5. **Tooling so you cannot cheat.** Complexity and dead-code gates measure
   decisions and waste. Formatters are not an erasure metric.

## The swap rule

When a task replaces **X** with **Y** — refactor, fix, syntax change, rename,
migration — **fully deleting X is part of the task**, always.

Keeping the old thing "for compatibility" is **never** desirable unless the user
explicitly requested it.

| Situation | Bad | Good |
|-----------|-----|------|
| Syntax / API change | Parser or API accepts both old and new | Old form gone from implementation, tests, and docs |
| Bug fix | Special-case `if` shields the symptom | Design re-derived; root cause dies; the shield `if` never lands |
| Behavior change | Tests for old behavior linger or get skipped | Obsolete tests deleted; remaining tests updated |
| Rename / move | Old name re-exported "just in case" | Old name removed; callers updated |
| Feature flag / dual path | Both paths live forever | Dead path deleted when the switch is done |

## Comments

Comments are a common failure mode: narration accumulates and nothing is removed.

- **No narrating the code** in the middle of function bodies. If the code needs a
  play-by-play, the code is wrong — simplify it. If you catch yourself narrating,
  delete the comment and fix the code.
- **Keep only what is essential:** non-local *why*, invariants, hazards, and
  constraints that the types and names cannot carry. Not *what* the next line
  does.
- **No session residue.** Never write comments, JSDoc/`///`, or in-repo docs that
  only make sense inside this chat or plan — "as discussed", "per the plan",
  "Phase 2 will…", "temporary until we…", "for the agent", or pointers to
  unshipped work. The reader outside the session has none of that context. Document
  only what is true of the code that exists now (or a concrete external
  constraint: ticket ID, RFC, API contract). If the next step is not in the tree
  yet, omit it; do not foreshadow it in source.
- **Same-diff hygiene.** A refactor that makes a comment stale: delete or rewrite
  it in that diff. A TODO that is done: the marker leaves with the fix. Never
  leave a lying comment.

Aggressive pruning beats polite accumulation. A file clogged with history is a
failed GC.

## Prose, process docs, and memory

AGENTS.md, CLAUDE.md, MEMORY, wikis, TODO lists, and similar artifacts tend only
to grow — rules added when something breaks, never removed when they stop
applying.

| Event | Bad | Good |
|-------|-----|------|
| Server / feature decommissioned | Article or section sits forever | Deleted; every link and reference fixed |
| Memory near cap | Append anyway | GC by importance; promote what lasts to durable docs |
| TODO item closed | Line lingers | Deleted on sight |
| Rule no longer true | Still in the instruction file | Removed or rewritten so the file stays true |

Before finishing **any** task, ask: **what did this change make obsolete — and
did I delete it?**

## Universal loop

Works for prose, plans, configs, data, agent context, and code.

1. **State the invariant** that must survive.
2. **Inventory load** — duplication, dead branches, dual paths after a swap,
   speculative cases, restated claims, stale comments/docs, concepts already
   expressible by something that exists.
3. **Compress via abstraction** — one named concept replaces many cases; reuse
   before inventing.
4. **Lossless check** — reconstruct Q&A, tests/typecheck, or re-derive the
   decision from the shorter form.
5. **Garbage-collect** — delete what the change made dead. No stubs, no "kept
   for compatibility," no done TODOs.

### Non-code complexity proxies

| Domain | What to erase | Proxy |
|--------|---------------|--------|
| Prose / docs | Restatement, hedge stacks, synonym cycling, dead sections | Distinct claims left after compress + reconstruct Q&A |
| Plans / designs | Options that do not change the decision | Open decision points that still need a human |
| Data / schemas | Redundant fields, dual sources of truth | Independent fields a consumer must reconcile |
| Agent context / memory | Raw payloads, repeated reads, low-value notes | Tokens kept after summary; durable facts promoted, rest dropped |
| Process files | Rules that no longer apply, closed TODOs | File still true end-to-end; no orphan links |

## Code metric (all languages)

A **branch** is a decision point: `if`, `else if`, `match` / `switch` / `case`,
and language-equivalent control splits (listed in each language pack).

**Goal:** fewer branches, same behavior, via abstractions — not denser syntax.

Hiding a branch in a ternary, boolean trick, or one-liner without reducing the
decision count is not erasure. A bug-fix `if` that only shields a symptom
**adds** a branch; re-derive the design so the branch is unnecessary.

## Anti-patterns

- Code-golf, minification, uglification
- Shortening identifiers or stripping *essential* invariant comments as the "win"
- Packing branches into denser syntax without fewer decisions
- Deleting tests that still pin required behavior (delete only **obsolete** tests)
- Dual paths after a swap ("support both for now") without an explicit user ask
- Narrating comments mid-function; leaving stale comments or done TODOs
- Session-chat or planned-phase comments ("Phase N", "as discussed", foreshadowing
  unshipped work) that mean nothing outside this conversation
- Treating formatter output or byte count as success
- Dual-installing competing linters (ESLint **and** Biome) in one project

## Language packs (mandatory map)

When the work is in a supported language, **read the matching pack before**
language-specific tactics or tooling changes. Unsupported languages: global
rules only.

| When working in | Read |
|-----------------|------|
| TypeScript / JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`, TS/JS tooling) | [`references/typescript.md`](references/typescript.md) |
| Rust (`.rs`, `Cargo.toml`, `Cargo.lock`) | [`references/rust.md`](references/rust.md) |
| Any other language | Global rules only |

Each pack has two halves:

- **A. Erasure tactics** — branches, abstractions, swap/comment notes, verify
- **B. Project guardrails** — detect stack, complexity budgets, dead-code GC, configs, commands

## Delegation

For a **dedicated** erasure pass (large inventory, mid-feature GC, swap cleanup
after a rename/migration, dead-code sweep), launch the **erasure** Task subagent
(`subagent_type: erasure`) with a scoped prompt: paths or subsystem, invariant,
and any hard constraints (e.g. “public API must stay”).

- The subagent applies only **clear** erasures. Items with open questions are
  left alone and listed in the report for a follow-up pass.
- **Fallback** (skills-CLI / Pi / no plugin agents): apply this skill inline in
  the main agent; do not invent a missing subagent.
- Small in-thread edits still follow the standing order; the subagent is for
  isolated, reportable passes so the main context stays clean.

## Project setup gate

When the task is code in a supported language:

1. **Detect** whether the project already has the pack’s guardrail stack (or an
   equivalent the repo chose).
2. **If the user asked to set up / harden erasure tooling**, or there is **no**
   complexity and dead-code gate, apply that pack’s setup checklist. Minimal,
   additive; match ESLint vs Biome, workspace Clippy vs crate-level.
3. **If guardrails already exist**, use them. Do not silently replace the stack.
4. **Formatter-only is not enough.**

## Close every task

Before you stop:

1. What did this change make **obsolete**?
2. Did I **delete** it (code, tests, comments, docs, flags, dual paths, TODOs)?
3. Does the invariant still hold (tests / typecheck / reconstruct)?
4. Did I leave anything that only grew because I defaulted to adding?

## Done criteria

- [ ] Invariant holds
- [ ] Swap rule: replaced X is gone from implementation, tests, and docs (unless user asked to keep it)
- [ ] Branch / cognitive complexity down or flat with a clearer abstraction
- [ ] Dead matter deleted (code, exports, deps, comments, docs, TODOs, dual paths)
- [ ] No narrating, stale, or session-residue comments in the touched surface
- [ ] No reward hacking (golf, minify, name-stripping as the win)
- [ ] If setup was in scope: complexity + dead-code gates present and runnable

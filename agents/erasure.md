---
name: erasure
description: >-
  Execute a scoped erasure pass: finish the swap rule and GC fallout (dead code,
  dual paths, stale comments/docs) while preserving behavior. Use when the parent
  needs focused cleanup after a rename/migration, dead-path deletion, or similar
  — prefer over ad-hoc edits when the main thread should stay clean. Only apply
  changes that are fully justified; leave uncertain items alone and report them.
model: inherit
---

# Erasure

Run a scoped erasure pass from the parent prompt. Apply the same job as the
erasure skill: finish deleting replaced X, GC what that made dead. Leave anything
with open questions alone and report it.

## Load skill

This file is pass workflow only. Read the **erasure** skill before editing:

1. Resolve the skill directory that contains `erasure/SKILL.md` (plugin install
   or repo `.agents/skills/erasure/`).
2. Read `SKILL.md` fully.
3. If the scope is TypeScript/JavaScript or Rust, read the matching
   `references/typescript.md` or `references/rust.md` for language-specific
   swap/dead-code tactics.

If `subagent_type: erasure` is unavailable in the host, the parent applies the
skill inline — do not invent a stub agent.

## Tools

When oxcode MCP is available and the scope is in-repo code:

1. Call `oxcode_watch` first so the index is current.
2. Then as needed: `oxcode_explore`, `oxcode_search`, `oxcode_callers`,
   `oxcode_callees`, `oxcode_symbol`, `oxcode_files`, `oxcode_status`.

Prefer oxcode over blind grep for callers, dead callees, and blast radius. If
oxcode is unavailable, use project search, reads, and typecheck/clippy. Apply and
verify with local edits and project scripts (typecheck, clippy, tests, knip).

## Workflow

1. **Scope** — Take paths, symbols, subsystem, “recent diff,” or inventory from
   the parent prompt. Do not expand past those paths unless the prompt scopes a
   package or repo sweep. Do not boil the whole repo by default.
2. **Invariant** — State what must survive (behavior, tests, public API unless
   the task is a swap that removes API).
3. **Inventory** — Find unfinished swaps, dual paths, dead code, stale
   comments/docs, obsolete tests.
4. **Partition before any edit:**
   - **Clear to erase** — invariant known, callers/blast radius known, no open
     product or API questions.
   - **Blocked** — ambiguous intent, unclear compat need, unknown external
     consumers, cannot prove lossless, conflicts with the prompt. **Do not edit.**
5. **Apply only the clear set** — follow the skill (swap rule, GC).
6. **Verify** — run the repo’s typecheck / lint / clippy / targeted tests as
   appropriate. Never green by deleting still-valid tests. If a change breaks
   verification, fix or revert it; do not leave a broken tree.
7. **Report** — final message uses the shape below. Always include what was left
   alone and any open questions.

## Certainty gate

- No open questions on a change → may apply it.
- Any open question, missing clarification, or unresolved risk → **leave alone**;
  record under **Left alone** and **Open questions**.
- Do not block the whole pass on one uncertain item. Finish every clear erasure;
  surface the rest.
- Do not invent answers to product questions (compat windows, public API
  retention, production use) in order to delete. Prefer under-erasure over
  guessing.
- Default: do the clear work and report the rest. Do not wait on mid-flight
  answers unless the entire prompt is blocked and the host requires a question.

## Output shape

Return markdown usable without re-running the pass:

```markdown
## Erasure report
- **Scope** — what was in bounds
- **Invariant** — what had to survive
- **Removed** — bullets with paths (finished swaps + GC)
- **Left alone (and why)** — each skip with reason
- **Open questions** — what the parent/user must answer before those items can go
- **Verification** — commands run + pass/fail
- **Residual debt** — short; optional next erasures outside scope
```

## Constraints

- Do not apply a change that still needs clarification.
- Do not spawn nested subagents unless the parent asks.
- Do not expand into drive-by refactors outside the prompt.
- Finish with a complete report in the final message — applied and left alone.

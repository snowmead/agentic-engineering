# Erasure — Rust

Read when writing or refactoring `.rs` / Cargo projects, or setting up Rust
erasure guardrails. Global doctrine (half budget, swap rule, comments, prose GC):
[`../SKILL.md`](../SKILL.md).

---

## A. Erasure tactics

### What counts as a branch

- `if` / `else if` / `else`
- Each `match` arm (including nested pattern splits that each encode a decision)
- `if let` / `while let`
- `matches!` used to choose control flow
- Manual loops that re-implement multi-way decisions iterators would collapse

`?` is usually **good erasure**: it replaces nested `match` on `Option`/`Result`.
Count decisions left on the happy path and error policy, not the question marks.

A symptom-shield `if` in a "bug fix" is failed erasure — re-derive so the branch
is unnecessary.

### How to erase

| Move | What it throws away |
|------|---------------------|
| Enum + exhaustive `match` | Boolean bags and optional-field states |
| Typestate (`Struct<State>` + consuming transitions) | Runtime `if self.state != …` / `InvalidState` |
| `PhantomData` / ZST markers | Dummy fields or conflated handle types |
| Newtype / branded ID / validated wrapper | Cross-type mixups; repeated `is_valid_*` |
| Parse once at the boundary (not stringly APIs) | Scattered string `match` / re-validation |
| Trait or generic bound (minimal `where` clauses) | Repeated per-type `if`/`match` at call sites |
| Sealed trait (private `Sealed` supertrait) | Uncontrolled external impls blocking API shrink |
| Extension trait on foreign types | Wrapper structs and dual method surfaces |
| `impl Into` / `impl AsRef` at the API edge | Dual overloads; caller conversion noise |
| `From` / `TryFrom` (implement `From`, not `Into`) | Conversion / `.map_err` branches through the crate |
| Domain error enum + `?` | Nested `match` on `Option`/`Result` / error ladders |
| Iterator pipeline / `entry` API | Index loops; `contains_key` + insert nests |
| Generics / `impl Trait` / enum dispatch over `dyn` | Heap + vtable when one (or few) types suffice |
| Reuse existing type/module | A redundant parallel concept |

Prefer compile-time erasure: illegal states unrepresentable means whole runtime
branches can go. Prefer monomorphization or enum dispatch over `Box<dyn Trait>`
when a single concrete type (or a closed set) is enough — do not reach for `dyn`
as the default "flexible" shape.

Do not invent trait forests or generic parameters without duplicated call sites
that justify them. Start concrete; generalize on real repetition.

### Abstraction moves

Techniques that delete decisions by moving them into the type system:

- **Enum states** — one variant per mutually exclusive state (with per-variant
  data). Illegal combinations disappear.
- **Typestate** — distinct types (or type params) per protocol state; invalid
  transitions are missing methods, not runtime checks.
- **Phantom / ZST markers** — type-level distinction with no runtime storage.
- **Newtypes** — branded IDs and construction-time validation so callers cannot
  pass the wrong or unvalidated value.
- **Parse, don't validate** — accept raw input only at the edge; inner APIs take
  validated types. Prefer enums/newtypes over magic strings.
- **Traits** — sealed traits for in-crate evolution; extension traits for foreign
  types; associated types on a trait when the output type is part of the
  abstraction (not an open `impl Trait` in the trait itself).
- **Generic bounds** — add bounds only where needed (`where` clauses, conditional
  `impl`s); bound associated types when required (`I::Item: …`).
- **Conversion traits** — `From`/`TryFrom` at boundaries; accept `impl Into` /
  `impl AsRef` so one function replaces several overloads.
- **Errors** — domain error enum + `From` so `?` replaces nested match ladders.
- **Caution** — over-abstraction (unused generics, factory trait stacks) *adds*
  decisions. Erasure compresses; it does not invent flexibility.

### Swap rule (Rust)

When X becomes Y, finish the kill:

| Kill | Examples |
|------|----------|
| Old API | Dual functions, `#[deprecated]` shims left after migration, re-exports of old paths |
| Old modules | `mod old` still compiling "for now" |
| Feature flags | `cfg(feature = "legacy")` paths after the flag is the default forever |
| Tests | Cases that only lock removed behavior — delete, do not `#[ignore]` |
| Docs | `//!` / `///` / README still describing X |
| Allows | `#[allow(dead_code)]` keeping the corpse warm |

Do not keep both spellings of an API unless the user explicitly asked for a
compat window.

### Comments (Rust)

- No mid-function narration (`// get the value`, `// return ok`).
- Prefer names, types, and `///` on public items for real invariants.
- Keep only essential *why* / safety / protocol hazards that signatures cannot
  carry (especially near `unsafe`).
- No session residue: no `///` / `//` that cites the chat, "Phase N", "as
  discussed", or unshipped future work. Document only what the current code
  (or a real external constraint) makes true.
- Stale `///` after a signature change: rewrite or delete in the same diff.
- Done `// TODO` / `// FIXME`: remove with the fix.
- `// Safety:` on `unsafe` blocks stays when it documents the actual invariant.

### Preserve

- Domain-meaningful names
- Public signatures the user still wants (API shrink is an explicit swap)
- Tests that pin **current** required behavior
- Real safety comments on `unsafe`

### Verify (lossless)

1. `cargo check` / `cargo clippy` as the repo uses them.
2. Targeted `cargo test` (update or delete obsolete tests — do not ignore).
3. Optional reconstruct checklist: 3–5 behaviors the shorter form must still support.

### Before / after

**1. Nested Option match → `?`**

```rust
// before
fn pick(map: &HashMap<Id, Item>, id: Id) -> Result<String, Error> {
    match map.get(&id) {
        Some(item) => match item.name.clone() {
            Some(name) if !name.is_empty() => Ok(name),
            Some(_) => Err(Error::Empty),
            None => Err(Error::MissingName),
        },
        None => Err(Error::MissingItem),
    }
}

// after
fn pick(map: &HashMap<Id, Item>, id: Id) -> Result<String, Error> {
    let item = map.get(&id).ok_or(Error::MissingItem)?;
    let name = item.name.clone().ok_or(Error::MissingName)?;
    if name.is_empty() {
        return Err(Error::Empty);
    }
    Ok(name)
}
```

**2. Dual path after rename (swap rule)**

```rust
// bad — X kept
pub fn fetch_user(id: Id) -> Result<User, Error> { /* new */ }
#[deprecated]
pub fn get_user(id: Id) -> Result<User, Error> {
    fetch_user(id)
}

// good — X gone; callers updated in the same change
pub fn fetch_user(id: Id) -> Result<User, Error> { /* new */ }
```

**3. Boolean bag → enum**

```rust
// before
struct Job {
    started: bool,
    failed: bool,
    output: Option<String>,
}

// after
enum Job {
    Idle,
    Running,
    Failed { reason: String },
    Done { output: String },
}
```

**4. Runtime state checks → typestate**

```rust
// before — every method re-checks state
struct Conn {
    ready: bool,
    socket: TcpStream,
}
impl Conn {
    fn send(&mut self, data: &[u8]) -> Result<(), Error> {
        if !self.ready {
            return Err(Error::NotReady);
        }
        self.socket.write_all(data)?;
        Ok(())
    }
}

// after — invalid calls do not type-check
struct Connected;
struct Ready;
struct Conn<State> {
    socket: TcpStream,
    _state: PhantomData<State>,
}
impl Conn<Connected> {
    fn authenticate(self) -> Conn<Ready> { /* … */ }
}
impl Conn<Ready> {
    fn send(&mut self, data: &[u8]) -> Result<(), Error> {
        self.socket.write_all(data)?;
        Ok(())
    }
}
```

---

## B. Project guardrails

### Detect first

| Signal | Path / clue |
|--------|-------------|
| Clippy config | `clippy.toml`, `.clippy.toml` |
| Lint policy | `Cargo.toml` `[lints]`, `[workspace.lints]` |
| Formatter | `rustfmt.toml`, `.rustfmt.toml` |
| Dead deps | `cargo-machete`, `cargo-udeps`, `cargo deny` |
| CI | workflows running `cargo clippy` / `cargo test` |

Prefer **workspace** lint tables so every crate inherits the same erasure bar.

### Lint names and config keys (stable Clippy)

Keys use hyphens in `clippy.toml`; lint names use underscores in Cargo attributes.

| Lint | Notes | `clippy.toml` key | Default threshold |
|------|-------|-------------------|-------------------|
| `cognitive_complexity` | Enable explicitly; was `cyclomatic_complexity` | `cognitive-complexity-threshold` | `25` |
| `excessive_nesting` | Only fires when threshold is set | `excessive-nesting-threshold` | `0` (no limit until set) |
| `too_many_arguments` | Often warn by default | `too-many-arguments-threshold` | `7` |
| `too_many_lines` | Often allow until enabled | `too-many-lines-threshold` | `100` |
| `type_complexity` | Secondary pressure | `type-complexity-threshold` | `250` |

### Starting budgets (override if the repo already set numbers)

| Setting | Starting default | Notes |
|---------|------------------|--------|
| `cognitive-complexity-threshold` | `25` | Tighten over time |
| `excessive-nesting-threshold` | `5` | Must set; `0` disables the limit |
| `too-many-arguments-threshold` | `7` | Group params into types |
| `too-many-lines-threshold` | `100` | Secondary; not the sole metric |
| rustc `unused` | warn or deny | Dead-code GC inside the crate |

### Setup checklist

1. Detect workspace vs single-crate; prefer `[workspace.lints]`.
2. Add or adjust `clippy.toml` thresholds.
3. Enable complexity-related Clippy lints and rustc unused lints.
4. `rustfmt` for consistency only (not a success metric).
5. Optional dead-dep GC (`cargo machete` / `cargo udeps`) if the project already
   leans on cargo tooling — not forced on tiny crates.
6. After erasure work, run clippy + tests.

### Example: `clippy.toml`

```toml
cognitive-complexity-threshold = 25
excessive-nesting-threshold = 5
too-many-arguments-threshold = 7
too-many-lines-threshold = 100
```

### Example: workspace lints in root `Cargo.toml`

```toml
[workspace.lints.rust]
unused = "warn"

[workspace.lints.clippy]
cognitive_complexity = "warn"
excessive_nesting = "warn"
too_many_arguments = "warn"
too_many_lines = "warn"
# Do not enable pedantic as a group; pick lints that cut needless branches.
```

Member crates:

```toml
[lints]
workspace = true
```

Single-crate: same tables under `[lints.rust]` / `[lints.clippy]`.

### Example: `rustfmt.toml` (consistency only)

```toml
edition = "2024"
```

### Commands after an erasure pass

```bash
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
# or: cargo test -p <crate> <test_name>
```

Match softer repo clippy invocations if present, then fix complexity lints the
policy enables.

### Dead-code GC

| Layer | What |
|-------|------|
| rustc `unused` | Unused imports, variables, items |
| Clippy | Needless indirection and dead patterns |
| `cargo machete` / `cargo udeps` | Orphan deps (optional) |

Do not leave permanent `#[allow(dead_code)]` on replaced items. Finish the swap.

### Anti-misconfig

| Do not | Why |
|--------|-----|
| Treat `cargo fmt` diff as success | Format is not complexity |
| Enable name-length golf lints | Rewards meaningless short names |
| Blanket `#[allow(clippy::cognitive_complexity)]` | Erases the gate |
| Blind `clippy::pedantic` | Noise expands code |
| `#[ignore]` obsolete tests | Swap unfinished; delete them |
| `cognitive-complexity-threshold = 100` forever | Gate becomes theater |
| Keep `#[deprecated]` shims after migration | Swap rule unfinished |

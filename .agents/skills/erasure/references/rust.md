# Erasure — Rust

Read [`../SKILL.md`](../SKILL.md) first. This file: language-specific tactics for
finishing swaps and GC’ing dead paths. Section B is optional project guardrails
when setup is in scope — not part of the skill’s job.

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
when a single concrete type (or a closed set) is enough. Do not invent trait
forests or generic parameters without duplicated call sites that justify them.
Start concrete; generalize on real repetition.

Swap rule, comments, and preserve rules: see SKILL.md. Finish kills of dual
functions, `#[deprecated]` shims, legacy `cfg` paths, obsolete tests, and
`#[allow(dead_code)]` on replaced items. Rust-only: keep `// Safety:` on `unsafe`
when it documents a real invariant.

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
Change guardrails only when setup is in scope (see SKILL.md).

### Lint names and config keys (stable Clippy)

Keys use hyphens in `clippy.toml`; lint names use underscores in Cargo attributes.

| Lint | Notes | `clippy.toml` key | Default threshold |
|------|-------|-------------------|-------------------|
| `cognitive_complexity` | Enable explicitly; was `cyclomatic_complexity` | `cognitive-complexity-threshold` | `25` |
| `excessive_nesting` | Only fires when threshold is set | `excessive-nesting-threshold` | `0` (no limit until set) |
| `too_many_arguments` | Often warn by default | `too-many-arguments-threshold` | `7` |
| `too_many_lines` | Secondary; not the sole metric | `too-many-lines-threshold` | `100` |
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

Only when the user asked for setup/hardening or the task explicitly includes tooling:

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
| Add Clippy gates unprompted on a feature task | Setup not in scope |

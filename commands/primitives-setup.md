---
name: primitives-setup
description: Install Bun and oxcode, and run any other setup this plugin needs
---

# Primitives setup

One-shot setup for this plugin. Installs [Bun](https://bun.sh) (for the `map` skill) and the [oxcode](https://github.com/oxgraph/oxcode) binary so the MCP server (`oxcode mcp`) can start. The plugin ships config only and cannot bundle natives — add future prerequisites here as they appear.

## Step 1: Check if Bun is already installed

```bash
bun --version
```

If this prints a version, skip to Step 3.

## Step 2: Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify (open a new shell or refresh `PATH` if needed):

```bash
bun --version
```

### If Bun installation fails

Tell the user to re-run `/primitives-setup` with sandbox mode disabled. Installation needs network and filesystem access that the agent sandbox may block.

Alternatively, they can install manually in their own terminal with the same command above. They may need to add the install directory (often `~/.bun/bin`) to `PATH` in their shell config (e.g. `~/.zshrc`). Ask them to re-run `/primitives-setup` once installed.

## Step 3: Check if oxcode is already installed

```bash
oxcode --version
```

If this prints a version, skip to Step 5.

## Step 4: Install oxcode

Try the prebuilt installer:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/oxgraph/oxcode/releases/latest/download/oxcode-cli-installer.sh | sh
```

If that fails, try cargo:

```bash
cargo binstall oxcode-cli
```

or:

```bash
cargo install oxcode-cli
```

Verify:

```bash
oxcode --version
```

### If oxcode installation fails

Tell the user to re-run `/primitives-setup` with sandbox mode disabled. Installation needs network and filesystem access that the agent sandbox may block.

Alternatively, they can install manually in their own terminal with the same commands above. They may need to add the install directory (often `~/.cargo/bin` or `~/.local/bin`) to `PATH` in their shell config (e.g. `~/.zshrc`). Ask them to re-run `/primitives-setup` once installed.

## Step 5: First use

In a project, call `oxcode_watch` once so the index is built and kept current. Then use the other oxcode tools (`oxcode_explore`, `oxcode_search`, etc.).

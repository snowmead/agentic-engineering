---
name: primitives-setup
description: Install oxcode and run any other setup this plugin needs
---

# Primitives setup

One-shot setup for this plugin. Today that means installing the [oxcode](https://github.com/oxgraph/oxcode) binary so the MCP server (`oxcode mcp`) can start. Add future prerequisites here as they appear — the plugin ships config only and cannot bundle natives.

## Step 1: Check if oxcode is already installed

```bash
oxcode --version
```

If this prints a version, you're done.

## Step 2: Install oxcode

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

### If installation fails

Tell the user to re-run `/primitives-setup` with sandbox mode disabled. Installation needs network and filesystem access that the agent sandbox may block.

Alternatively, they can install manually in their own terminal with the same commands above. They may need to add the install directory (often `~/.cargo/bin` or `~/.local/bin`) to `PATH` in their shell config (e.g. `~/.zshrc`). Ask them to re-run `/primitives-setup` once installed.

## Step 3: First use

In a project, call `oxcode_watch` once so the index is built and kept current. Then use the other oxcode tools (`oxcode_explore`, `oxcode_search`, etc.).

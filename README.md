# pi-openspec

> **OpenSpec deep integration for [pi](https://pi.dev)** — a `pi-package` that wires spec-driven development into your agent.

[![npm version](https://img.shields.io/npm/v/openspec-pi)](https://www.npmjs.com/package/openspec-pi)

This package bundles:

- **`extensions/openspec.ts`** — deep integration extension
- **`skills/openspec-*/`** — official OpenSpec agent skills
- **`prompts/opsx-*.md`** — official OpenSpec slash commands (`/opsx-…`)

## Install

```bash
pi install npm:openspec-pi
# or from git
pi install git:github.com/tobias-weiss-ai-xr/pi-openspec
```

Requires the [OpenSpec CLI](https://github.com/Fission-AI/OpenSpec) ≥ 1.9.0 on your `PATH`:

```bash
npm install -g @fission-ai/openspec
```

Restart pi after installing.

## What you get

### 1. Native `openspec` tool

The agent can query spec-driven development state **during a task**, without slash
commands — `status`, `doctor`, `context`, `list`, `show`, `validate`, `instructions`,
`archive`, `store`, `spec`, `new`. The tool forwards exactly the flags OpenSpec CLI
1.9.0 accepts (positional item names for `show`/`validate`/`archive`, `--specs` for
list, `--store` for store-scoped operations).

### 2. Auto-context injection

At `before_agent_start`, if the working directory (or an ancestor) contains an OpenSpec
root (`openspec/config.yaml`) or is inside a registered OpenSpec store, the `openspec
context` output is appended to the system prompt. The agent always knows the project's
spec context — cached per root and **invalidated when the spec tree changes**.

### 3. `/ospec` command

Run arbitrary OpenSpec CLI commands interactively: `/ospec status`, `/ospec doctor`,
`/ospec context`, `/ospec archive <change> --json`, …

### 4. Official OpenSpec prompts & skills

The exact same slash commands and skills that `openspec init --tools pi` generates in
`.pi/` — now available globally via the package:

| Workflow | Slash command | Skill | What it does |
|----------|---------------|-------|--------------|
| New | `/opsx-new <name>` | `openspec-new-change` | Scaffold a change (`openspec new change`) |
| Propose | `/opsx-propose <name>` | `openspec-propose` | Create a change with proposal/design/specs/tasks |
| Explore | `/opsx-explore` | `openspec-explore` | Think through an idea, compare options, clarify scope |
| Continue | `/opsx-continue <name>` | `openspec-continue-change` | Build the next pending planning artifacts |
| Apply | `/opsx-apply <name>` | `openspec-apply-change` | Implement a change's tasks |
| Update | `/opsx-update <name>` | `openspec-update-change` | Revise a change's artifacts, keep them coherent |
| Sync | `/opsx-sync <name>` | `openspec-sync-specs` | Sync delta specs from a change to main specs |
| Verify | `/opsx-verify` | `openspec-verify-change` | `validate` + `doctor` health sweep (pre-commit) |
| Archive | `/opsx-archive <name>` | `openspec-archive-change` | Native `openspec archive` with pre-flight checks |
| Bulk archive | `/opsx-bulk-archive` | `openspec-bulk-archive-change` | Archive several completed changes at once |
| Onboard | `/opsx-onboard` | `openspec-onboard` | Orient in a repo/store, map changes + specs |
| Feedback | `/opsx-feedback <msg>` | `openspec-feedback` | Submit feedback to OpenSpec maintainers |

## Usage

```bash
# In any repo with an openspec/ root — the agent gets context automatically.
# Otherwise:
/ospec status       # see change progress
/ospec doctor       # check relationship health
/ospec context      # working context
/ospec validate --all --strict --json
```

## Development

The package self-hosts an OpenSpec root (`openspec/`) with a roadmap spec. To keep
skills/prompts in sync with the CLI:

```bash
npm run check          # validate skill/prompt pairing + referenced slash commands
npm run check:full     # check + openspec validate --all (needs CLI on PATH)
```

## License

MIT. Skills and prompts are derived from [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (MIT, © OpenSpec Contributors). The extension is original.

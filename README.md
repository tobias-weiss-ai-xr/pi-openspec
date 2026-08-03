# pi-openspec

> **OpenSpec deep integration for [pi](https://pi.dev)** — a `pi-package` that wires spec-driven development into your agent.

[![npm version](https://img.shields.io/npm/v/openspec-pi)](https://www.npmjs.com/package/openspec-pi)

This package bundles:

- **`extensions/openspec.ts`** — deep integration extension
- **`skills/openspec-*/`** — official OpenSpec agent skills (propose, apply, explore, update, sync, archive)
- **`prompts/opsx-*.md`** — official OpenSpec slash commands (`/opsx-propose`, `/opsx-apply`, …)

## Install

```bash
pi install npm:openspec-pi
# or from git
pi install git:github.com/tobias-weiss-ai-xr/pi-openspec
```

Requires the [OpenSpec CLI](https://github.com/Fission-AI/OpenSpec) on your `PATH`:

```bash
npm install -g @fission-ai/openspec
```

Restart pi after installing.

## What you get

### 1. Native `openspec` tool

The agent can query spec-driven development state **during a task**, without slash
commands — `status`, `doctor`, `context`, `list`, `show`, `validate`.

### 2. Auto-context injection

At `before_agent_start`, if the working directory (or an ancestor) contains an OpenSpec
root (`openspec/config.yaml`) or is inside a registered OpenSpec store, the `openspec
context` output is appended to the system prompt. The agent always knows the project's
spec context — cached per root so there's no per-turn CLI overhead.

### 3. `/ospec` command

Run arbitrary OpenSpec CLI commands interactively: `/ospec status`, `/ospec doctor`, `/ospec context`, …

### 4. Official OpenSpec prompts & skills

The exact same slash commands (`opsx-propose`, `opsx-apply`, …) and skills that
`openspec init --tools pi` generates in `.pi/` — now available globally via the package:

- `/opsx-propose` — create a change with proposal/design/tasks
- `/opsx-apply` — implement a change's tasks
- `/opsx-explore` — explore the spec repository
- `/opsx-update` — update a change's artifacts
- `/opsx-sync` — sync specs to code
- `/opsx-archive` — archive completed changes

## Usage

```bash
# In any repo with an openspec/ root — the agent gets context automatically.
# Otherwise:
/ospec status       # see change progress
/ospec doctor       # check relationship health
/ospec context      # working context
```

## License

MIT. Skills and prompts are derived from [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (MIT, © OpenSpec Contributors). The extension is original.

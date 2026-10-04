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

Requires the [OpenSpec CLI](https://github.com/Fission-AI/OpenSpec) ≥ 1.14.0 on your `PATH`:

```bash
npm install -g @fission-ai/openspec
```

Restart pi after installing.

## What you get

### 1. Native `openspec` tool

The agent can query spec-driven development state **during a task**, without slash
commands — `status`, `doctor`, `context`, `list`, `show`, `validate`, `instructions`,
`archive`, `store`, `spec`, `new`. The tool forwards exactly the flags OpenSpec CLI
1.14.0 accepts (positional item names for `show`/`validate`/`archive`, `--specs` for
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
`.pi/` — now available globally via the package. Synced to **OpenSpec CLI 1.14.0**
(all 12 workflow profiles: `new`, `propose`, `explore`, `continue`, `apply`, `ff`,
`update`, `sync`, `verify`, `archive`, `bulk-archive`, `onboard`):

| Workflow | Slash command | Skill | What it does |
|----------|---------------|-------|--------------|
| New | `/opsx-new <name>` | `openspec-new-change` | Scaffold a change (`openspec new change`) |
| Propose | `/opsx-propose <name>` | `openspec-propose` | Create a change with proposal/design/specs/tasks |
| Explore | `/opsx-explore` | `openspec-explore` | Think through an idea, compare options, clarify scope |
| Continue | `/opsx-continue <name>` | `openspec-continue-change` | Build the next pending planning artifacts |
| Apply | `/opsx-apply <name>` | `openspec-apply-change` | Implement a change's tasks |
| Fast-forward | `/opsx-ff <name>` | `openspec-ff-change` | Create all artifacts needed for implementation in one go |
| Update | `/opsx-update <name>` | `openspec-update-change` | Revise a change's artifacts, keep them coherent |
| Sync | `/opsx-sync <name>` | `openspec-sync-specs` | Sync delta specs from a change to main specs |
| Verify | `/opsx-verify` | `openspec-verify-change` | `validate` + `doctor` health sweep (pre-commit) |
| Archive | `/opsx-archive <name>` | `openspec-archive-change` | Native `openspec archive` with pre-flight checks |
| Bulk archive | `/opsx-bulk-archive` | `openspec-bulk-archive-change` | Archive several completed changes at once |
| Onboard | `/opsx-onboard` | `openspec-onboard` | Orient in a repo/store, map changes + specs |

> Feedback to the OpenSpec maintainers is a plain CLI command now (no longer a
> workflow skill): `/ospec feedback <message>`.

## Usage

```bash
# In any repo with an openspec/ root — the agent gets context automatically.
# Otherwise:
/ospec status       # see change progress
/ospec doctor       # check relationship health
/ospec context      # working context
/ospec validate --all --strict --json

### Registered stores

For a change that lives in a registered standalone store (not the local `openspec/`
root), pass the store id explicitly — to the tool, the command, or the skills:

```bash
openspec store list --json   # discover registered store ids
/ospec status --store <id>
/ospec list --json --store <id>
```

When running inside a registered store's root, the agent auto-discovers it and
injects its `openspec context` even without a local `openspec/` directory.

## Troubleshooting

- **`openspec: command not found`** — the CLI ≥ 1.14.0 is required on `PATH`:
  `npm install -g @fission-ai/openspec`. Skills declare it in their `compatibility`
  frontmatter, and the tool surfaces its stderr as `Error: …`.
- **Stale spec context** — the injected context is cached per root and refreshes
  when the spec tree changes (config.yaml mtime + changes directory). If it looks
  stale after an explicit edit, run `/ospec context` to force a refresh.
- **Tool says `Unsupported command`** — the curated tool covers status/doctor/context/
  list/show/validate/instructions/archive/store/spec/new. For anything else (e.g.
  `openspec feedback`) use `/ospec <command>` passthrough.
- **No `/opsx-*` commands after install** — restart pi; slash commands and skills
  are loaded at agent start.

## Uninstall

```bash
pi uninstall openspec-pi
```

## Development

The package self-hosts an OpenSpec root (`openspec/`) with a roadmap spec. To keep
skills/prompts in sync with the CLI:

```bash
npm run check          # validate skill/prompt pairing + referenced slash commands + manifest/README consistency
npm run check:ext      # JIT-load the extension with a stub API and exercise tool/command paths (needs a pi install)
npm run check:full     # check + openspec validate --all (needs CLI on PATH)
```

`npm run check` also runs automatically as a `prepack` gate before `npm pack` /
`npm publish`, and both jobs run in CI (`check.yml`): a hygiene job and a
`check:full` job that installs the OpenSpec CLI.

Assets (e.g. the gallery image `assets/pi-openspec.png`) are checked to exist on
disk and are included in the published tarball.

## License

MIT. Skills and prompts are derived from [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (MIT, © OpenSpec Contributors). The extension is original.

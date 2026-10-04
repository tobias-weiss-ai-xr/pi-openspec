# Roadmap

## Purpose

Bounded, prioritized direction for `pi-openspec` (npm `openspec-pi`): keep the
package in lock-step with the OpenSpec CLI, keep the shipped skills/prompts
coherent, harden the extension against stale state, and dogfood OpenSpec for our
own planning.

## Requirements

### Requirement: CLI 1.14.0 parity

The shipped skills, prompts, and extension MUST target the OpenSpec CLI 1.14.0
surface: `openspec new change`, `status --change --json`, `instructions
<artifact> --change --json`, `archive <change> --json` (native), `store list
--json`, `doctor`, `context`, `list --specs`, positional `show`/`validate`,
and the 12 workflow profiles (`new`, `propose`, `explore`, `continue`, `apply`,
`ff`, `update`, `sync`, `verify`, `archive`, `bulk-archive`, `onboard`).
`feedback` is a plain CLI command (`openspec feedback <msg>`), not a workflow
skill, and is reachable via `/ospec feedback` passthrough.

#### Scenario: Archive uses the native command
- GIVEN a completed change
- WHEN the agent archives it
- THEN it runs `openspec archive <change> --yes --json` instead of hand-rolling a directory move

#### Scenario: Skills match the upstream tool output
- GIVEN a sync against a newer `openspec init --tools pi` output
- WHEN the packaged skills/prompts diverge from upstream
- THEN they are regenerated to match, including any new workflow profiles (e.g. `ff`) and removal of retired ones (e.g. `feedback`)

### Requirement: Extension reliability

The `openspec` extension MUST forward CLI-accurate flags and MUST NOT serve stale
auto-context.

#### Scenario: list --specs
- GIVEN the agent requests `list` with specs
- WHEN the tool is invoked
- THEN it passes the boolean `--specs` flag (the CLI rejects a value-bearing `--spec`)

#### Scenario: show and validate are positional
- GIVEN a spec or change id
- WHEN the agent calls `show` or `validate`
- THEN the id is passed positionally, optionally disambiguated with `--type`
  (the CLI rejects `--change` on these commands)

#### Scenario: Auto-context invalidation
- GIVEN a long session in an OpenSpec root
- WHEN the spec tree changes (config.yaml or changes/ mtimes change)
- THEN the injected `openspec context` cache is recomputed, not served stale

### Requirement: Packaging and CI hygiene

The package MUST verify its distributed skill/prompt set stays coherent.

#### Scenario: Hygiene check
- GIVEN a change to `skills/`, `prompts/`, `assets/`, `README.md`, or `package.json`
- WHEN CI runs `npm run check`
- THEN every skill has a matching prompt, required frontmatter, no dangling
  `/opsx-*` references, manifest `files[]`/`pi.image` entries exist on disk, and
  every shipped prompt is documented in the README

#### Scenario: Self-hosted roadmap
- GIVEN the repository root
- WHEN an agent works in it
- THEN `openspec context` and the `roadmap` spec describe the priorities below

## Priorities

- **P0 — CLI parity & packaging (done 0.2.1)**: synced skills/prompts to CLI
  1.14.0 (all 12 workflow profiles), `ff` added, `feedback` retired to
  `/ospec` passthrough, gallery asset shipped, prepack + CI gates, extended
  hygiene check (manifest/README/assets), fingerprint-based context cache.
- **P1 — Dogfooding**: run the next roadmap items as real OpenSpec changes in this
  repo (apply/archive them through the shipped workflows).
- **P2 — Deep extension coverage**: surface `openspec status --change` details as
  structured tool output; consider a dedicated `openspec-changes` tool shape.
- **P3 — Multi-store ergonomics**: make `--store` discovery smoother in the
  before_agent_start path; surface registered stores in context.
- **P4 — Community alignment**: re-sync whenever `openspec init --tools pi`
  output changes upstream; add an upstream-diff notice mechanism (last sync:
  1.14.0).

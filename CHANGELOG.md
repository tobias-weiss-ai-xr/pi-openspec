# Changelog

All notable changes to `openspec-pi`.

## [0.2.1] - 2025-10-04

### Synced to OpenSpec CLI 1.14.0

- Regenerated all shipped skills/prompts from `openspec init --tools pi` (1.14.0);
  every workflow file had drifted since the 1.9.0 sync.
- **Added** `openspec-ff-change` / `opsx-ff` — the new 1.14 fast-forward workflow
  (create all artifacts needed for implementation in one go).
- **Removed** `openspec-feedback` / `opsx-feedback` — feedback is no longer a
  workflow profile skill in 1.14; use `/ospec feedback <message>` passthrough.
- README requires OpenSpec CLI ≥ 1.14.0 and documents store usage.

### Packaging

- **Fixed** `pi.image` pointing at a nonexistent `assets/pi-openspec.png`; shipped
  a generated gallery asset (`assets/` now in the tarball).
- `scripts/check.mjs` extended: verifies `files[]` entries and `pi.image` asset
  exist on disk and every `/opsx-*` prompt is documented in the README.
- Added `prepack` gate (`npm run check` runs before `npm pack`/`npm publish`),
  a `specs` CI job (installs the OpenSpec CLI, runs `check:full`, and
  `scripts/smoke-ext.mjs` JIT-loads the extension), and a hygiene gate in the
  publish workflow.
- `publish.yml` now publishes with `--provenance` (signed builds).
- CI triggers broadened to `assets/`, `README.md`, and workflow files.

## [0.2.0] - 2025-09

- Sync to OpenSpec CLI 1.9.0 skills/prompts.
- Native `openspec` tool, auto-context injection with fingerprint cache,
  `/ospec` command, extension flag fixes, hygiene check + CI.

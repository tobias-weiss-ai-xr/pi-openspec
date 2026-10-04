# Developing

`openspec-pi` ships the exact skills/prompts that `openspec init --tools pi`
generates, plus a small TypeScript extension. Keep them in lock-step with the
OpenSpec CLI (roadmap: *CLI parity*).

## Prereqs

- Node 20+ and an [`openspec`](https://github.com/Fission-AI/OpenSpec) CLI on
  `PATH` (for `check:full` and the sync procedure).
- A pi install (for `check:ext`, which JIT-loads the extension through pi's
  bundled jiti).

## Checks

```bash
npm run check          # skill/prompt pairing + frontmatter + dangling /opsx-* + manifest/README/assets
npm run check:ext      # smoke-test the extension (stub API: registration, argv, context injection)
npm run check:full     # check + openspec validate --all --strict (validates the self-hosted roadmap)
npm pack --dry-run     # eyeball what ships
```

The `prepack` script runs `npm run check` automatically before `npm pack` /
`npm publish`.

## Syncing skills/prompts to a newer OpenSpec CLI

The canonical sources are the CLI's own skill/command templates. When
`openspec init --tools pi` output changes upstream:

1. **Pick up all 12 workflow profiles** — the default `core` profile only emits
   6. Point the global config at every workflow, then generate into a scratch
   dir:

   ```bash
   openspec config set profile custom
   openspec config set workflows '["propose","explore","new","continue","apply","update","ff","sync","archive","bulk-archive","verify","onboard"]'
   rm -rf /tmp/os_sync && mkdir -p /tmp/os_sync && cd /tmp/os_sync
   openspec init --tools pi
   ```

   (`openspec config list` confirms which workflows are active. The workflow
   list lives in the CLI at `dist/core/profiles.d.ts` -> `ALL_WORKFLOWS`.)

2. **Diff against the shipped set** and copy every changed file over:

   ```bash
   for p in /tmp/os_sync/.pi/prompts/opsx-*.md; do cp "$p" <repo>/prompts/; done
   for d in /tmp/os_sync/.pi/skills/*/; do mkdir -p <repo>/skills/$(basename $d); cp "$d/SKILL.md" <repo>/skills/$(basename $d)/; done
   ```

3. **Add newly introduced workflow dirs, delete retired ones** (e.g. 1.14 added
   `openspec-ff-change`/`opsx-ff`; retired `openspec-feedback`/`opsx-feedback`
   — feedback became a plain `openspec feedback` command).

4. **Keep the metadata in sync**:
   - `scripts/check.mjs` → `PROMPT_FOR_SKILL` mapping (one entry per skill).
   - `README.md` → workflow table (`/opsx-<x>` column must name every shipped
     prompt; `npm run check` enforces this).
   - `openspec/specs/roadmap/spec.md` → parity requirement version + priorities.
   - CHANGELOG.md entry.

5. **Verify**: `npm run check && npm run check:full`.

## Checking the extension without a full pi session

`npm run check:ext` JIT-loads `extensions/openspec.ts` via a stub API and asserts
tool/command registration, correct CLI argv for curated commands, and context
injection behavior. It locates pi's bundled runtime deps via `PI_NODE_MODULES`
(falls back to the default Windows pi install).

## Releasing

Publishing is tag-driven (`.github/workflows/publish.yml`):

- `npm run check` runs as the publish gate; `npm publish --provenance` signs the
  build with GitHub-attested provenance.
- Create `v<version>` tags for released versions; keep `package.json` version in
  step with the tag.
- After release, refresh local pi installs (`pi install` re-pull) so sessions
  pick up the new skills (skills load at agent start).

---
name: openspec-continue-change
description: Continue work on an OpenSpec change by creating the next pending planning artifacts. Use when a change is scaffolded but has incomplete artifacts (e.g., after /opsx-new or a paused propose), to advance the artifact frontier until apply-ready. Never writes implementation code.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Advance a change to apply-ready by creating the pending planning artifacts.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.
   Show only active changes with incomplete planning (not fully apply-ready).

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Resolve current state**

   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON:
   - `artifacts`: each artifact's `id`, `status` (`ready`/`blocked`/`done`), and `requires` (dependency artifact ids)
   - `applyRequires`: artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`: path and scope context
   - The artifact build order is dependency-driven — artifacts whose `requires` are satisfied become `ready`

   If every artifact in `applyRequires` has `status: "done"`, planning is complete:
   - Report it and suggest `/opsx-apply` to implement, or `/opsx-update` to revise.

3. **Create the next `ready` artifact(s)**

   For each artifact that is `ready` (dependencies satisfied), in build order:

   a. Get instructions:
      ```bash
      openspec instructions <artifact-id> --change "<name>" --json
      ```
      The instructions JSON includes:
      - `context`, `rules` — constraints for you; do NOT copy into the file
      - `instruction` — artifact-specific guidance
      - `template` — the structure for the output file
      - `resolvedOutputPath` — concrete path (for glob artifacts like `specs/**/*.md`, write files under it as the schema directs; do NOT write to the glob literally)
      - `dependencies` — completed artifacts to read for context
      - `unlocks` — artifacts this artifact unlocks

   b. Read completed dependency files for context.
   c. Write the artifact file following `template`, applying `context`/`rules` as constraints only.
   d. If the artifact needs multiple files (e.g., a delta spec per affected capability), create each per the `instruction`.

4. **Repeat until apply-ready or blocked**

   After each artifact, re-run `openspec status --change "<name>" --json`.
   - If new artifacts became `ready`, continue.
   - If everything in `applyRequires` is `done` → planning complete.
   - If a `blocked` artifact is blocking progress and no other `ready` artifact exists → stop and report what's missing (the dependency graph explains why).

5. **Show the result**

   - Which artifacts were created
   - Whether the change is now apply-ready
   - Next step: `/opsx-apply "<name>"` to implement, or `/opsx-update` to revise

**Example Output**

```
## Planning Advanced: add-user-auth (schema: spec-driven)

Created:
- proposal.md ✓ (unlocks: specs, design)
- specs/proposal.md ✓
- design.md ✓ (unlocks: tasks)
- tasks.md ✓

Planning complete — apply-ready. Run `/opsx-apply add-user-auth`.
```

**Guardrails**
- Planning artifacts only — NEVER write implementation code
- Let the CLI's artifact graph drive the order — create only `ready` artifacts whose dependencies are satisfied
- Read dependency artifacts before writing dependent ones
- Apply `context`/`rules` as constraints — never copy them into the file
- Re-check status after each artifact; stop when apply-ready or genuinely blocked
- The planning frontier advance is this skill's job; revision of existing artifacts is `/opsx-update`'s job

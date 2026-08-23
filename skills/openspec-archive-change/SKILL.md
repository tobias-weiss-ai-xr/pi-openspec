---
name: openspec-archive-change
description: Archive a completed change using the native OpenSpec CLI archive command. Use when the user wants to finalize and archive a change after implementation is complete. Pre-flight checks warn about incomplete artifacts or tasks; spec syncing is handled by the CLI unless --skip-specs is chosen.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Archive a completed change using the native `openspec archive` command.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Pre-flight: artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display a warning listing the incomplete artifacts
   - Use **AskUserQuestion tool** to confirm the user still wants to proceed
   - Proceed only if the user confirms

3. **Pre-flight: task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display a warning with the count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm the user still wants to proceed
   - Proceed only if the user confirms

   **If no tasks file exists:** Proceed without a task-related warning.

4. **Decide on spec syncing**

   Use `artifactPaths.specs.existingOutputPaths` from the status JSON to check for delta specs.

   - **No delta specs** (doc-only / infra change): the CLI has nothing to sync; proceed without flags.
   - **Delta specs exist AND the user wants main specs updated**: the CLI syncs them automatically during archive — no special flag.
   - **Delta specs exist but the user wants to keep main specs untouched** (e.g., archived after a manual sync, or infra/doc-only): pass `--skip-specs`.

   Only pass `--skip-specs` when the user explicitly chooses it; the default is to let the CLI sync.

5. **Perform the archive (native)**

   ```bash
   openspec archive "<name>" --yes --json
   ```

   Add flags as decided:
   - `--skip-specs` → skip the spec update step
   - `--no-validate` → skip validation (only if the user insists after a warning; the CLI asks for confirmation itself)

   Parse the JSON result:
   - `archive.change` — change name
   - `archive.archivedAs` — target name (`YYYY-MM-DD-<name>`)
   - `archive.path` — archive location
   - `archive.specsUpdated` — whether main specs were updated by the CLI
   - `root` — root the archive ran against

6. **Verify and display summary**

   If the user wants belt-and-braces verification, run:
   ```bash
   openspec validate --archived
   ```

   Show the archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location (from `archive.path`)
   - Whether specs were synced (`specsUpdated`)
   - Any warnings (incomplete artifacts/tasks) and whether the user chose `--skip-specs`

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** <archive.path>
**Specs:** ✓ Synced to main specs (or "Not synced (--skip-specs)" / "No delta specs")
**Validated:** ✓ `openspec validate --archived` passed
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** <archive.path>
**Specs:** ✓ Synced to main specs

**Warnings:**
- Archived with 2 incomplete artifacts (user confirmed)
- Archived with 3 incomplete tasks (user confirmed)
```

**Guardrails**
- Always prompt for change selection if not provided
- Use the native `openspec archive` command — do NOT hand-roll a `mkdir` + `mv`
- Use artifact graph (`openspec status --json`) for completion checking
- Don't block archive on warnings — just inform and confirm
- Only pass `--skip-specs` when the user explicitly chooses to skip spec updates
- Report `specsUpdated` from the CLI JSON rather than guessing
- Optionally confirm with `openspec validate --archived`

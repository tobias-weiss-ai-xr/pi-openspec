---
name: openspec-bulk-archive-change
description: Archive multiple completed OpenSpec changes at once using the native archive command. Use when the user wants to clean up several finished changes in one go. Runs pre-flight checks, archives each eligible change, and reports per-change results.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Archive several completed changes in one pass with the native `openspec archive` command.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally a list of change names. If omitted, list all active changes and let the user pick the ones to archive.

**Steps**

1. **Enumerate the candidates**

   ```bash
   openspec list --json
   ```
   Show active changes with their schema. Do NOT auto-select — present the list and let the user pick which ones to archive (e.g., "all completed", or specific names).

   If the user names changes explicitly, use those.

2. **Per-change pre-flight**

   For each candidate, run:
   ```bash
   openspec status --change "<name>" --json
   ```
   Collect, for the summary:
   - `schemaName`
   - artifacts not `done`
   - incomplete tasks (read the tasks file; count `- [ ]` vs `- [x]`)
   - whether delta specs exist (`artifactPaths.specs.existingOutputPaths` non-empty)

   Mark each change as:
   - **clean** — artifacts done, no incomplete tasks
   - **warn** — incomplete artifacts/tasks (need the user's go-ahead)

3. **Confirm scope with the user**

   Show the full table (change, schema, artifacts, tasks, delta-specs) and ask:
   - Archive the **clean** ones now?
   - Also archive the **warn** ones (with warnings)?
   - Skip any?

   Ask once for the set — do not re-confirm per change unless a new warning appears mid-run.

4. **Archive each change (native)**

   For each accepted change:
   ```bash
   openspec archive "<name>" --yes --json
   ```
   Pass `--skip-specs` only for changes the user wants archived without spec syncing (infra/doc-only), as decided per change.

   Collect `archive.archivedAs` and `archive.specsUpdated` per change.

5. **Summarize**

   Report per change:
   - archived name + path
   - whether specs were synced
   - any warnings accepted

**Example Output**

```
## Bulk Archive Complete

✓ add-user-auth        → 2026-08-23-add-user-auth (specs synced)
✓ fix-login-flow       → 2026-08-23-fix-login-flow (specs synced)
⚠ legacy-pilot-doc     → 2026-08-23-legacy-pilot-doc (--skip-specs, 1 incomplete task accepted)

3 changes archived.
```

**Guardrails**
- Use the native `openspec archive` command per change — no manual `mv`
- Never auto-select changes; always confirm the set with the user first
- Aggregate the pre-flight findings into one confirmation, not a per-change interrogation
- Per-change `--skip-specs` only when explicitly chosen
- Report each change's `archivedAs`/`specsUpdated` from the CLI JSON

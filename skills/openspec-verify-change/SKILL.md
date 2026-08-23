---
name: openspec-verify-change
description: Verify OpenSpec repository health and change validity using validate + doctor. Use before committing, before merging, after an archive, or whenever the user wants to check that changes and specs are consistent. Reports failures with actionable messages.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Verify OpenSpec repo health and validity with `openspec validate` and `openspec doctor`.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optional scope (all / changes / specs / archived / a single change or spec id).

**Steps**

1. **Validate everything**

   By default run the full sweep:
   ```bash
   openspec validate --all --strict --json
   ```
   Follow-up scopes when a failure points somewhere specific:
   ```bash
   openspec validate --changes --json
   openspec validate --specs --json
   openspec validate --archived --json    # archived changes must have all tasks done (pre-commit lint)
   openspec validate "<change-or-spec-id>" --json
   ```

2. **Check relationship health**

   ```bash
   openspec doctor --json
   ```
   Report the root, its healthy flag, and any status entries.

3. **Interpret the results**

   - Parse the `--json` output: item names, pass/fail counts, error lists.
   - Group failures by category (validation errors, archived-task incompleteness, relationship/doctor problems).
   - For each failure, state the item and the fix (e.g., "specs/<cap>/spec.md: Requirement 'X' missing scenario → add a runnable scenario" / "change '<name>' has incomplete tasks → finish tasks or fix the tasks file").

4. **Report and (with user go-ahead) fix**

   - If everything passes: confirm "all green" with the counts.
   - If failures exist: show the grouped report and ask the user whether to fix them now (the fixes themselves follow the normal update/continue flows — do not invent artifacts).

**Example Output**

```
## Verify: all green ✓

validate: 12 changes + 34 specs passed (strict)
archived : 2 archived changes passed task-completion lint
doctor   : root healthy

## Verify: 3 issues ✗

validate --specs: specs/services/notes/index.md
  - Requirement "OIDC auth" missing a Scenario (testability)
validate --archived: change/2026-08-23-old-change
  - tasks.md has 5 open checkboxes
doctor: root healthy ✓
```

**Guardrails**
- Use `--json` and report real counts — do not paraphrase without numbers
- Include `--archived` in pre-commit verification — it catches stale archive TODOs
- Distinguish validation errors from doctor/relationship issues
- Fixing failures goes through the normal artifact workflows; never hack around a validation error
- Failing fast is fine — but always finish the sweep so the user gets the full picture

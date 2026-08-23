---
description: Archive multiple completed OpenSpec changes at once using the native archive command
---

Archive several completed changes in one pass with the native `openspec archive` command.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally a list of change names (e.g., `/opsx-bulk-archive add-auth fix-login`). If omitted, list all and let the user pick.
**Provided arguments**: $@

**Steps**

1. **Enumerate**: `openspec list --json`. Present active changes; let the user pick the set (never auto-select).

2. **Per-change pre-flight**: `openspec status --change "<name>" --json` → schema, artifacts not done, incomplete tasks (read tasks file), delta-specs presence. Label each change `clean` or `warn`.

3. **Confirm scope once**: show the table (change / schema / artifacts / tasks / delta-specs) and ask which to archive, including whether to accept warnings and which need `--skip-specs`.

4. **Archive each**:
   ```bash
   openspec archive "<name>" --yes --json
   ```
   Add `--skip-specs` only for changes chosen that way. Collect `archive.archivedAs` + `archive.specsUpdated`.

5. **Summarize** per change: archived name/path, specs synced?, warnings accepted.

**Example Output**

```
## Bulk Archive Complete

✓ add-user-auth        → 2026-08-23-add-user-auth (specs synced)
✓ fix-login-flow       → 2026-08-23-fix-login-flow (specs synced)
⚠ legacy-pilot-doc     → 2026-08-23-legacy-pilot-doc (--skip-specs, 1 incomplete task accepted)

3 changes archived.
```

**Guardrails**
- Native `openspec archive` per change — no manual `mv`
- Confirm the set once up front; don't interrogate per change
- `--skip-specs` only when explicitly chosen
- Report `archivedAs`/`specsUpdated` from CLI JSON

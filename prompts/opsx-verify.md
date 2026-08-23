---
description: Verify OpenSpec repository health and change validity using validate + doctor
---

Verify OpenSpec repo health and validity with `openspec validate` and `openspec doctor`. Use before committing, before merging, after an archive, or on request.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optional scope (all / changes / specs / archived / a single change or spec id).
**Provided arguments**: $@

**Steps**

1. **Invalidate** — common validators:
   ```bash
   openspec validate --all --strict --json
   openspec validate --archived --json    # archived changes must have all tasks done
   ```

2. **Health**:
   ```bash
   openspec doctor --json
   ```

3. **Report** — parse JSON: per-item pass/fail, grouped by category (validation / archived-task lint / doctor). State the fix for each failure.

4. **Fix with go-ahead** — failures are resolved through the normal update/continue flows, never by hacking around validation.

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
- Use `--json` and report real counts
- Include `--archived` for pre-commit verification
- Distinguish validation vs doctor issues; always finish the sweep

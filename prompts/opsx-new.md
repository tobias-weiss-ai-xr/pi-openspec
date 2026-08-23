---
description: Scaffold a new OpenSpec change with the native CLI
---

Scaffold a new OpenSpec change with `openspec new change`.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: A change name (kebab-case) or a description to derive one (e.g., `/opsx-new add-user-auth` or `/opsx-new "add user authentication"`).
**Provided arguments**: $@

**Steps**

1. **If no clear input, ask** what the user wants to build and derive a kebab-case name.

2. **Check for collisions**: `openspec list --json`. If a change with that name exists, offer `/opsx-continue`, `/opsx-update`, or a new name.

3. **Create the scaffold (native)**:
   ```bash
   openspec new change "<name>"
   ```
   (`openspec new` does NOT take `--store`.)

4. **Route next**: full artifacts → `/opsx-propose "<name>"`; incremental → `/opsx-continue "<name>"`; scaffold only → stop.

5. **Show location**: run `openspec status --change "<name>"` and report the change root / planning home.

**Example Output**

```
## New Change

**Name:** add-user-auth
**Created at:** openspec/changes/add-user-auth/ (schema: spec-driven)

Ready to continue? Run `/opsx-continue add-user-auth` to build the artifacts.
```

**Guardrails**
- Derive/confirm the name before creating; check collisions first
- Use native `openspec new change` — no hand-rolled `mkdir`
- Omit `--store` for `openspec new`
- Route to propose/continue instead of duplicating them

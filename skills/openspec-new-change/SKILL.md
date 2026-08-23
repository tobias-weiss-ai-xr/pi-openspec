---
name: openspec-new-change
description: Scaffold a new OpenSpec change with the native CLI (`openspec new change`). Use when the user wants to start fresh work on a new change, before/without generating all artifacts. Always use before propose or continue when the change does not yet exist.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Scaffold a new OpenSpec change with `openspec new change`.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: A change name (kebab-case) or a description from which to derive one (e.g., "add user authentication" → `add-user-auth`).

**Steps**

1. **If no clear input, ask**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   Derive a kebab-case name from the description.
   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Check the name does not collide**

   ```bash
   openspec list --json
   ```
   If a change with that name already exists, ask whether to continue it (`/opsx-continue`), update it (`/opsx-update`), or pick another name.

3. **Create the change scaffold (native)**

   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change directory in the planning home resolved by the CLI (schema-driven by default). `openspec new` does NOT take `--store`.

4. **Route to the next step**

   - If the user wants the full proposal/design/tasks upfront → suggest `/opsx-propose "<name>"`.
   - If they want to build artifacts incrementally → suggest `/opsx-continue "<name>"`.
   - If they only wanted the scaffold (e.g., they will write files themselves) → stop here.

5. **Show where the change lives**

   Run `openspec status --change "<name>"` and report the change root / planning home from the output.

**Example Output**

```
## New Change

**Name:** add-user-auth
**Created at:** openspec/changes/add-user-auth/ (schema: spec-driven)

Ready to continue? Run `/opsx-continue add-user-auth` to build the artifacts.
```

**Guardrails**
- Always derive or confirm the change name before creating
- Use the native `openspec new change` command — do NOT `mkdir` the change dir by hand
- Check for name collisions first
- `openspec new` does not accept `--store`; omit it even when a store is in play
- Route to propose/continue rather than duplicating their logic

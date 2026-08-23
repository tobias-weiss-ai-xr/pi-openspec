---
description: Continue work on an OpenSpec change by creating the next pending planning artifacts
---

Advance a change to apply-ready by creating the pending planning artifacts. Never writes implementation code.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally a change name (e.g., `/opsx-continue add-user-auth`). If omitted, infer from context or prompt for selection.
**Provided arguments**: $@

**Steps**

1. **Select the change** — `openspec list --json`, then **AskUserQuestion** if ambiguous. Never guess.

2. **Resolve state**:
   ```bash
   openspec status --change "<name>" --json
   ```
   - `artifacts`: id / status (`ready`/`blocked`/`done`) / `requires`
   - `applyRequires`: artifacts needed before implementation
   - Build order is dependency-driven: `ready` = all `requires` done.

   If every `applyRequires` artifact is `done` → planning complete: suggest `/opsx-apply <name>`, or `/opsx-update` to revise.

3. **Create the next `ready` artifact(s)** in build order. For each:
   ```bash
   openspec instructions <artifact-id> --change "<name>" --json
   ```
   - `context`, `rules` are constraints for you — never copy into the file
   - `template` is the structure; write to the concrete `resolvedOutputPath` (for glob artifacts like `specs/**/*.md`, create files per the `instruction`, not the literal glob)
   - Read `dependencies` files for context; note `unlocks`

4. **Repeat** — re-run status after each artifact until apply-ready or blocked. If blocked with no `ready` artifacts, report what's missing (the dependency graph explains why).

5. **Show the result**: artifacts created, apply-ready? Next: `/opsx-apply "<name>"`.

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
- Create only `ready` artifacts (dependencies satisfied), guided by the CLI's artifact graph
- Read dependencies first; apply `context`/`rules` as constraints only
- Re-check status after each artifact; stop when apply-ready or genuinely blocked
- Revision of existing artifacts is `/opsx-update`'s job

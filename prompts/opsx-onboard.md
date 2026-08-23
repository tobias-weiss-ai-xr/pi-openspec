---
description: Orient the agent in an OpenSpec repository or registered store
---

Orient in an OpenSpec repo or store and map its current state.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Steps**

1. **Check CLI**: `openspec --version`. If missing, tell the user to `npm install -g @fission-ai/openspec` and stop.

2. **Resolve root**: `openspec context` (repo-local root) → else `openspec store list --json` (registered store containing cwd → pass `--store <id>`). If neither:
   - want OpenSpec here → `openspec init --tools pi .` (add `--force` to auto-clean legacy files)
   - want a standalone store → `openspec store setup <id>` / `openspec store register <path>`

3. **Refresh instructions (optional)**: `openspec update [path]`.

4. **Map state**:
   ```bash
   openspec context
   openspec list --json
   openspec list --specs --json
   openspec doctor --json
   ```

5. **Offer the natural next step**: no changes → `/opsx-new`/`/opsx-propose`; planning in progress → `/opsx-continue <name>`; apply-ready → `/opsx-apply <name>`.

**Example Output**

```
## OpenSpec orientation — <project>

Root      : <path> (repo-local) [or store: <id>]
CLI       : 1.9.0 ✓
Health    : ✓ doctor healthy

Active changes:
- add-user-auth   (spec-driven)  planning in progress
- fix-login-flow  (spec-driven)  apply-ready

Specs: 34 capabilities, 5 domains
Next: /opsx-apply fix-login-flow or start /opsx-propose <new idea>
```

**Guardrails**
- Never assume `--store` — verify via `openspec store list --json`
- Don't re-init a repo that already has an OpenSpec root unless asked
- `openspec init --tools pi` and pi-openspec ship the same skills/prompts — no conflict

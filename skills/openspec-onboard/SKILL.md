---
name: openspec-onboard
description: Orient the agent in an OpenSpec repository or registered store — verify CLI availability, resolve the root/store, initialize or refresh instruction files, and map the current state (changes, specs, context, health). Use when starting work in a repo that has (or should have) OpenSpec, or when switching to a store.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Orient in an OpenSpec repo or store and map its current state.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Steps**

1. **Check the CLI**

   ```bash
   openspec --version
   ```
   If the CLI is missing, tell the user to install it (`npm install -g @fission-ai/openspec`) and stop.

2. **Resolve the root**

   - If the cwd (or an ancestor) has `openspec/config.yaml` → repo-local root. `openspec context` reports it.
   - If not, check for a registered store containing the cwd:
     ```bash
     openspec store list --json
     ```
     A store match means pass `--store <id>` on the read/write commands.
   - If neither exists:
     - If the user wants OpenSpec in this project → `openspec init --tools pi .` (optionally `--force` to auto-clean legacy files).
     - If they want a standalone store → `openspec store setup <id>` or `openspec store register <path>` (existing local repo).

3. **Refresh instruction files (optional)**

   If the user wants the agent instruction files present in the repo up to date:
   ```bash
   openspec update [path]
   ```

4. **Map the current state**

   ```bash
   openspec context            # working context / root brief
   openspec list --json        # active changes
   openspec list --specs --json
   openspec doctor --json      # relationship health
   ```
   Synthesize a compact orientation:
   - root / store id
   - active changes (name, schema, status)
   - spec count / key capabilities
   - health verdict

5. **Offer the natural next step**

   - No changes → suggest `/opsx-new <name>` or `/opsx-propose <name>`.
   - A change is mid-planning → suggest `/opsx-continue <name>`.
   - A change is apply-ready → suggest `/opsx-apply <name>`.

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
- Never assume `--store` — verify against `openspec store list --json`
- Don't run `openspec init` in a repo that already has an OpenSpec root unless the user wants a re-init
- `openspec init --tools pi` generates the official pi skills/prompts in `.pi/` — the pi-openspec package serves the same ones globally; no conflict
- Keep the orientation compact and actionable

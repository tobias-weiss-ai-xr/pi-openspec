---
description: Submit feedback about OpenSpec to the maintainers via the CLI
---

Submit OpenSpec feedback with the native `openspec feedback` command.

**Input**: A summary message (required) and optional detail. Examples:
- `/opsx-feedback "archive --json lost the spec update summary" --body "CLI 1.9.0, repro: ..."`
- `/opsx-feedback "Please add a --since flag to list"`

**Steps**

1. **Gather**: short summary + detailed body (what happened / expected, `openspec --version`, repro steps). If vague, ask a clarifying question first.

2. **Submit**:
   ```bash
   openspec feedback "<short summary>" --body "<detailed description>"
   ```

3. **Report**: confirm on success (note any reference); on failure show the CLI error and offer the issue tracker (https://github.com/Fission-AI/OpenSpec/issues).

**Guardrails**
- Don't invent a summary — clarify first if needed
- Include the CLI version in the body
- Requires network access to the OpenSpec feedback endpoint

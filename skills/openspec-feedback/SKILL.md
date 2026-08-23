---
name: openspec-feedback
description: Submit feedback about OpenSpec to the maintainers using the native CLI feedback command. Use when the user wants to report a bug, request a feature, or share OpenSpec feedback from the terminal.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI >= 1.9.0.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.9.0"
---

Submit OpenSpec feedback with the native `openspec feedback` command.

**Steps**

1. **Gather the feedback**

   Ask (or extract from the user's message) a short summary message plus an optional detailed body. Include:
   - what happened / what you expected
   - the `openspec --version` output
   - relevant repo/root context
   - reproduction steps (for bugs)

2. **Submit**

   ```bash
   openspec feedback "<short summary>" --body "<detailed description>"
   ```
   Keep the summary concise (it is the subject line); put detail in `--body`.

3. **Report the result**

   - On success: confirm the submission and note any reference returned by the CLI.
   - On failure: show the CLI error and offer to retry or open the issue tracker
     (https://github.com/Fission-AI/OpenSpec/issues).

**Guardrails**
- Do not invent a summary — if the user only gave a vague complaint, ask a clarifying question first
- Include the CLI version in the body — it is essential for diagnosing issues
- `openspec feedback` is a terminal command, not a web form — it may need network access to the OpenSpec feedback endpoint

---
name: design-token-police
description: Scan changed UI files for raw design token violations — text-gray-*, bg-gray-*, border-gray-*, text-white/bg-white hardcoded light-mode assumptions, and arbitrary color bypasses. Reports file:line with canonical TerraFusion token replacement. Proactive companion to the TDC ratchet.
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git status *), Bash(bash .claude/skills/design-token-police/check.sh *)
---

Run design token police on: $ARGUMENTS

Steps:

1. Run the scanner (blank = git diff HEAD changed .tsx files):
   `bash .claude/skills/design-token-police/check.sh "$ARGUMENTS"`

2. For each violation, report:
   ```
   FILE: <path>:LINE
   VIOLATION: "<exact matched class>"
   REPLACE WITH: "<canonical TerraFusion token>"
   REASON: <why this is a violation>
   ```

3. After all violations, write a verdict:
   - **CLEAN** — no violations; TDC ratchet will pass
   - **N VIOLATIONS** — list each; propose in-place replacement

4. For each proposed fix, show the exact line before → after.

Rules:
- Report every instance. Do not collapse multi-line matches.
- If a raw class is inside a conditional expression, flag it — conditionals are not an exemption.
- Low-severity patterns (arbitrary spacing) are informational — do not block PRs on those alone.
- HIGH severity (text-gray-*, bg-white, bg-gray-*) must be fixed before commit.
- Do not edit files. Report and propose only.

Reference: `.claude/skills/design-token-police/banned-classes.txt`

TDC ratchet baseline: **779 violations** (2026-03-22).
Any change that increases this count will fail the pre-commit gate.
Use `/design-token-police` before committing to catch violations early.

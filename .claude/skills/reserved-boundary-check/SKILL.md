---
name: reserved-boundary-check
description: Scan for reserved architectural boundary violations — TerraPilot/TerraCanon/TerraTrace misidentified as suites, suite/OS-feature naming drift, canon/pilot API swap, shell/workbench layer conflation. Protects the skeleton, not the eyebrows.
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git status *), Bash(bash .claude/skills/reserved-boundary-check/check.sh *)
---

Run reserved boundary check on: $ARGUMENTS

Source of truth: `frontend/apps/os-shell/src/config/suiteRegistry.ts`
- `SuiteId` = forge | atlas | dais | dossier | gpt (constitutional suites)
- `OsFeatureId` = pilot | trace | canon (OS-layer features — NOT suites)
- `OsSurfaceId` = workbench (parcel-context surface)

Steps:

1. Run the scanner (blank = diff-only, file/dir = explicit target):
   `bash .claude/skills/reserved-boundary-check/check.sh "$ARGUMENTS"`

2. For each violation, output:
   ```
   RULE: <label>
   FILE: <path>:LINE
   VIOLATION: "<exact matched text>"
   REASON:    <why this is wrong per the constitutional model>
   FIX:       <smallest compliant replacement — actual text>
   ```

3. After all violations, write a verdict:
   - **CLEAN** — no violations, architecture boundary intact
   - **VIOLATIONS FOUND (N)** — list by rule, propose fixes inline

Rules:
- If CLEAN, say so explicitly. Do not hedge.
- Suggest the minimum compliant fix — do not redesign.
- If a violation is in a test file or comment, flag it but mark as LOW SEVERITY.
- Do not edit files. Report and propose only.

Reference: `.claude/skills/reserved-boundary-check/rules.txt`

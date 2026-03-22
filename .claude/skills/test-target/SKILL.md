---
name: test-target
description: Given a changed file or feature name, find and run the smallest relevant vitest test set. Component → unit tests. API/hook → contract tests. Shell surface → integration tests. Skips the full suite unless no narrower target exists.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git status *), Bash(git log *), Bash(npx *), Bash(pnpm *), Bash(bash .claude/skills/test-target/run.sh *)
---

Find and run tests for: $ARGUMENTS

Steps:

1. Determine the target:
   - If $ARGUMENTS is blank → use `git diff --name-only HEAD~1` to find changed files
   - If $ARGUMENTS is a file path → use it directly
   - If $ARGUMENTS is a feature/component name → treat as a search term

2. Run the wrapper script:
   `bash .claude/skills/test-target/run.sh "$ARGUMENTS"`

3. Report:
   - Resolved target files
   - Test files discovered
   - Command executed
   - Pass / fail counts
   - First failing test name + error
   - Suggested fix scope (test-only vs implementation)

Rules:
- Never run the full suite when a narrower target resolves.
- If no test file is found, report that clearly — do not run unrelated tests.
- Run from the repo root; the script handles the `frontend/` prefix.

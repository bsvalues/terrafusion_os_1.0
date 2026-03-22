---
name: preflight
description: Repo sanity sweep before any real change. Reports branch, dirty files, package manager, discovered test/build/type-check commands, config files present, and current failing tests (if any). Stops the agent from coding into fog.
allowed-tools: Read, Grep, Glob, Bash(git branch *), Bash(git status *), Bash(git log *), Bash(git stash list), Bash(ls *), Bash(bash .claude/skills/preflight/run.sh)
---

Run preflight check.

Steps:

1. Run the sweep:
   `bash .claude/skills/preflight/run.sh`

2. Interpret and report in this exact order:

   **BRANCH**: current branch name + last commit hash + message
   **TREE**: clean / dirty (list dirty files if any)
   **STASH**: stash count
   **PACKAGE MANAGER**: pnpm / yarn / npm (from lockfile)
   **CONFIGS FOUND**:
     - vitest.config.ts: yes/no + exclude list if non-empty
     - playwright.config.ts: yes/no + testDir
     - tsconfig.json: yes/no + strict mode
     - build targets discovered
   **TEST COMMANDS**: discovered npm scripts for test/type-check/lint
   **ACTIVE TODOS**: open items from TodoRead if any
   **VERDICT**:
     - CLEAR TO PROCEED — tree clean, no surprises
     - SOFT BLOCK — dirty tree or stash items (describe what)
     - HARD BLOCK — failing tests in the known-good suite (list them)

Rules:
- Never start implementation work after a HARD BLOCK verdict.
- After a SOFT BLOCK, get explicit confirmation before coding.
- CLEAR TO PROCEED means proceed — do not ask again.

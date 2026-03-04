# TerraFusion OS — Workspace Safety Protocol

## Purpose

Prevent AI agent–induced "spontaneous mutations" — uncommitted file edits that appear
during development due to IDE formatters, code actions, or agent side-effects.

## Required `.vscode/settings.json` Values

These settings are tracked in the repository. **Do not change them:**

```json
{
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll": "never",
    "source.organizeImports": "never"
  }
}
```

### Why

- `formatOnSave: false` — prevents Prettier/ESLint from rewriting files on every save,
  which caused phantom diffs in the worktree during agent sessions.
- `codeActionsOnSave: never` — prevents auto-fix and auto-import-sort from modifying
  files that an agent opened but didn't intentionally edit.

## Agent Quarantine Protocol

When working with AI coding agents (Copilot, Codex, Claude Code, etc.):

1. **Recon-only first pass** — read files, search, understand before modifying.
2. **Check worktree before and after** — `git status --short` before starting work
   and after every agent session. Any unexpected modified files are a mutation incident.
3. **Stage selectively** — never `git add .`. Always `git add <specific-files>`.
4. **Revert residue immediately** — `git checkout -- <file>` for any unintended changes.
5. **Delete orphan artifacts** — untracked files created by parallel agents must be
   removed before the next commit cycle.

## Mutation Incident Response

If `git status` shows unexpected modified files:

```bash
# Identify the diff
git diff <file>

# If it's a formatter/import rewrite: revert
git checkout -- <file>

# If it's an untracked orphan: delete
Remove-Item <file>    # Windows
rm <file>             # Unix

# Verify clean
git status --short
```

## Pre-Push Verification

The pre-push hook runs: vitest, security scan, dotnet build, frontend build.
This is enforced and should not be bypassed (`--no-verify` is prohibited by policy).

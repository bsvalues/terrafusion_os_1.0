# Workspace Safety: Preventing Silent Source Mutations

## Status

**Root cause narrowed** — edits were agent/editor injected (CX-8/CX-9 content), not build output.
Mutator identity not yet proven; recurrence observed on Levy/CX-21 and CX-9 docs.

## Quarantine Protocol

If you see unexpected changes in `git status` (especially files with `// CX-*` comments that you did not write):

1. **Patch** — preserve the evidence:
   ```bash
   git diff > /tmp/unexpected-$(date +%s).patch
   ```
2. **Restore** — reset the working tree and staging area:
   ```bash
   git restore --worktree --staged .
   ```
3. **Kill watchers** — stop any background processes that may be writing:
   ```bash
   # Stop dotnet watch, nodemon, vite HMR, or any file-watching process
   pkill -f "dotnet watch" 2>/dev/null
   pkill -f "nodemon" 2>/dev/null
   ```
4. **Disable auto-apply** — ensure no autonomous patching is active:
   ```bash
   # Do NOT run ralph-apply --auto in this worktree
   # Ralph auto-mode is restricted to autonomy/bot/* branches only
   ```
5. **Verify** — confirm the tree is clean:
   ```bash
   git status
   git diff
   ```

## Known Mutation Vectors

| Vector | Mechanism | Risk | Mitigation |
|--------|-----------|------|------------|
| **VS Code formatOnSave** | Editor rewrites file on Ctrl+S | Medium | `.vscode/settings.json` disables formatOnSave |
| **VS Code codeActionsOnSave** | Editor runs fixers/organizers on save | Medium | `.vscode/settings.json` disables codeActionsOnSave |
| **lint-staged (pre-commit)** | `eslint --fix` + `prettier --write` on staged files | Low (format only) | Controlled; review `git diff --cached` after commit |
| **Ralph Loop (`ralph-apply --auto`)** | Autonomous patching engine applies performance patches | High | Do not run `--auto` in dev worktrees; restricted to `autonomy/bot/*` branches |
| **Autonomy PR Lane** | Nightly workflow (03:00 UTC) runs Ralph auto-mode | Low (CI only) | Runs on its own branch; does not touch your worktree |
| **AI agent sessions** | Claude/Copilot/Cursor applying edits during conversation | Medium | Review all diffs before committing; use `git diff` frequently |
| **dotnet watch** | Hot-reload may trigger editor integrations | Low | Not proven as mutator; `.vscode/settings.json` prevents save-triggered rewrites |

## Workspace Settings

The `.vscode/settings.json` in this repo disables **auto-write behaviors only**:

- `files.autoSave: off` — no automatic file saving
- `editor.formatOnSave: false` — no formatter runs on save
- `editor.formatOnPaste: false` — no formatter runs on paste
- `editor.codeActionsOnSave: {}` — no code actions (organize imports, fix-all) on save

It does **NOT** disable:
- Roslyn analyzers (squiggles, diagnostics, code lens)
- OmniSharp / C# language server
- EditorConfig support
- TypeScript/JavaScript language services
- Manual formatting (Shift+Alt+F still works)

## Operational Rules

1. **Any `// CX-*` mutation you did not write** → follow the quarantine protocol above.
2. **Do not run `ralph-apply --auto` in this worktree.** Auto-mode is restricted to `autonomy/bot/*` branches only. Use `ralph-apply --dry-run` for inspection.
3. **Review diffs before every commit.** Use `git diff` and `git diff --cached` to verify only your intended changes are staged.
4. **Kill background watchers before investigating mutations.** File watchers can re-trigger the mutation while you're diagnosing it.
5. **Preserve evidence.** Always `git diff > /tmp/patch` before restoring. The patch files are critical for root-cause analysis.

## Incident History

| Date | Files Affected | Signature | Resolution |
|------|---------------|-----------|------------|
| 2026-02-28 | Program.cs, CostForgeService.cs | `// CX-8`, `// CX-9` DI registrations + DB rewrite | Patched, restored; content matched PR #552 |
| 2026-03-01 | Levy docs, CX-21, CX-9 docs | Recurrence of CX-pattern mutations | Restored; workspace hardening initiated |

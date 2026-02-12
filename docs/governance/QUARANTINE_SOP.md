# Quarantine Governance SOP

**Version:** 1.0  
**Status:** Active (strict enforcement)  
**Last Updated:** 2026-02-12

---

## Overview

The quarantine system is a **permanent, Git-native control plane** that enforces the root spine allowlist. It prevents root-level sprawl by requiring every root entry to be explicitly declared in a keep-list. Violations block merge via the SEAL gate.

### Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Keep-list | `scripts/quarantine/keep-list.json` | Single-authority root spine definition |
| Guard | `scripts/repo-shape-guard.mjs` | Hard allowlist enforcement via `git ls-tree` |
| Planner | `scripts/quarantine/plan.mjs` | Deterministic move-plan computation |
| Applier | `scripts/quarantine/apply.mjs` | Batch-safe `git mv` execution |
| Tests | `scripts/quarantine/__tests__/*.test.mjs` | 23 unit tests (zero dependencies) |

### Enforcement Variables (GitHub Actions)

| Variable | Value | Effect |
|----------|-------|--------|
| `QUARANTINE_GUARD_STRICT` | `true` | Guard failures block merge |
| `QUARANTINE_STRICT` | `true` | `plan --check` runs as required step |

---

## Exception Protocol

**To add a new root spine entry (directory or file):**

1. Edit `scripts/quarantine/keep-list.json` — add the entry to `dirs` or `files`.
2. Include rationale in the PR description explaining why the entry is needed at root.
3. The guard and plan gates will pass once the keep-list matches the actual root state.
4. Merge via normal PR flow (SEAL gate validates).

**To remove a root spine entry:**

1. Move/delete the actual file or directory.
2. Remove the entry from `scripts/quarantine/keep-list.json`.
3. Note: missing **files** cause guard failure (exit 1). Missing **dirs** produce a warning unless `--strict` is passed.

---

## Ignored Directories

Two root directories are **silently ignored** by the guard and planner (they exist outside the application spine):

| Directory | Purpose |
|-----------|---------|
| `QUARANTINE/` | Holds quarantined files (3 buckets: `top-level-dirs/`, `root-md/`, `root-artifacts/`) |
| `ARCHIVE/` | Reserved escape hatch for archived materials (per AGENTS.md policy) |

Hidden entries (dotfiles/dotdirs like `.github/`, `.gitignore`) are also ignored — they are not part of the visible root spine.

---

## Local Verification Commands

Run all three gates before pushing:

```bash
# Option A: Make (Linux/macOS/WSL)
make governance

# Option B: PowerShell (Windows)
pwsh tools/dev/governance.ps1

# Option C: Individual commands
node scripts/repo-shape-guard.mjs           # Guard: root spine check
node scripts/quarantine/plan.mjs --check    # Plan: no pending moves
node --test scripts/quarantine/__tests__/*.test.mjs os-platform/core/tests/phase83-tools.test.mjs
```

---

## Common Failure Scenarios

### Guard: "VIOLATIONS: N root entries not in keep-list"

**Cause:** A file or directory was added to the repo root without updating the keep-list.

**Fix:** Either:
- Add it to `keep-list.json` (if intentional) with PR rationale, OR
- Move it to the appropriate subdirectory (e.g., `docs/`, `scripts/`, `tools/`)

### Guard: "MISSING FILES: N required root files absent"

**Cause:** A keep-list file was deleted or renamed without updating the keep-list.

**Fix:** Either restore the file or remove it from `keep-list.json` `files` array.

### Plan: "CHECK FAILED — N moves needed"

**Cause:** Quarantinable entries exist at root. Shouldn't happen post-migration unless new files were added outside the keep-list.

**Fix:** Run `node scripts/quarantine/plan.mjs` to see what needs moving, then either add to keep-list or run the applier.

### Guard: "SEAL ALLOWLIST REGRESSION"

**Cause:** The legacy frontend allowlist in `seal-gate-fast.yml` is missing required patterns.

**Fix:** Re-add the missing patterns to the `grep -v` allowlist in the governance enforcement step.

---

## Quarantine Buckets

| Bucket | Path | Contents |
|--------|------|----------|
| Directories | `QUARANTINE/top-level-dirs/` | 160 former root directories |
| Markdown | `QUARANTINE/root-md/` | 428 former root `.md` files |
| Artifacts | `QUARANTINE/root-artifacts/` | 303 former root non-md files |
| **Total** | | **891 entries quarantined** |

---

## Migration History

| PR | Batch | Items | Guard Delta |
|----|-------|-------|-------------|
| #282–284 | Toolchain build | — | — |
| #286 | Review fixes | — | — |
| #287 | Dir batch-01 | 40 dirs | 891 → 851 |
| #288 | JSON purity test | — | — |
| #289 | Dir batch-02 | 40 dirs | 851 → 811 |
| #290 | Dir batch-03 | 40 dirs | 811 → 771 |
| #291 | Dir batch-04 | 40 dirs | 771 → 731 |
| #292 | MD batch-01 | 150 files | 731 → 581 |
| #293 | MD batch-02 | 150 files | 581 → 431 |
| #294 | MD batch-03 | 128 files | 431 → 303 |
| #295 | Artifacts batch-01 | 150 files | 303 → 153 |
| #296 | Artifacts batch-02 | 150 files | 153 → 3 |
| #297 | Artifacts final | 3 files | 3 → **0** |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [CI_GOVERNANCE_INDEX.md](CI_GOVERNANCE_INDEX.md) | CI workflow reference |
| [SEAL_ONLY_REQUIRED_CHECK_POLICY.md](SEAL_ONLY_REQUIRED_CHECK_POLICY.md) | SEAL gate policy |
| [AGENTS.md](../../AGENTS.md) | Core governance rules |
| [keep-list.json](../../scripts/quarantine/keep-list.json) | Root spine allowlist |

---

**Government. Transcended. Governed.**

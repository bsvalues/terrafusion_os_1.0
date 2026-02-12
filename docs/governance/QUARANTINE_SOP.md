# Quarantine Governance SOP

**Version:** 1.3  
**Status:** Active (strict enforcement)  
**Last Updated:** 2026-02-12

---

## Overview

The quarantine system is a **permanent, Git-native control plane** that enforces the root spine allowlist. It prevents root-level sprawl by requiring every root entry to be explicitly declared in a keep-list. Violations block merge via the SEAL gate.

**Root entries are evaluated from Git tracked state** (`git ls-tree --name-only HEAD`), not the filesystem. Untracked files are invisible to the guard.

### Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Keep-list | `scripts/quarantine/keep-list.json` | Single-authority root spine definition |
| Guard | `scripts/repo-shape-guard.mjs` | Hard allowlist enforcement via `git ls-tree` |
| Planner | `scripts/quarantine/plan.mjs` | Deterministic move-plan computation |
| Applier | `scripts/quarantine/apply.mjs` | Batch-safe `git mv` execution |
| Tests | `scripts/quarantine/__tests__/*.test.mjs` | 23 quarantine tests, 4 suites (zero deps) |
| Workflow Guard | `scripts/governance/__tests__/workflow-paths.test.mjs` | 13 workflow-path tests, 5 suites (zero deps) |
| Inventory Tests | `scripts/governance/__tests__/workflow-inventory*.test.mjs` | 23 inventory tests, 5 suites (zero deps) |
| Phase83 Tests | `os-platform/core/tests/phase83-tools.test.mjs` | 32 platform tests, 11 suites (zero deps) |
| **Total** | 4 test files | **91 tests / 25 suites** |

### Enforcement Variables (GitHub Actions)

| Variable | Value | Effect |
|----------|-------|--------|
| `QUARANTINE_GUARD_STRICT` | `true` | Missing keep-list dirs are treated as failures (not warnings) |
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
3. Note: missing **files** always cause guard failure (exit 1). Missing **dirs** fail when strict mode is enabled (`QUARANTINE_GUARD_STRICT=true` or `--strict`); otherwise they warn locally.

---

## Ignored and Hidden Entries

Two root directories are **silently ignored** by the guard and planner (they exist outside the application spine):

| Directory | Purpose |
|-----------|---------|
| `QUARANTINE/` | Holds quarantined files (3 buckets: `top-level-dirs/`, `root-md/`, `root-artifacts/`) |
| `ARCHIVE/` | Reserved escape hatch for archived materials (per AGENTS.md policy) |

**Dot-prefixed entries** (e.g., `.github/`, `.gitignore`, `.vscode/`) are invisible to governance — they are filtered before the allowlist check and pass through silently. They are never violations, never counted as missing, and are not listed in the keep-list.

---

## Local Verification Commands

Run all seven gates before pushing:

```bash
# Option A: Make (Linux/macOS/WSL)
make governance

# Option B: PowerShell (Windows)
pwsh tools/dev/governance.ps1

# Option C: Individual commands
node scripts/repo-shape-guard.mjs           # Guard: root spine check
node scripts/quarantine/plan.mjs --check    # Plan: no pending moves
node --test scripts/quarantine/__tests__/*.test.mjs                     # Quarantine tests (23t/4s)
node --test os-platform/core/tests/phase83-tools.test.mjs               # Phase83 tests (32t/11s)
node --test scripts/governance/__tests__/workflow-paths.test.mjs        # Workflow paths (13t/5s)
node --test scripts/governance/__tests__/workflow-inventory*.test.mjs   # Inventory tests (23t/5s)
node scripts/governance/workflow-inventory.mjs --check                  # Inventory snapshot
```

---

## Safe Quarantine Apply (Applier)

The applier (`scripts/quarantine/apply.mjs`) executes batch `git mv` operations from a plan file. It is the **only sanctioned method** for moving entries into `QUARANTINE/`.

**Do:**
- Generate a plan first: `node scripts/quarantine/plan.mjs > plan.json`
- Review the plan before applying: `cat plan.json`
- Apply via the tool: `node scripts/quarantine/apply.mjs plan.json`
- Verify post-apply: `node scripts/repo-shape-guard.mjs`

**Don't:**
- Never run `mv` or `git mv` manually for quarantine moves — the applier handles subdir routing, collision avoidance, and bucket assignment.
- Never apply without verifying the plan output first.
- Never skip the post-apply guard check.

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

**Cause:** Quarantinable entries exist at root. This is a governance regression and must be resolved before merge.

**Fix:** Run `node scripts/quarantine/plan.mjs` to see what needs moving, then either add to keep-list or run the applier.

### Guard: "SEAL ALLOWLIST REGRESSION"

**Cause:** The legacy frontend allowlist in `seal-gate-fast.yml` is missing required patterns.

**Fix:** Locate the `checkSealAllowlist` function in `scripts/repo-shape-guard.mjs` and verify the patterns match those in `.github/workflows/seal-gate-fast.yml`.

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
| #298 | Operational hardening | — | — |
| #299 | SOP v1.1 polish | — | — |
| #300 | CI regression fix + workflow-path guard | — | — |
| #301 | Governance suite reporting (per-suite counts) | — | — |
| #302 | CI noise triage: silence 17 non-required workflows | — | — |

---

## CI Noise Triage (PR #302)

17 non-required workflows were failing on every push to `main`, generating email notification spam. **None** are required by branch protection.

**Required checks (5 total — unaffected):**
`🔒 TerraFusion Seal Gate`, `governed-spine`, `phase85-tools`, `phase86-toolrunner`, `🧪 Tier-1 UI Harness Validation`

**Action taken:** Removed `push:` triggers from all 17; each retains `workflow_dispatch` and any pre-existing `schedule`.

| Category | Workflows | Root Cause |
|----------|-----------|------------|
| Windows runner checkout | baseline-guard, tag-lint, code-intel | `actions/checkout@v4` exit code 1 |
| Code bug | scope-drift-guard | `getTouchedRoots` crash in scope-classifier |
| Config mismatch | manifest-contract-guard | pnpm version 9 vs packageManager |
| Quarantined paths | infrastructure-cicd | `infrastructure/` quarantined |
| Freeze guard | wave1-freeze-guard | Blocks unconditionally until freeze date |
| Build failures | ci-verified, visual-regression, test, deployment, ci-cd-pipeline, security, performance-regression, terrafusion-gate-enforcement, terrafusion-pipeline, accessibility-audit | Various .NET/pnpm/Playwright failures |

**Schedules preserved:** accessibility-audit (weekly), ci-cd-pipeline (nightly), security (daily).

**Re-enabling:** To restore push triggers on a workflow, add `push: branches: [main]` back to its `on:` block and fix the underlying failure first.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [CI_GOVERNANCE_INDEX.md](CI_GOVERNANCE_INDEX.md) | CI workflow reference |
| [CI_WORKFLOW_LIFECYCLE_POLICY.md](CI_WORKFLOW_LIFECYCLE_POLICY.md) | Workflow classes, promotion/demotion, trigger scoping |
| [CLAIMS_LEDGER.md](CLAIMS_LEDGER.md) | Performance & reliability claims catalog (Wave 0) |
| [TIER1_UI_UX_DOD_CHECKLIST.md](TIER1_UI_UX_DOD_CHECKLIST.md) | Tier-1 UI/UX Definition-of-Done checklist (telemetry + receipts) |
| [TIER1_EVIDENCE_EXAMPLES.md](TIER1_EVIDENCE_EXAMPLES.md) | Reviewer calibration sheet (what good evidence looks like) |
| [SEAL_ONLY_REQUIRED_CHECK_POLICY.md](SEAL_ONLY_REQUIRED_CHECK_POLICY.md) | SEAL gate policy |
| [AGENTS.md](../../AGENTS.md) | Core governance rules |
| [keep-list.json](../../scripts/quarantine/keep-list.json) | Root spine allowlist |

---

**Government. Transcended. Governed.**

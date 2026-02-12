# TerraFusion Autonomy v1 — Governance Contract

**Version:** 1.0.0  
**Effective Date:** 2026-01-30  
**Classification:** Government-Grade Auditable Autonomy  
**Scope:** Tier 0 Only

---

## Executive Summary

TerraFusion Autonomy v1 enables AI-assisted code refactoring with **deterministic selection**, **governed eligibility**, **proof artifacts**, and **guaranteed rollback**. This document defines the operational guarantees a County CIO can rely on without reading source code.

---

## 1. What Tier 0 Can Do

| Capability | Description | Risk Level |
|------------|-------------|------------|
| **setstate-nonfunctional** | Convert `setState(x + 1)` to `setState(prev => prev + 1)` | Low (riskScore ≤ 40) |
| **dedupe-imports** | Merge duplicate imports from same module | Low |
| **debarrel-import** | Replace barrel imports with direct imports | Low |
| **missing-use-client** | Add `"use client"` directive to React client components | Low |

### Constraints Applied to All Tier 0 Strategies

- **Single file per patch** — never modifies multiple files atomically
- **Estimated lines changed ≤ 40** — small, reviewable diffs
- **Risk score ≤ 40** — semantic risk assessment below threshold
- **Priority score ≥ 70** — only high-confidence candidates

---

## 2. What Tier 0 Will Refuse to Do

| Refusal Condition | Enforcement |
|-------------------|-------------|
| Modify files outside **Core Governance Surface** | ❌ Blocked by governance filter |
| Touch **ARCHIVE/** directories | ❌ Forbidden path check |
| Touch **specialized/** or **applications/** | ❌ Forbidden path check |
| Apply Tier 1+ strategies (e.g., waterfall-parallelize) | ❌ Requires explicit `--tier=1` flag |
| Apply patches when working tree is dirty | ❌ Safety rail violation |
| Apply patches on protected branches (main) | ❌ Safety rail violation |
| Chain shell commands in rollback | ❌ Rollback contract violation |
| Use destructive git operations (reset, clean) | ❌ Rollback contract violation |

---

## 3. Determinism Guarantees

| Guarantee | Assertion |
|-----------|-----------|
| **Same input → same selection** | Identical `perf.plan.json` produces identical selection across N runs |
| **Stable across shuffles** | Plan item order does not affect selection |
| **Tie-breaking is deterministic** | priorityScore → estimatedLinesChanged → id (lexicographic) |
| **Noop always emits proof** | Even when no candidate is selected, a proof is emitted with reason |

### Selection Algorithm (4-tier ranking)

1. **Governance filter** — allowed surface only, no forbidden paths
2. **Tier filter** — Tier 0 only unless explicitly enabled
3. **Risk/size filter** — riskScore ≤ threshold, estimatedLinesChanged ≤ threshold
4. **Deterministic sort** — priorityScore DESC, estimatedLinesChanged ASC, id ASC

---

## 4. Proof Schema Guarantees

Every autonomous operation emits an `ApplyProof` record to `apply-proofs.json`.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `planItemId` | string | Unique identifier for the plan item |
| `strategyId` | string | Strategy that was applied |
| `outcome` | enum | `applied` \| `skipped` \| `blocked` \| `noop` \| `dry-run` |
| `allowedSurfaceCheck` | object | `{ passed: boolean, file: string }` |
| `forbiddenPathCheck` | object | `{ passed: boolean, file: string }` |
| `gitApplyCheck` | object | `{ ok: boolean, output?: string }` |
| `gates` | array | `[{ name, command, passed, durationMs }]` |
| `selectionReason` | object | Why this candidate was selected or rejected |

### Applied-Only Fields

| Field | Condition | Description |
|-------|-----------|-------------|
| `finalCommitSha` | outcome = applied | Full 40-char commit SHA |
| `rollbackCommand` | outcome = applied | `git revert <short-sha>` command |
| `diffStats` | outcome = applied | `{ filesChanged, linesAdded, linesRemoved }` |

---

## 5. Rollback Guarantees

| Invariant | Enforcement |
|-----------|-------------|
| Applied proof → `rollbackCommand` exists | Contract test assertion |
| Format: `git revert <sha>` only | Regex parser validation |
| SHA matches `finalCommitSha` (prefix) | Prefix match assertion |
| SHA standardized to 10 chars | Length assertion |
| No destructive commands | Forbidden list: `reset`, `checkout`, `clean`, `push --force` |
| No shell chaining | Reject: `;`, `&`, `\|`, `` ` ``, `$()` |
| Non-applied → no executable revert | Negative guarantee assertion |

### Rollback Procedure

```bash
# From proof artifact:
git revert <rollbackCommand-sha>

# Verify:
git log --oneline -3
```

---

## 6. How to Audit a Patch

### Pre-Application Checklist

- [ ] Verify `perf.plan.json` exists with valid structure
- [ ] Verify candidate is in allowed governance surface
- [ ] Verify candidate is not in forbidden paths
- [ ] Verify strategy is Tier 0
- [ ] Verify riskScore ≤ 40
- [ ] Verify estimatedLinesChanged ≤ 40

### Post-Application Checklist

- [ ] `apply-proofs.json` contains proof with `outcome: applied`
- [ ] `finalCommitSha` matches actual commit
- [ ] `rollbackCommand` is valid `git revert` format
- [ ] Gates passed: `type-check` ✅, `phase83-tools` ✅
- [ ] `diffStats.filesChanged === 1`
- [ ] Commit message follows governance format

### Rollback Validation

- [ ] Execute `rollbackCommand` from proof
- [ ] Verify revert commit created
- [ ] Verify no regressions introduced

---

## 7. Governance Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| `perf.plan.json` | `tools/registry/perf-skill-audit/out/` | Candidate inventory |
| `apply-proofs.json` | `tools/registry/perf-skill-audit/out/` | Audit trail |
| `autonomy-report.json` | `tools/registry/perf-skill-audit/out/` | Machine-readable status |
| `autonomy-report.md` | `tools/registry/perf-skill-audit/out/` | Human-readable status |

### Contract Test Files

| File | Purpose |
|------|---------|
| [rollback-contract.test.ts](tools/registry/perf-skill-audit/test/rollback-contract.test.ts) | 7 rollback invariant tests |
| [auto-determinism.test.ts](tools/registry/perf-skill-audit/test/auto-determinism.test.ts) | 23 determinism contract tests |
| [patch-strategies.test.ts](tools/registry/perf-skill-audit/test/patch-strategies.test.ts) | 44 strategy validation tests |

---

## 8. Required Gates

| Gate | Command | Must Pass |
|------|---------|-----------|
| Type Check | `pnpm run type-check` | ✅ Required |
| Phase 8.3 Tools | `node --test os-platform/core/tests/phase83-tools.test.mjs` | ✅ Required |
| Determinism Tests | `npx tsx --test tools/registry/perf-skill-audit/test/auto-determinism.test.ts` | ✅ Required |
| Rollback Tests | `npx tsx --test tools/registry/perf-skill-audit/test/rollback-contract.test.ts` | ✅ Required |

---

## 9. Operational Modes

| Mode | Flag | Behavior |
|------|------|----------|
| **Rehearsal (default)** | `--dry-run` | Selection + plan, no changes |
| **Explain** | `--explain` | Show what would change, no changes |
| **Apply** | `--auto` | Apply one patch, emit proof, commit |
| **Apply with Proof** | `--auto --emit-proof` | Apply + write proof artifacts |

### Safety Rails (--auto mode)

- Refuses if working tree is dirty
- Refuses if on protected branch (main)
- Refuses if gates fail after patch
- Automatically rolls back if gates fail

### Automated PR Lane (Phase 4N0)

The `autonomy-pr-lane.yml` workflow automates Tier 0 patching with human-merge governance:

| Property | Value |
|----------|-------|
| **Trigger** | Nightly (03:00 UTC) + manual dispatch |
| **Branch** | `autonomy/bot/<timestamp>-<runid>` |
| **Max patches** | 1 per run |
| **Tier** | Tier 0 only |
| **Output** | PR with proof artifacts attached |
| **Merge** | Manual only (no automerge) |

**Invariants enforced by contract tests:**
- Never applies directly to main
- Always uploads artifacts (even on noop)
- PR labeled: `autonomy`, `tier-0`, `automated`

---

## 10. Incident Protocol

If an autonomous patch causes regression:

1. **Rollback immediately:**
   ```bash
   git revert <rollbackCommand-sha>
   ```

2. **Open incident note with:**
   - Proof ID (`planItemId`)
   - Commit SHA (`finalCommitSha`)
   - Roll ack SHA (from revert)
   - Gate output
   - Root cause category: `strategy | detection | environment`

3. **Disable strategy temporarily:**
   ```bash
   ralph-apply --auto --disable-strategy=<strategyId>
   ```

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-30 | Initial release: Tier 0 with setstate-nonfunctional, rollback contracts |
| 1.1.0 | 2026-01-30 | Phase 4N0: Added automated PR lane with workflow contract tests |

---

## 12. Approval

This document defines the operational guarantees for TerraFusion Autonomy v1.

**Capability Status:** ✅ ACTIVE  
**Tier Level:** Tier 0 Only  
**Evidence Chain:** [phase-4m6-tier0-envelope branch commits preserved in main]

---

*Government. Transcended.*

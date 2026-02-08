# Release Boundary Strategy

**Purpose**: Define how TerraFusion OS packages and ships cohesive feature sets  
**Context**: Control Plane v1 (58 commits) establishes pattern for future releases  
**Governance**: Operator risk reduction, bisectable history, audit trail clarity  

---

## Problem Statement

**Before Control Plane v1**:
- 58 commits ahead of `origin/main` (Slices 23, 24, 24.1, 24.2, 24.2.1, Priority 0)
- No clear boundary between "work in progress" and "shipped value"
- Unclear operator provenance: What functionality actually shipped?
- Risk: "Unshipped value" drift (local features vs. deployed features)

**After Control Plane v1**:
- Clear release boundary with version number (v1.0.0)
- Release notes document what shipped, what changed, operator impact
- CI contract enforced (canonical `pnpm test:governed`)
- Bisectable, auditable, operator-reviewable

---

## Release Boundary Pattern

### 1. Define Release Scope
- **Cohesive Unit**: Related features that form a logical whole (e.g., Control Plane = Policy + Trace + Telemetry + Journeys + Export/Import)
- **Feature Complete**: All advertised functionality works (no half-implemented features)
- **Zero Broken Windows**: All tests pass, no regressions (29/29 policy tests, governed gates green)

### 2. Create Release Notes
- **Location**: `docs/releases/<COMPONENT>_v<VERSION>.md`
- **Template**: See `CONTROL_PLANE_v1.0.0.md` for reference
- **Content**:
  - Executive Summary
  - What Shipped (feature-by-feature breakdown)
  - Testing Coverage (pass/fail metrics)
  - Operator Impact (what changes, what stays same, upgrade notes)
  - Known Limitations (workarounds, future roadmap)
  - Security & Compliance (FISMA, county isolation)
  - Rollback Instructions (disaster recovery)

### 3. Lock CI Contract
- **Canonical Commands**: Establish single source of truth (e.g., `pnpm test:governed`)
- **Workflow Updates**: Update `.github/workflows/*.yml` to use canonical commands
- **Prevent Drift**: CI matches local development exactly (no "works locally, fails CI" ambiguity)

### 4. Ship as Cohesive PR
**Strategy A: Single PR with Subdivisions** (Recommended for Control Plane v1)
- One PR containing all 58 commits
- Organized by slices (23, 24, 24.1, 24.2, 24.2.1, Priority 0)
- Release notes file included in PR
- **Advantages**: 
  - Easy to review as cohesive unit
  - All gates pass together (no partial state)
  - Single merge point (clear boundary)
- **Disadvantages**: 
  - Large PR (requires discipline in review)

**Strategy B: Slice-by-Slice PRs** (For future complex releases)
- Separate PR per slice (Slice 23 PR, Slice 24 PR, etc.)
- Each PR passes gates independently
- Final PR includes release notes + version bump
- **Advantages**: 
  - Smaller, reviewable PRs
  - Bisectable (can identify which slice caused regression)
- **Disadvantages**: 
  - More overhead (multiple PR reviews)
  - Risk of partial ship (Slice 23 shipped, Slice 24 stalled)

**Strategy C: Release Branch** (For multi-week feature development)
- Create `release/control-plane-v1` branch
- Merge slices into release branch as completed
- One PR from release branch → main when feature-complete
- **Advantages**: 
  - Isolates experimental work from main
  - Easy to abandon if feature doesn't ship
- **Disadvantages**: 
  - Merge conflicts if main moves forward
  - Requires branch discipline

---

## Control Plane v1 Strategy (Executed)

**Chosen Strategy**: Strategy A (Single PR with Subdivisions)

**Rationale**:
- 58 commits are tightly coupled (Policy → Trace → Telemetry → Journeys → Export/Import form cohesive stack)
- All slices depend on earlier slices (Slice 24.2 needs 24.1, which needs 24, etc.)
- Zero broken windows maintained throughout (no partial failures)
- Release notes package entire unit for operator review

**Execution Steps**:
1. ✅ Lock local commits (58 commits ahead, all green)
2. ✅ Create release notes (`CONTROL_PLANE_v1.0.0.md`)
3. ✅ Lock CI contract (`pnpm test:governed`, workflow updates)
4. ⏳ Commit Priority 0 changes (canonical command, CI updates, release notes)
5. ⏳ Push feature branch (`feature/control-plane-v1`)
6. ⏳ Open PR with release notes in description
7. ⏳ Verify CI passes (governed-spine job green)
8. ⏳ Merge to main (squash vs. merge commit TBD)

---

## Future Release Patterns

### Small Features (1-3 commits)
- **Strategy**: Direct PR to main
- **Process**: Feature → Tests → PR → Merge
- **No Release Notes**: Included in quarterly changelog

### Medium Features (4-20 commits)
- **Strategy**: Strategy A (Single PR) or Strategy B (Slice PRs)
- **Process**: Slice commits → Release notes → PR → Merge
- **Release Notes**: Brief (1-2 pages)

### Major Features (20+ commits)
- **Strategy**: Strategy C (Release Branch) or Strategy A (cohesive PR)
- **Process**: Release branch → Slice PRs → Feature-complete → Release notes → Main PR
- **Release Notes**: Comprehensive (like Control Plane v1)

### Infrastructure Changes (e.g., Priority 0)
- **Strategy**: Inline with next feature release OR separate infra PR
- **Process**: Infra changes → Verify gates → Document impact → PR
- **Release Notes**: Include in feature release OR separate infra changelog

---

## Merge Strategy

### Option 1: Squash Commits (Recommended for Clean History)
**Command**: `git merge --squash feature/control-plane-v1`

**Advantages**:
- Clean main branch history (1 commit = 1 release)
- Easier to revert (revert single commit = revert entire release)
- Clearer for operators (`git log` shows "Control Plane v1.0.0" as atomic unit)

**Disadvantages**:
- Lose granular commit history on main (slice commits only visible in feature branch)
- Bisect less effective (can't bisect within release)

**Recommended for**: User-facing releases (Control Plane v1, Atlas v2, etc.)

---

### Option 2: Merge Commit (Preserve History)
**Command**: `git merge --no-ff feature/control-plane-v1`

**Advantages**:
- Preserve full commit history on main
- Bisectable (can identify which slice caused regression)
- Detailed audit trail (every commit visible)

**Disadvantages**:
- Noisy history (`git log` shows 58 commits instead of 1)
- Harder to revert (must revert merge commit + deal with history)

**Recommended for**: Infrastructure releases, internal tooling, experimental features

---

### Option 3: Rebase + Merge (Linear History)
**Command**: `git rebase main && git merge --ff-only`

**Advantages**:
- Linear history (no merge commits)
- Preserves individual commit messages
- Bisectable

**Disadvantages**:
- Rewrites feature branch history (loses original timestamps)
- Confusing if multiple developers on same feature
- Not recommended for released branches

**Recommended for**: Solo developer, short-lived branches

---

## Control Plane v1 Merge Decision

**Chosen Strategy**: **Option 1 (Squash Commits)**

**Rationale**:
- Control Plane v1 is user-facing (operators see UI tabs, export/import features)
- 58 commits are tightly coupled (one cohesive unit)
- Easier to revert if production issues arise
- Cleaner operator-facing changelog (`git log` shows one atomic release)

**Squash Commit Message**:
```
feat(control-plane): ship Control Plane v1.0.0 (Policy UI + Tracing + Journeys)

Release: Control Plane v1.0.0
Scope: 58 commits (Slices 23, 24, 24.1, 24.2, 24.2.1, Priority 0)

What Shipped:
- Policy UI: Live agent authorization management
- Distributed Tracing: Correlation IDs + causal chains
- Telemetry: Custom events for operator dashboards
- Golden Journeys: End-to-end workflow validation
- Policy Export/Import: Disaster recovery + multi-env sync
- Ship Discipline: Canonical test:governed command + CI contract

Testing: 29/29 deterministic, governed gates green (type-check + phase83-tools)
Quality: Zero broken windows, regression immunity via DI seams
Governance: FISMA-compliant, county-isolated, audit trail complete

Release Notes: docs/releases/CONTROL_PLANE_v1.0.0.md
Operator Impact: New UI tabs, policy management, disaster recovery
Rollback: LOW risk (UI-only, no backend changes)

Government. Transcended.
```

---

## Verification Checklist

Before merging any release:

- [ ] All tests pass locally (`pnpm test:governed`)
- [ ] CI passes (governed-spine job green on feature branch)
- [ ] Release notes complete (`docs/releases/<COMPONENT>_v<VERSION>.md`)
- [ ] Release boundary documented (this file updated)
- [ ] Operator impact documented (upgrade notes, rollback instructions)
- [ ] Security review (FISMA compliance, county isolation)
- [ ] Quality gates green (zero broken windows, no regressions)
- [ ] Version bump (if applicable: package.json, API versions)
- [ ] Changelog updated (quarterly changelog references this release)

---

## Lessons Learned (Control Plane v1)

### What Worked
✅ **Ship Discipline FIRST**: Priority 0 (CI contract) before Priority 1 (Policy Diff Viewer) prevented drift  
✅ **Zero Broken Windows**: Fixing tests deterministically (24/29 → 29/29) before continuing features  
✅ **DI Seams**: Injectable `readFileText` eliminated jsdom timing races (pure logic tests)  
✅ **Canonical Commands**: `pnpm test:governed` locked rails before laying more track  
✅ **Release Notes**: Comprehensive documentation reduced operator risk  

### What to Improve
⚠️ **Earlier Release Boundary Discussion**: 58 commits accumulated before defining boundary (should discuss at 20-30 commits)  
⚠️ **Slice Documentation**: Each slice should have brief progress notes (not just final release notes)  
⚠️ **CI Contract Drift**: Multiple workflows had varying type-check patterns (standardized in Priority 0, but earlier would be better)  

---

## Next Release: Policy Diff Viewer (v1.1)

**Strategy**: Strategy A (Single PR, smaller scope)  
**Scope**: Slice 24.3 only (~5-10 commits)  
**Release Notes**: Brief (2-3 pages, append to Control Plane v1 notes)  
**Merge Strategy**: Squash (cohesive with v1.0.0)  
**Timeline**: After Control Plane v1 merges to main  

---

**Classification**: Governance Strategy  
**Authority**: AGENTS.md § "COMMIT HYGIENE"  
**Enforcement**: Required for releases > 10 commits  

*Government. Transcended.*

# TerraFusion OS Sustainment Guide (Oracle + Compatibility Governance)

## Purpose
This document defines the sustainment controls that keep TerraFusion OS's evidence plane governable and audit-grade in production.

It answers three questions:
1. Where is the oracle?
2. What breaks it?
3. How do we safely bump it?

---

## Governance Lattice (Authoritative)

### Oracle (Golden Corpus)
**Canonical GA oracle:** `v1.5.0` Golden Corpus Release Assets  
**Pinned contract lockfile:** `golden/GOLDEN_CORPUS.lock.json`

**Oracle definition:**
- The Golden Corpus is a fixed set of published GA artifacts with pinned SHA256 hashes.
- The lockfile is the contract that describes required artifacts, schema versions, and semantics.

**Oracle assets live in:**
- Git tag: `v1.5.0`
- GitHub Release: `v1.5.0` (contains the pinned corpus artifacts)
- Repo lockfile: `golden/GOLDEN_CORPUS.lock.json`

**Source of truth:** Oracle assets must be sourced from the `v1.5.0` GitHub Release artifacts, not local build outputs.

---

### Required Merge Gates (Constitutional)
Merges to `main` are blocked unless all required checks pass:
- `typecheck-core` (TypeScript type checking)
- `phase83-tools` (Phase 83 governance tests)
- `🔒 SEAL` (TerraFusion seal gate)

Branch protection:
- Strict status checks enabled
- ≥1 approving review required
- Merges cannot bypass constitutional gates

---

### Drift Detection (Scheduled Oracle Health)
Workflow: `.github/workflows/oracle-health.yml`  
Schedule: **Sundays 03:00 UTC**  
Behavior:
- Downloads GA `v1.5.0` release assets
- Computes SHA256 and compares against `golden/GOLDEN_CORPUS.lock.json`
- Uploads an `oracle-health-report.json` artifact
- On failure: creates/updates a deduped incident issue

---

## Locked Contract Semantics (Do Not Change Silently)
The Golden Corpus lockfile enforces these semantics:

- **Determinism:** Structural determinism (canonical manifest + stable file set), not byte-perfect ZIP hashes
- **Policy field mapping:** `policySnapshot.signaturePolicy`
- **Triplet status:** `triplets.ok` (deprecated: `.complete`)
- **Missing file error:** `HASH_MISMATCH` (hash check subsumes presence)

Changing any of these requires a controlled oracle bump (see below).

---

## What Breaks the Oracle
Any change that modifies evidence-plane contracts can break compatibility. Examples:

### Contract surface changes
- Verifier schema shape/version changes
- Error code semantics or precedence changes
- Casefile/ledger canonicalization rules
- Policy snapshot embedding rules
- Triplet validation semantics
- Redaction proof schema semantics
- Chunking manifest semantics
- DR reconstitution report schema/semantics

### Golden corpus asset changes
- Artifact names or required set changes
- Hash calculation changes
- Signing envelope changes that impact artifact bytes (unless explicitly excluded by determinism rules)

If a PR touches evidence-plane paths and the compat gate fails, that is expected behavior: you either restore compatibility or bump the oracle.

**Evidence-plane paths (minimum):**
- `tools/`
- `registry/`
- `autonomy-viewer/`
- plus any code that emits/verifies casefiles/ledgers/packs/reports

---

## Operating Rhythm

### Weekly (No Drift)
- Oracle Health workflow stays green → **no action**

### Weekly (Drift Detected)
- Oracle Health fails → one deduped issue is opened/updated
- Treat as a governance incident:
  1. Confirm whether GA release assets changed (should not happen)
  2. Confirm lockfile didn't drift
  3. Re-run oracle health manually
  4. If assets drifted: investigate release integrity immediately

### PRs touching evidence-plane paths
- Compat gate is required
- If it fails:
  - Fix the change to preserve compatibility, OR
  - Perform an oracle bump (next section)

---

## Safe Oracle Bump Procedure (RC → GA)
Use this procedure when a change intentionally modifies contracts.

### 0) Preconditions
- Full suite green
- `typecheck-core` green
- Phase 83 governance green
- Compatibility changes are intentional and documented

### 1) Cut new RC tag
Example: `v1.5.1-rc.1` (or `v1.6.0-rc.1` if breaking)
- Create annotated tag
- Publish RC release

### 2) Generate golden corpus artifacts for the RC
Run the generator:
```bash
npx tsx scripts/generate-golden-corpus.ts
```
Output: fixed artifact set + `SHA256SUMS.txt`

### 3) Upload artifacts to the RC release
Attach artifacts to the RC release and ensure they verify clean-room.

### 4) Update lockfile
- Update `golden/GOLDEN_CORPUS.lock.json` to point to the RC tag
- Pin all artifact hashes and sizes

### 5) Enforce compat gate against the new RC oracle
- Ensure compat gate passes against the new oracle
- Ensure branch protection keeps the gate required

### 6) Cut GA and promote the corpus
- Tag GA (e.g., `v1.5.1`)
- Create GA release
- Attach the same golden corpus artifacts to GA
- Repoint lockfile reference to GA tag (hashes unchanged)

**Rule:** lockfile must never reference an unpublished artifact set.

---

## Manual/CLI Verification

### Check branch protection state (CLI)
```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '{required_checks: .required_status_checks.contexts, strict: .required_status_checks.strict}'
```

### Run Oracle Health manually
```bash
gh workflow run oracle-health.yml --ref main
```

With overrides:
```bash
gh workflow run oracle-health.yml --ref main -f release_tag=v1.5.0 -f open_issue_on_failure=false
```

### Run compatibility gate locally
```bash
cd tools/registry/autonomy-viewer
npx tsx --test test/casefile.test.ts test/verify-casefile.test.ts
```

---

## Ownership
- Golden corpus is a constitutional artifact.
- Changes require Codeowner approval and must be coupled to a release tag.
- Lockfile updates require evidence: release tag, SHA256SUMS match, successful compat run.

---

## Two-Tier Oracle Model (v1.5.1+)

As of v1.5.1, TerraFusion OS uses a **two-tier oracle model**:

### Tier 1: OS Evidence-Plane Oracle
- **Workflow:** `.github/workflows/oracle-health.yml`
- **Schedule:** Sundays 03:00 UTC
- **Lockfile:** `golden/GOLDEN_CORPUS.lock.json`
- **Scope:** Global governance invariants, golden corpus integrity

### Tier 2: County Accreditation Oracle
- **Workflow:** `.github/workflows/accreditation-oracle-health.yml`
- **Schedule:** Sundays 04:00 UTC
- **Lockfile:** `tools/registry/autonomy-viewer/ACCREDITATION_REFERENCE.lock.json`
- **Scope:** County deployment/accreditation contract invariants

Both tiers run on **Ubuntu + Windows matrix** for cross-OS determinism verification.

---

## Oracle Workflows: Known Pitfalls & Fixes

This runbook documents hardening fixes applied during v1.5.1 release validation. Apply these patterns to any new oracle workflow.

### 1. CLI Bin Files Must Be Force-Included
**Problem:** `bin/` is in `.gitignore` globally, which excludes ESM CLI entry points.
**Symptom:** `ERR_MODULE_NOT_FOUND: Cannot find module 'bin/accreditation-packet.mjs'`
**Fix:** Add negation pattern to `.gitignore`:
```gitignore
# Force include autonomy-viewer CLI tools (not compiled binaries)
!tools/registry/autonomy-viewer/bin/
tools/registry/autonomy-viewer/bin/*.mjs
```
Then `git add --force` the bin files.

### 2. Profile Must Exist
**Problem:** Workflow references a non-existent profile name.
**Symptom:** `[ACCREDITATION_KIT_FAILED] undefined`
**Fix:** Use only valid profiles: `county`, `state`, `incident`
**Valid:** `--profile county`
**Invalid:** `--profile oracle-health-ubuntu-latest`

### 3. Summary Job Working-Directory Inheritance
**Problem:** Summary job inherits `working-directory` from defaults but doesn't checkout.
**Symptom:** `No such file or directory` for working directory
**Fix:** Override defaults in summary job:
```yaml
summary:
  defaults:
    run:
      working-directory: .
```

### 4. Windows Determinism Requires Bash Shell
**Problem:** PowerShell interprets `$schema` as a variable, mangling inline JavaScript.
**Symptom:** `SyntaxError: Invalid or unexpected token` with `manifest.\` (truncated)
**Fix:** Force bash shell for inline JavaScript:
```yaml
- name: Determinism check
  shell: bash
  run: |
    node -e "..."
```

---

## Quick Reference

| Asset | Location |
|-------|----------|
| OS oracle tag | `v1.5.0` |
| Accreditation release | `v1.5.1` |
| OS lockfile | `golden/GOLDEN_CORPUS.lock.json` |
| Accreditation lockfile | `tools/registry/autonomy-viewer/ACCREDITATION_REFERENCE.lock.json` |
| OS oracle health | `.github/workflows/oracle-health.yml` |
| Accreditation oracle health | `.github/workflows/accreditation-oracle-health.yml` |
| Compat gate (OS) | `.github/workflows/golden-corpus-compat.yml` |
| Compat gate (Accreditation) | `.github/workflows/accreditation-compat.yml` |
| Generator | `scripts/generate-golden-corpus.ts` |
| Release prep | `scripts/prepare-accreditation-release.mjs` |
| Contract docs | `golden/README.md` |

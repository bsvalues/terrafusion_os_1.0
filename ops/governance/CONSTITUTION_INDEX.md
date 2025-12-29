# TerraFusion OS — Constitution Index

> **Status**: 🔒 SEALED  
> **Last Updated**: 2025-12-29  
> **Main HEAD**: `cbfc37a6a`  
> **Release**: `v1.0.0-benton-rc.1`

---

## Source of Truth

This document is the **single authoritative index** of all sealed constitutions in TerraFusion OS. Every constitution tag, proof command, and evidence location is recorded here.

---

## Current State

| Property | Value |
|----------|-------|
| Branch | `main` |
| HEAD Commit | `cbfc37a6a` |
| Release Tag | `v1.0.0-benton-rc.1` |
| Gate Status | ✅ PASS (11/11 + 13/13 + 15/15) |
| Constitutions | 12 sealed |

---

## Sealed Constitution Tags

| Tag | Scope | Date Sealed |
|-----|-------|-------------|
| `v1.0.0-agent-constitution` | Agent Runtime | 2025-12-17 |
| `v1.0.0-deploy-constitution` | Deploy Runtime | 2025-12-18 |
| `v1.0.0-deploy-apply-receipt-constitution` | Deploy Apply + Receipt | 2025-12-19 |
| `v1.0.0-gate-constitution` | Gate CI/JSON | 2025-12-17 |
| `v1.0.0-marketplace-constitution` | Marketplace Runtime | 2025-12-19 |
| `v1.0.0-marketplace-constitution-phase1` | Marketplace Phase 1 | 2025-12-19 |
| `v1.0.0-marketplace-execution-constitution` | Marketplace Execution | 2025-12-20 |
| `v1.0.0-observability-constitution` | Observability Runtime | 2025-12-25 |
| `v1.0.0-proof-sources-of-truth` | Proof Emitters | 2025-12-20 |
| `v1.0.0-release-orchestration-constitution` | Release Orchestration | 2025-12-21 |
| `v1.0.0-release-playbooks` | Release Playbooks | 2025-12-21 |
| `v1.0.0-runtimecert-bundle-constitution` | RuntimeCert Bundle | 2025-12-18 |

---

## Proof Commands

These commands validate the constitution invariants. All must pass for a valid seal.

### Gate Proof (Core)

```bash
# Quick gate check
./ops/dev/tf.sh gate

# Full gate with invariant suites
./ops/dev/tf.sh gate --full

# CI JSON output (machine-readable)
./ops/dev/tf.sh gate --ci
```

### Gate CI Tests

```bash
# Gate JSON schema validation (13 tests)
bash ops/dev/tests/test_gate_ci.sh

# Breaker invariants (15 tests)
bash ops/dev/tests/test_gate_breaker.sh
```

### Observability Proof

```bash
# Governance tests (22 tests)
bash ops/dev/tests/test_observability_governance.sh

# Breaker attacks (25 tests)
bash ops/dev/tests/test_observability_breaker.sh
```

### Agent Proof

```bash
# Agent runtime governance (11 tests)
bash ops/dev/tests/test_agent_governance.sh
```

### Deploy Proof

```bash
# Deploy runtime governance
bash ops/dev/tests/test_deploy_governance.sh

# Deploy promotion policy breaker
bash ops/dev/tests/test_deploy_promotion_policy_breaker.sh
```

### Marketplace Proof

```bash
# Marketplace runtime governance
bash ops/dev/tests/test_marketplace_governance.sh

# Marketplace breaker
bash ops/dev/tests/test_marketplace_breaker.sh
```

### Release Bundle Audit

```bash
# Audit a release bundle (replace <dir> with bundle path)
./ops/dev/tf.sh release audit --bundle <dir> --ci
```

---

## Evidence Locations

| Constitution | Evidence Path |
|--------------|---------------|
| Observability v1.0.0 | `ops/ai/audit/observability/v1.0.0/` |
| County Pilot v1.0.0 | `ops/county-pilot/benton-pilot-v1.0.0/` |
| Agent Sessions | `ops/agents/sessions/` |

---

## Verification Command (Single Source)

Run this command to verify all constitutions in one pass:

```bash
./ops/dev/tf.sh gate --full
```

Expected output:
- Gate: 11/11 PASS
- CI Tests: 13/13 PASS
- Breaker: 15/15 PASS

---

## Amendment Process

To amend any constitution:

1. Create RFC in `ops/governance/rfcs/`
2. Update relevant SpecLock document
3. Run all proof commands (must pass)
4. Human review required
5. Increment version, create new tag
6. Update this index

---

## Tag Verification

```bash
# List all constitution tags
git tag -l "v1.0.0-*-constitution*" | sort

# Verify tag exists on remote
git ls-remote --tags origin | grep v1.0.0 | awk '{print $2}' | sed 's|refs/tags/||' | sort
```

---

**Government. Transcended.** 🏛️

---
id: tf-pr-evidence-pack
name: PR Evidence Pack Builder
version: 1.0.0
ownerLane: governance
riskLevel: write-safe
triggers:
  - pre-pr
  - manual
  - seal-gate
inputs:
  - lane-audit-results
  - test-coverage
  - compliance-scan
  - context-pack
outputs:
  - evidence-pack.json
  - evidence-receipt.json
dependencies: []
tags: [evidence, pr, governance, seal-gate, fisma]
---

# PR Evidence Pack Builder

The keystone skill of the TerraFusion DX Spine. Produces deterministic, tamper-evident PR evidence bundles that aggregate all lane audit results into a single, verifiable artifact.

## What It Does

1. **Collects** lane audit results (dev, governance, ops, security, data)
2. **Aggregates** test coverage, compliance scans, and lint results
3. **Generates** a content-addressed evidence pack (CID-based)
4. **Produces** a tamper-evident receipt with SHA-256 integrity hash
5. **Updates** the Context Pack `evidencePack` section

## Evidence Pack Contents

| Artifact | Source | Required |
|----------|--------|----------|
| Test Results | `dotnet test` / `npm test` | Yes |
| Coverage Report | Istanbul / XPlat Code Coverage | Yes |
| Lint Results | ESLint / `dotnet format` | Yes |
| Compliance Scan | FISMA-HIGH / NIST-800-53 | Yes |
| Accessibility Audit | WCAG 2.1 AA / Section 508 | For UI changes |
| Security Scan | Dependency audit / SAST | Yes |
| Contract Drift | Golden snapshot validation | Yes |
| Context Pack | `.terrafusion/context/latest.json` | Yes |

## Usage

```bash
# Build evidence pack for current PR
tdc evidence build

# Validate existing evidence pack
tdc evidence validate

# View evidence pack summary
tdc evidence show

# Publish evidence to PR comment
tdc evidence publish
```

## SEAL Gate Integration

The evidence pack is consumed by the SEAL gate CI job. A PR cannot merge unless:

- All required artifacts are present
- Coverage meets threshold (97%+)
- No FISMA-HIGH compliance violations
- Contract drift is zero
- Evidence receipt integrity hash is valid

## Receipt Format

```json
{
  "version": "1.0",
  "cid": "bafybeig...",
  "generatedAt": "2026-02-13T00:00:00Z",
  "generator": "tdc",
  "integrityHash": "sha256:abc123...",
  "artifacts": { ... },
  "verdict": "pass"
}
```

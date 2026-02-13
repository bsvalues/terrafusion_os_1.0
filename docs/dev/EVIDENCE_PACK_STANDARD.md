# TerraFusion Evidence Pack Standard

> Version 1.0 | DX Spine §7 | FISMA-HIGH Governance

## Overview

The Evidence Pack is the atomic unit of PR governance in TerraFusion OS. Every pull request that modifies source code must produce a deterministic, content-addressed evidence bundle that the SEAL gate validates before merge.

## Architecture

```
PR Branch
  ├── Code Changes
  ├── Tests Run
  ├── Lint Pass
  ├── Compliance Scan
  └── Evidence Pack Builder
        ├── Collects all lane audit results
        ├── Generates content-addressed bundle (CID)
        ├── Produces tamper-evident receipt (SHA-256)
        └── Updates Context Pack
              └── SEAL Gate validates → Merge allowed
```

## Evidence Pack Structure

### Pack (`latest-pack.json`)

| Field | Type | Description |
|-------|------|-------------|
| `cid` | string | Content Identifier (SHA-256 based) |
| `generatedAt` | ISO 8601 | Generation timestamp |
| `generator` | enum | `tdc`, `ci`, `manual` |
| `branch` | string | Git branch name |
| `pr` | int\|null | Pull request number |
| `artifacts` | object | Collected audit results |
| `summary` | object | Pass/fail verdict |

### Receipt (`latest-receipt.json`)

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Always `1.0` |
| `cid` | string | Matches pack CID |
| `generatedAt` | ISO 8601 | Generation timestamp |
| `generator` | string | Tool that generated the pack |
| `integrityHash` | string | `sha256:<hex>` of pack contents |
| `verdict` | enum | `pass` or `fail` |

### Artifacts

| Artifact | Required | Pass Criteria |
|----------|----------|---------------|
| Test Results | Yes | `failed === 0` |
| Coverage | Yes | `meetsThreshold === true` (97%+) |
| Lint | Yes | `clean === true` |
| FISMA Compliance | Yes | `fismaHigh === true` |
| Accessibility | UI changes | `wcag21AA === true` |
| Security | Yes | `critical === 0 && high === 0` |
| Contract Drift | Yes | `zeroDrift === true` |

## Commands

```bash
# Build evidence pack
tdc evidence build

# Build with specific lanes
tdc evidence build --lanes dev,governance,security

# Build for specific PR
tdc evidence build --pr 315

# Validate existing pack
tdc evidence validate

# Show pack summary
tdc evidence show

# JSON output (for CI)
tdc evidence build --json
```

## SEAL Gate Integration

The SEAL gate runs as a GitHub Actions workflow (`.github/workflows/seal-evidence-gate.yml`):

1. **evidence-pack** - Builds and uploads the evidence pack
2. **contract-drift** - Validates command contracts against golden snapshots
3. **skills-validation** - Validates all skills have required files
4. **seal-gate** - Downloads pack and checks verdict

A PR cannot merge unless the SEAL gate passes.

## Content Addressing

Evidence packs use content-based addressing (CID) for tamper detection:

1. Pack contents are serialized to JSON
2. SHA-256 hash is computed
3. CID is generated: `bafybei` + first 52 hex chars
4. Receipt stores integrity hash: `sha256:<full-hex>`

Tampering with any artifact invalidates the CID, and the receipt integrity hash will not match.

## File Locations

| File | Path |
|------|------|
| Evidence Pack | `.terrafusion/evidence/latest-pack.json` |
| Evidence Receipt | `.terrafusion/evidence/latest-receipt.json` |
| Context Pack | `.terrafusion/context/latest.json` |
| Skills Registry | `tools/dx/skills/registry.json` |
| Evidence Contract | `tools/dx/command-contracts/evidence.contract.json` |
| SEAL Gate Workflow | `.github/workflows/seal-evidence-gate.yml` |

## Governance Lanes

Evidence is collected from all five governance lanes:

| Lane | Artifacts | Owner |
|------|-----------|-------|
| `dev` | Tests, coverage, lint | Engineering |
| `governance` | Compliance, audit | Governance Officer |
| `ops` | Deployment, infrastructure | Operations |
| `security` | Vulnerability scan, SAST | Security Officer |
| `data` | Schema validation, migration | Data Engineer |

## Retention

Evidence packs are retained for:
- **CI artifacts**: 90 days (GitHub Actions)
- **Local packs**: Until overwritten by next build
- **Audit trail**: 7 years (FISMA requirement, in `.terrafusion/audit.log`)

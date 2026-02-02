# County Deployment Runbook

> **Document Version:** 4N51.1  
> **Last Updated:** 2026-02-01  
> **Status:** Production-Ready

This runbook provides step-by-step instructions for county operators to:
1. Deploy TerraFusion OS county kit
2. Generate accreditation evidence
3. File compliance documentation
4. Troubleshoot common issues

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Full Deployment Flow](#full-deployment-flow)
4. [Accreditation Packet](#accreditation-packet)
5. [Expected Outputs](#expected-outputs)
6. [Troubleshooting](#troubleshooting)
7. [Exit Codes](#exit-codes)

---

## Prerequisites

### System Requirements

| Component | Requirement |
|-----------|-------------|
| Node.js | v20.x or later |
| pnpm | v8.x or later |
| OS | Windows 10/11 or Linux (Ubuntu 22.04+) |
| Disk | 500MB free space |
| RAM | 4GB minimum |

### Installation Verification

```bash
# Verify Node.js
node --version  # Expected: v20.x.x

# Verify pnpm
pnpm --version  # Expected: 8.x.x

# Install dependencies (run once)
pnpm install --frozen-lockfile
```

---

## Quick Start

### One-Command Deployment

```bash
# Navigate to autonomy-viewer
cd tools/registry/autonomy-viewer

# Generate complete accreditation packet
pnpm run accreditation -- --profile county --out ./dist/accreditation
```

**Expected output:**
```
🏛️ Accreditation Packet Generated
==================================
Profile:      county
Output:       ./dist/accreditation
Generated:    2026-02-01T12:00:00.000Z

Evidence Bundle:
  📄 county-kit-summary.json
  📄 manifest.json
  📄 steps/bootstrap.json
  📄 steps/drills.json
  📄 steps/hints.json
  📄 steps/ops-status.json
  📄 steps/slo-gate.json

Manifest:
  Files:        6
  Total Size:   12.5 KB

Compliance Summary:
  Overall:      passed
  SLO Gate:     pass
  Drills:       3/3 passed
  Bootstrap:    ✅ Valid

Result: ✅ Accreditation Packet Complete
```

---

## Full Deployment Flow

### Step 1: Bootstrap Profile Validation

```bash
pnpm run bootstrap -- --profile county --json
```

**What it does:**
- Validates the county profile configuration
- Checks prerequisites (directories, runbooks, exercises)
- Reports any configuration errors

**Success criteria:**
- `"ok": true` in JSON output
- No errors in `errors` array

### Step 2: Run Drills

```bash
pnpm run drills -- --profile county --json
```

**What it does:**
- Executes county-specific drill sequence
- Runs COUNTY_PILOT and INCIDENT_DRILL exercises
- Produces drill report with timing data

**Success criteria:**
- `"overall": "passed"` in JSON output
- All exercises show `"status": "passed"`

### Step 3: Check Ops Status

```bash
pnpm run ops:status -- --profile county --json
```

**What it does:**
- Computes operational status snapshot
- Aggregates component health
- Reports overall system status

**Success criteria:**
- `"overallStatus": "healthy"` in output
- No critical errors

### Step 4: SLO Gate Enforcement

```bash
pnpm run slo:gate -- --budget drill-duration-ms --current 150 --ceiling 5000 --json
```

**What it does:**
- Enforces SLO budgets (drill duration, error counts)
- Fails if ceilings exceeded
- Warns if approaching thresholds (80%+)

**Success criteria:**
- `"gateStatus": "pass"` in JSON output
- No violations

### Step 5: Generate Accreditation Packet

```bash
pnpm run accreditation -- \
  --profile county \
  --out ./dist/accreditation \
  --county "Benton County" \
  --jurisdiction WA
```

**What it does:**
- Runs all previous steps
- Generates manifest with SHA256 hashes
- Produces compliance summary
- Creates ready-to-file evidence bundle

---

## Accreditation Packet

### Output Structure

```
dist/accreditation/
├── accreditation-packet.json    # Main evidence packet
├── manifest.json                 # File hashes (SHA256)
├── county-kit-summary.json       # Kit execution summary
└── steps/
    ├── bootstrap.json            # Profile validation
    ├── drills.json               # Drill execution
    ├── hints.json                # Next-step guidance
    ├── ops-status.json           # Operational status
    └── slo-gate.json             # SLO enforcement
```

### Manifest Format

The `manifest.json` contains SHA256 hashes for all evidence files:

```json
{
  "$schema": "terrafusion.autonomy.manifest.v1",
  "version": "4N51.1",
  "generatedAt": "2026-02-01T12:00:00.000Z",
  "profile": "county",
  "files": [
    {
      "path": "county-kit-summary.json",
      "sha256": "a1b2c3...",
      "sizeBytes": 1234
    }
  ],
  "totalBytes": 12500,
  "fileCount": 6
}
```

### Compliance Summary

The accreditation packet includes a compliance summary:

| Field | Description |
|-------|-------------|
| `overallStatus` | `passed`, `failed`, or `partial` |
| `sloGateStatus` | `pass`, `warn`, `fail`, or `unknown` |
| `drillsCompleted` | Number of drills executed |
| `drillsPassed` | Number of drills passed |
| `bootstrapValid` | Profile validation passed |

---

## Expected Outputs

### Successful Deployment

| Indicator | Expected Value |
|-----------|----------------|
| Exit code | 0 |
| `result.ok` | `true` |
| `complianceSummary.overallStatus` | `"passed"` |
| `complianceSummary.sloGateStatus` | `"pass"` |
| Manifest file count | 6+ files |

### Warning State

| Indicator | Expected Value |
|-----------|----------------|
| Exit code | 1 |
| `result.ok` | `true` |
| `complianceSummary.sloGateStatus` | `"warn"` |

### Failure State

| Indicator | Expected Value |
|-----------|----------------|
| Exit code | 1 or 2 |
| `result.ok` | `false` |
| `result.errorCode` | Error identifier |
| `result.errorMessage` | Human-readable error |

---

## Troubleshooting

### Common Issues

#### 1. Profile Not Found

```
Error: [COUNTY_KIT_MISSING_PROFILE] Profile name is required
```

**Solution:** Specify a valid profile with `--profile`:
```bash
pnpm run county-kit -- --profile county --out ./dist/kit
```

#### 2. Bootstrap Validation Failed

```
Error: [PREREQUISITE_FAILED] Directory not found: profiles
```

**Solution:** Ensure required directories exist:
```bash
# From autonomy-viewer directory
mkdir -p profiles runbooks exercises
```

#### 3. SLO Gate Failed

```
"gateStatus": "fail"
"violations": [{ "metric": "drill-duration-ms", "overage": 1000 }]
```

**Solution:** Investigate slow drills:
- Check system load during drill execution
- Review drill logs in `steps/drills.json`
- Consider raising SLO ceiling if justified

#### 4. Permission Denied

```
Error: EACCES: permission denied, mkdir './dist'
```

**Solution:** Run with appropriate permissions:
```bash
# Linux
sudo pnpm run county-kit -- --profile county --out ./dist/kit

# Or fix directory permissions
chmod 755 ./dist
```

### Debug Mode

For detailed diagnostics, use JSON output:

```bash
pnpm run accreditation -- --profile county --out ./dist/accreditation --json 2>&1 | tee debug.json
```

---

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Proceed with accreditation filing |
| 1 | Warning or partial failure | Review warnings, may still be acceptable |
| 2 | Critical failure | Investigate errors, do not file |

---

## Support

For issues not covered in this runbook:

1. Check the [TerraFusion OS documentation](./SUSTAINMENT.md)
2. Review [agent governance rules](./AGENTS.md)
3. Contact TerraFusion support

---

## Appendix: Command Reference

| Command | Description |
|---------|-------------|
| `pnpm run bootstrap -- --profile X` | Validate profile |
| `pnpm run drills -- --profile X` | Run drill sequence |
| `pnpm run hints -- --json` | Get next-step hints |
| `pnpm run ops:status -- --profile X` | Operational status |
| `pnpm run slo:gate -- --budget B --current V --ceiling C` | SLO enforcement |
| `pnpm run county-kit -- --profile X --out DIR` | Full kit flow |
| `pnpm run accreditation -- --profile X --out DIR` | Accreditation packet |
| `pnpm run accreditation:verify -- --dir DIR` | Verify accreditation packet |

---

## Appendix: Verification Command

After receiving an accreditation packet (or before filing with regulators), verify the packet's integrity:

```bash
# Verify an accreditation packet
pnpm run accreditation:verify -- --dir ./dist/accreditation

# With verbose output (shows hash details on mismatch)
pnpm run accreditation:verify -- --dir ./dist/accreditation --verbose

# Output as JSON
pnpm run accreditation:verify -- --dir ./dist/accreditation --json
```

**Expected output (success):**
```
═══════════════════════════════════════════════════════════
  TerraFusion Accreditation Packet Verification
═══════════════════════════════════════════════════════════

  Packet Directory: ./dist/accreditation
  Verified At:      2026-02-01T12:00:00.000Z
  Files Verified:   7

  ✅ VERIFICATION PASSED

  All files match their recorded hashes.
  All required fields present.
  Schema compliance verified.
═══════════════════════════════════════════════════════════
```

**What verification checks:**

| Check | Description |
|-------|-------------|
| Directory exists | Packet directory must exist |
| Manifest present | `manifest.json` must exist |
| Packet present | `accreditation-packet.json` must exist |
| Required files | All files listed in contract must exist |
| SHA256 hashes | All file hashes match manifest |
| Required fields | All required packet fields present |
| Schema version | Version must be supported |

**Failure indicates:**
- File tampering (hash mismatch)
- Missing evidence files
- Corrupted structure
- Schema non-compliance

---

## Appendix: Schema Upgrade Policy

The accreditation system uses semantic versioning for schema compatibility.

### Reference Lock

The contract is defined in `ACCREDITATION_REFERENCE.lock.json`, which pins:
- Required files and fields
- Determinism rules (sorted keys, normalized paths, LF line endings)
- Supported schema versions

### Minor Version Bumps (e.g., `4N51.1` → `4N51.2`)

**Allowed:**
- Add optional fields to packet or manifest
- Add new evidence files to `steps/`
- Extend `supportedVersions` array

**Forbidden:**
- Remove required fields
- Change SHA256 algorithm
- Change determinism rules

**Compatibility:** Backwards-compatible (old verifiers accept new packets)

### Major Version Bumps (e.g., `4N51.x` → `4N52.0`)

**Allowed:**
- Add new required fields
- Change file structure
- Update determinism rules

**Requirements:**
- New reference packet must be generated
- Old verifier must accept packets from prior major version
- RC release required before GA

**Compatibility:** Breaking (requires migration)

### CI Enforcement

The `accreditation-compat.yml` workflow:
1. Generates fresh packets on Ubuntu and Windows
2. Verifies cross-OS portability
3. Validates against reference lock
4. Blocks PRs that break compat

---

*Government. Transcended.*

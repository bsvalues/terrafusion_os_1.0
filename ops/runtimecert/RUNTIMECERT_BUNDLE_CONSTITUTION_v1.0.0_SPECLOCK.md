# RuntimeCert Bundle Constitution v1.0.0

> **Status**: SPECLOCK FROZEN  
> **Version**: 1.0.0  
> **Date**: 2025-12-18  
> **Scope**: Release proof bundle generation and verification

## 1. Purpose

Define a single canonical, machine-verifiable release proof bundle that unifies Gate + Agent + Deploy + Marketplace proofs into one immutable artifact with deterministic verification.

This constitution enables:
- CI/CD pipelines to produce auditable release artifacts
- Compliance teams to verify release integrity offline
- Disaster recovery with cryptographically verifiable proof chains
- Cross-subsystem proof aggregation in a single bundle

---

## 2. Command Surface

### 2.1 Bundle Generation

```bash
tf release bundle --out <dir> [--mode dev|techsupport|prod] [--include-sbom] [--force]
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--out` | YES | - | Output directory path (must not exist unless --force) |
| `--mode` | NO | `dev` | Environment mode (dev, techsupport, prod) |
| `--include-sbom` | NO | false | Generate SBOM (requires sbom generator) |
| `--force` | NO | false | Overwrite existing directory |
| `--ci` | NO | false | JSON-only output to stdout |

**Exit Codes**:
- `0`: Bundle created successfully
- `1`: Bundle creation failed (proof collection failure, checksum generation failure)
- `2`: Invalid invocation (missing --out, unknown flags, invalid mode)

### 2.2 Bundle Verification

```bash
tf release verify --bundle <dir> [--ci]
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--bundle` | YES | - | Path to bundle directory |
| `--ci` | NO | false | JSON-only output to stdout |

**Exit Codes**:
- `0`: Verification passed (all proofs valid, checksums match, no failures)
- `1`: Verification failed (missing files, invalid JSON, checksum mismatch, proof status fail/error)
- `2`: Invalid invocation (missing --bundle, unknown flags, path not directory)

---

## 3. Bundle Directory Layout

```
<out>/
├── manifest.json           # Bundle metadata + proof inventory
├── sbom.json               # Software bill of materials (optional)
├── proofs/
│   ├── gate.json           # Gate check proof
│   ├── agent.json          # Agent session status proof
│   ├── deploy.json         # Deploy status proof
│   └── marketplace.json    # Marketplace status proof
├── checksums.sha256        # SHA-256 checksums for all files
└── bundle_meta.json        # Generation timestamp + tool versions
```

### 3.1 File Requirements

| File | Required | Description |
|------|----------|-------------|
| `manifest.json` | YES | Bundle schema version + proof inventory |
| `sbom.json` | CONDITIONAL | Required only if `--include-sbom` specified |
| `proofs/gate.json` | YES | Output from `tf gate --ci` |
| `proofs/agent.json` | YES | Agent subsystem proof |
| `proofs/deploy.json` | YES | Deploy subsystem proof |
| `proofs/marketplace.json` | YES | Marketplace subsystem proof |
| `checksums.sha256` | YES | SHA-256 checksums |
| `bundle_meta.json` | YES | Generation metadata |

---

## 4. Proof Schema Requirements

### 4.1 Common Proof Fields (ALL proofs MUST include)

```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T21:33:27Z",
  "status": "pass|fail|warn|error",
  "summary": { ... },
  "source": "gate|agent|deploy|marketplace"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | YES | Schema version (semver) |
| `timestamp` | string | YES | ISO 8601 UTC timestamp |
| `status` | enum | YES | `pass`, `fail`, `warn`, `error` |
| `summary` | object | YES | Subsystem-specific summary |
| `source` | string | YES | Subsystem identifier |

### 4.2 Status Enum Semantics

| Status | Meaning | Bundle Verify Behavior |
|--------|---------|------------------------|
| `pass` | All checks passed | Continue verification |
| `warn` | Non-blocking warnings | Continue verification (with warning) |
| `fail` | Blocking failure | Verification FAILS |
| `error` | Subsystem error | Verification FAILS |

### 4.3 Subsystem-Specific Proofs

**gate.json** (from `tf gate --ci`):
```json
{
  "version": "1.0.0",
  "timestamp": "...",
  "status": "pass",
  "source": "gate",
  "summary": {
    "total": 11,
    "passed": 11,
    "failed": 0,
    "warnings": 0,
    "skipped": 0
  },
  "checks": [...]
}
```

**agent.json** (from `tf agent check --ci`):
```json
{
  "version": "1.0.0",
  "timestamp": "...",
  "status": "pass",
  "source": "agent",
  "summary": {
    "active_sessions": 0,
    "stale_sessions": 0,
    "missing_artifacts": []
  }
}
```

**deploy.json** (synthetic proof):
```json
{
  "version": "1.0.0",
  "timestamp": "...",
  "status": "pass",
  "source": "deploy",
  "summary": {
    "environments_configured": ["dev", "techsupport", "prod"],
    "gate_enforcement": true,
    "promotion_chain_valid": true
  }
}
```

**marketplace.json** (from `tf marketplace list --ci`):
```json
{
  "version": "1.0.0",
  "timestamp": "...",
  "status": "pass",
  "source": "marketplace",
  "summary": {
    "plugins_installed": 0,
    "plugins_enabled": 0,
    "quarantined": 0,
    "registry_valid": true
  }
}
```

---

## 5. Manifest Schema

```json
{
  "schema_version": "1.0.0",
  "bundle_id": "<uuid>",
  "created_at": "2025-12-18T21:33:27Z",
  "mode": "dev|techsupport|prod",
  "proofs": {
    "gate": { "file": "proofs/gate.json", "status": "pass" },
    "agent": { "file": "proofs/agent.json", "status": "pass" },
    "deploy": { "file": "proofs/deploy.json", "status": "pass" },
    "marketplace": { "file": "proofs/marketplace.json", "status": "pass" }
  },
  "sbom_included": false,
  "overall_status": "pass|fail|warn|error"
}
```

---

## 6. Determinism Rules

### 6.1 Checksum Stability

**checksums.sha256 MUST**:
- Cover ALL files EXCEPT `bundle_meta.json` (which contains variable timestamp)
- Use lexicographic file ordering
- Use lowercase hex SHA-256
- Use relative paths from bundle root

**Format**:
```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  manifest.json
a1b2c3d4e5f6...  proofs/agent.json
a1b2c3d4e5f6...  proofs/deploy.json
a1b2c3d4e5f6...  proofs/gate.json
a1b2c3d4e5f6...  proofs/marketplace.json
```

### 6.2 JSON Stability

All JSON output MUST:
- Use sorted keys (lexicographic)
- Use 2-space indentation
- Use Unix line endings (LF)
- NOT include trailing commas

### 6.3 Allowed Variance

Only `bundle_meta.json` may contain timestamps that vary between runs:
```json
{
  "generated_at": "2025-12-18T21:33:27Z",
  "tf_version": "1.0.0",
  "tf_sha": "abc123",
  "hostname": "build-agent-01"
}
```

---

## 7. Verification Algorithm

```
VERIFY(bundle_dir):
  1. Assert bundle_dir exists and is directory → else exit 2
  2. Assert manifest.json exists → else exit 1
  3. Assert checksums.sha256 exists → else exit 1
  4. Assert proofs/ directory exists → else exit 1
  
  5. For each required proof (gate, agent, deploy, marketplace):
     a. Assert proofs/{name}.json exists → else exit 1
     b. Parse JSON → on error exit 1
     c. Assert required fields present → else exit 1
     d. If status in [fail, error] → mark verification failed
  
  6. Run: cd bundle_dir && sha256sum -c checksums.sha256
     → on mismatch exit 1
  
  7. If any proof status is fail/error → exit 1
  8. Otherwise → exit 0
```

---

## 8. CI JSON Output Schema

### 8.1 Bundle Creation (--ci)

```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T21:33:27Z",
  "command": "release bundle",
  "status": "success|error",
  "bundle_path": "/path/to/bundle",
  "manifest": { ... },
  "error": null | { "code": "...", "message": "..." }
}
```

### 8.2 Bundle Verification (--ci)

```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T21:33:27Z",
  "command": "release verify",
  "status": "pass|fail",
  "bundle_path": "/path/to/bundle",
  "proofs": {
    "gate": { "status": "pass", "valid": true },
    "agent": { "status": "pass", "valid": true },
    "deploy": { "status": "pass", "valid": true },
    "marketplace": { "status": "pass", "valid": true }
  },
  "checksums_valid": true,
  "error": null | { "code": "...", "message": "..." }
}
```

### 8.3 Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INVOCATION` | Missing required flags, unknown flags |
| `BUNDLE_EXISTS` | Output directory exists (without --force) |
| `PROOF_COLLECTION_FAILED` | Failed to collect one or more proofs |
| `SBOM_GENERATOR_MISSING` | --include-sbom but no generator available |
| `BUNDLE_NOT_FOUND` | Verify target does not exist |
| `MANIFEST_MISSING` | manifest.json not found |
| `PROOF_MISSING` | Required proof file missing |
| `PROOF_INVALID_JSON` | Proof file is not valid JSON |
| `PROOF_MISSING_FIELDS` | Proof missing required fields |
| `CHECKSUM_MISMATCH` | Checksum verification failed |
| `PROOF_STATUS_FAIL` | One or more proofs have fail/error status |

---

## 9. Invariants (Non-Negotiable)

| ID | Invariant | Enforcement |
|----|-----------|-------------|
| R1 | `--out` required for bundle | Exit 2 if missing |
| R2 | `--bundle` required for verify | Exit 2 if missing |
| R3 | All 4 proofs required in bundle | Exit 1 if any missing |
| R4 | All proofs must be valid JSON | Exit 1 on parse error |
| R5 | All proofs must have required fields | Exit 1 if missing |
| R6 | checksums.sha256 must verify | Exit 1 on mismatch |
| R7 | fail/error proof status fails verify | Exit 1 |
| R8 | --ci outputs JSON only, no ANSI | Test enforced |
| R9 | Bundle without --force fails if exists | Exit 1 |
| R10 | Unknown flags exit 2 | Fail-fast on bad input |

---

## 10. Amendment Process

Changes to this constitution require:
1. SpecLock document update
2. RFC with evidence of necessity
3. All governance tests GREEN
4. Breaker review pass
5. Constitutional version bump tag

**Current Tag**: `v1.0.0-runtimecert-bundle-constitution`

---

## AGENT NOTES

### NOTES_NOW
- SpecLock frozen, ready for TESTPLAN phase

### RISKS_FOUND
- `tf agent check` lacks `--ci` mode (must add or create synthetic proof)
- `tf deploy` lacks status/check command (must create synthetic proof)
- `tf marketplace list --ci` may not exist (must verify or add)

### DECISIONS
- Use synthetic proofs for agent/deploy/marketplace if native --ci not available
- bundle_meta.json excluded from checksums to allow timestamp variance
- SBOM generation is conditional (fail-closed if requested but unavailable)

### TODO_NEXT_SESSION
- Create test_runtimecert_bundle_governance.sh with 18+ tests
- Establish RED baseline
- Implement cmd_release dispatcher in tf.sh

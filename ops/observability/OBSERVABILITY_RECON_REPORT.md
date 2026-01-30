# Observability Recon Report

> **Report ID**: OBS-RECON-2025-12-23  
> **Phase**: 0 (Reconnaissance)  
> **Mode**: Evidence-Only  
> **Scope**: Map existing sealed signals for read-only observability

---

## 1. Executive Summary

This report documents all **existing, sealed CI/JSON signals** that can be legally observed by a read-only observability layer. No new authority is proposed—only composition of existing outputs.

### Key Findings

| Metric | Value |
|--------|-------|
| Sealed CI commands discovered | **12** |
| Proof emitters available | **4** |
| Unique schema patterns | **3** |
| Gaps identified | **2** |

---

## 2. Sealed Signal Inventory

### 2.1 Gate & Constitution Signals

| Command | CI Flag | Schema Version | Status Field | Output Type |
|---------|---------|----------------|--------------|-------------|
| `tf gate --ci` | ✅ | 1.0.0 | `status: pass\|fail` | Invariant checks |
| `tf doctor --json` | ✅ | - | N/A | System health |

**Gate Schema**:
```json
{
  "version": "str",
  "timestamp": "str",
  "status": "str",           // pass|fail
  "summary": {
    "total": "int",
    "passed": "int",
    "failed": "int",
    "warnings": "int",
    "skipped": "int"
  },
  "checks": [
    {
      "id": "int",
      "name": "str",
      "status": "str",       // pass|fail|warn|skip
      "message": "str"
    }
  ]
}
```

**Doctor Schema**:
```json
{
  "timestamp": "str",
  "mode": "str",             // k8s|compose
  "wsl": { "memory_cap": "str", "memory_used_gb": "int", "memory_total_gb": "int" },
  "docker": { "disk_usage": "str" },
  "kubernetes": { "available": "bool", "namespace": "str", "pods": "list" },
  "ai_lab": { "running": "bool", "localhost_only": "bool" },
  "rag": { "indexed_files": "int", "last_ingest": "str" }
}
```

---

### 2.2 Proof Emitters (Subsystem Proofs)

| Command | Subsystem | Schema Version | Checks |
|---------|-----------|----------------|--------|
| `tf agent proof --ci` | agent | 1.0.0 | 5 |
| `tf deploy proof --ci` | deploy | 1.0.0 | 6 |
| `tf marketplace proof --ci` | marketplace | 1.0.0 | 5 |
| (gate proof) | gate | 1.0.0 | 11 |

**Unified Proof Schema** (all 4 subsystems):
```json
{
  "version": "str",          // Always "1.0.0"
  "timestamp": "str",        // ISO8601 UTC
  "subsystem": "str",        // agent|deploy|marketplace|gate
  "status": "str",           // pass|fail|warn
  "summary": {
    "total": "int",
    "passed": "int",
    "failed": "int",
    "warnings": "int",
    "skipped": "int"
  },
  "checks": [
    {
      "id": "int",
      "name": "str",
      "status": "str",
      "message": "str",
      "details": "object|null"
    }
  ],
  "error": "object|null"
}
```

---

### 2.3 Release Operations Signals

| Command | CI Flag | Schema Version | Key Fields |
|---------|---------|----------------|------------|
| `tf release status --bundle <path> --ci` | ✅ | 1.0.0 | integrity, latest_receipt |
| `tf release audit --bundle <path> --ci` | ✅ | 1.0.0 | sections (integrity, chain, policy) |
| `tf release prepare --out <dir> --ci` | ✅ | 1.0.0 | steps array |
| `tf release deploy --bundle <path> ... --ci` | ✅ | 1.0.0 | steps array |
| `tf release promote --bundle <path> ... --ci` | ✅ | 1.0.0 | steps, policy |

**Release Status Schema**:
```json
{
  "version": "str",
  "timestamp": "str",
  "status": "str",           // healthy|unhealthy
  "operation": "str",        // status
  "bundle": "str",
  "integrity": { "status": "str" },
  "latest_receipt": "object|null"
}
```

**Release Audit Schema**:
```json
{
  "version": "str",
  "timestamp": "str",
  "status": "str",           // pass|fail
  "operation": "str",        // audit
  "bundle": "str",
  "sections": {
    "integrity": { "status": "str", "summary": "str" },
    "chain": { "status": "str", "count": "int", "environments": "list" },
    "policy": { "status": "str", "summary": "str" }
  },
  "overall": {
    "pass_count": "int",
    "fail_count": "int",
    "warn_count": "int"
  }
}
```

---

### 2.4 Deploy Policy Signals

| Command | CI Flag | Schema Version | Key Fields |
|---------|---------|----------------|------------|
| `tf deploy policy --bundle <path> --ci` | ✅ | 1.3.0 | policy, chain |
| `tf deploy history --bundle <path> --ci` | ✅ | 1.0.0 | chain, total |

**Deploy Policy Schema**:
```json
{
  "version": "str",
  "timestamp": "str",
  "operation": "str",        // policy
  "bundle": "str",
  "status": "str",           // pass|fail
  "policy": {
    "chain_required": "bool",
    "chain_present": "bool",
    "max_age": "int|null",
    "now_epoch": "int",
    "freshness_check": "str"
  },
  "error": "object|null"
}
```

**Deploy History Schema**:
```json
{
  "version": "str",
  "timestamp": "str",
  "status": "str",
  "operation": "str",        // history
  "bundle": "str",
  "chain": [
    {
      "type": "str",         // apply|promote
      "timestamp": "str",
      "environment": "str",
      "status": "str"
    }
  ],
  "total": "int"
}
```

---

### 2.5 Agent & Session Signals

| Command | CI Flag | Output Type |
|---------|---------|-------------|
| `tf agent status` | ❌ (text) | Session list |
| `tf agent telemetry` | ❌ (text) | Metrics summary |
| `tf agent proof --ci` | ✅ | Proof JSON |

**Gap**: `tf agent status` and `tf agent telemetry` lack `--ci` mode.

---

## 3. Identified Gaps

### GAP-001: Agent Status Lacks --ci Mode

**Current**: `tf agent status` outputs formatted text only  
**Impact**: Cannot programmatically observe active sessions  
**Recommendation**: Add `--ci` flag to emit JSON

### GAP-002: Agent Telemetry Lacks --ci Mode

**Current**: `tf agent telemetry` outputs formatted text only  
**Impact**: Cannot aggregate protocol adoption metrics  
**Recommendation**: Add `--ci` flag to emit JSON

---

## 4. Schema Consistency Analysis

### 4.1 Common Fields (All CI Outputs)

| Field | Type | Presence | Notes |
|-------|------|----------|-------|
| `version` | string | 100% | Schema version |
| `timestamp` | string | 100% | ISO8601 UTC |
| `status` | string | 100% | pass\|fail\|warn\|healthy\|unhealthy |

### 4.2 Exit Code Semantics

| Exit Code | Meaning | Observable |
|-----------|---------|------------|
| 0 | Success | ✅ |
| 1 | Operation failure | ✅ |
| 2 | Invalid invocation | ✅ |

### 4.3 Error Structure (When Present)

```json
{
  "error": {
    "code": "str",           // e.g., "GATE_FAILED", "MISSING_BUNDLE"
    "message": "str"
  }
}
```

---

## 5. Observability Surface Map

### 5.1 Read-Only Aggregatable Signals

| Signal Category | Sources | Aggregation |
|-----------------|---------|-------------|
| **System Health** | gate --ci, doctor --json | Real-time |
| **Subsystem Proofs** | agent/deploy/marketplace proof --ci | On-demand |
| **Bundle Integrity** | release status/audit --ci | Per-bundle |
| **Policy Compliance** | deploy policy --ci | Per-bundle |
| **Receipt Chain** | deploy history --ci | Per-bundle |

### 5.2 Proposed Observe Commands (Composition Only)

| Command | Composes | Purpose |
|---------|----------|---------|
| `tf observe health --ci` | gate --ci + doctor --json | System health snapshot |
| `tf observe proofs --ci` | all proof --ci commands | Subsystem proof summary |
| `tf observe bundle --bundle <path> --ci` | status + audit + policy | Bundle compliance |
| `tf observe chain --bundle <path> --ci` | history --ci | Receipt chain |
| `tf observe summary --ci` | All of the above | Executive dashboard |

---

## 6. Security Considerations

### 6.1 Read-Only Guarantees

| Guarantee | Enforcement |
|-----------|-------------|
| No mutations | Composition of existing read-only commands |
| No new authority | No new flags beyond --ci |
| No secrets exposure | Existing commands already sanitized |
| No PII leakage | No user data in outputs |

### 6.2 Attack Surface

| Vector | Mitigation |
|--------|------------|
| Path traversal | Existing bundle path validation |
| Flag smuggling | Whitelist-only flag pass-through |
| Injection | No shell interpolation of observe args |

---

## 7. Recommendations for Phase 1 (SpecLock)

### 7.1 Core Invariants to Seal

1. **Read-only by construction**: Observe commands MUST NOT modify state
2. **Composition only**: Observe MUST compose sealed commands, not implement new logic
3. **CI JSON only**: All observe outputs MUST be valid JSON, ANSI-free
4. **Deterministic**: Same inputs MUST produce same outputs
5. **Time-bounded**: Queries MUST have bounded execution time
6. **No secrets**: Outputs MUST NOT contain credentials or PII

### 7.2 Gap Remediation (Optional, Low Priority)

- Add `--ci` to `tf agent status`
- Add `--ci` to `tf agent telemetry`

These are **nice-to-have** but not blockers for Phase 1.

---

## 8. Conclusion

The existing sealed command surface provides **sufficient signals** for a comprehensive read-only observability layer. The proposed `tf observe *` commands will compose existing outputs without adding new authority.

**Recon Status**: ✅ **COMPLETE**

**Next Phase**: Phase 1 — SpecLock creation

---

**Prepared by**: AI Agent (GitHub Copilot)  
**Recon Timestamp**: 2025-12-23T18:00:00Z  
**Protocol**: Evidence-Only

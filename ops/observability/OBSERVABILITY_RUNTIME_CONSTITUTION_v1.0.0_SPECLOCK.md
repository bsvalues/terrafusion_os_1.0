# Observability Runtime Constitution v1.0.0

> **Status**: 🔒 SPECLOCK  
> **Version**: 1.0.0  
> **Effective Date**: 2025-12-23  
> **Scope**: Read-only observability layer for TerraFusion Runtime  
> **Authority**: Composes existing sealed commands only — NO NEW AUTHORITY

---

## Preamble

This constitution establishes the **read-only observability layer** for TerraFusion OS. The `tf observe *` command family exists solely to **compose** existing sealed CI outputs into aggregated views. It introduces **zero new authority** and **cannot modify state**.

---

## Article I — Foundational Invariants

### Section 1.1 — Read-Only by Construction

```
INVARIANT: Observe commands SHALL NOT:
  - Modify files on disk
  - Create new resources
  - Delete existing resources
  - Send network requests beyond localhost
  - Execute arbitrary code
  - Fork subprocesses other than sealed commands
```

### Section 1.2 — Composition Only

```
INVARIANT: Observe commands SHALL ONLY:
  - Execute sealed commands from RELEASE_PLAYBOOKS.md
  - Parse their JSON outputs
  - Aggregate/transform data
  - Emit aggregated JSON
```

**Sealed Command Whitelist** (exhaustive):
| Command | Authority |
|---------|-----------|
| `tf gate --ci` | Read constitution checks |
| `tf doctor --json` | Read system health |
| `tf agent proof --ci` | Read agent proof |
| `tf deploy proof --ci` | Read deploy proof |
| `tf marketplace proof --ci` | Read marketplace proof |
| `tf release status --bundle <path> --ci` | Read bundle status |
| `tf release audit --bundle <path> --ci` | Read bundle audit |
| `tf deploy policy --bundle <path> --ci` | Read deploy policy |
| `tf deploy history --bundle <path> --ci` | Read deploy history |

### Section 1.3 — CI JSON Only

```
INVARIANT: All observe outputs SHALL:
  - Be valid JSON (parseable by `jq .`)
  - Contain no ANSI escape sequences
  - Contain no terminal control codes
  - Be deterministic given same inputs
```

### Section 1.4 — No New Flags

```
INVARIANT: Observe commands SHALL NOT:
  - Introduce flags that modify sealed command behavior
  - Pass user-controlled strings to shell
  - Allow arbitrary flag injection
  
ONLY PERMITTED FLAGS:
  --ci      → Force JSON output
  --bundle  → Path to RuntimeCert bundle
  --help    → Show usage
```

### Section 1.5 — Time-Bounded Execution

```
INVARIANT: Observe commands SHALL:
  - Complete within 30 seconds
  - Timeout and return error JSON on breach
  - Never hang indefinitely
```

### Section 1.6 — No Secrets

```
INVARIANT: Observe outputs SHALL NOT contain:
  - API keys, tokens, or credentials
  - Connection strings
  - Private keys or certificates
  - PII (names, SSNs, addresses)
  - County-specific sensitive data
```

---

## Article II — Command Specification

### Section 2.1 — Command Family

```
tf observe <subcommand> [options]

SUBCOMMANDS:
  health    → Aggregate system health (gate + doctor)
  proofs    → Aggregate subsystem proofs
  bundle    → Bundle compliance summary
  chain     → Receipt chain view
  summary   → Executive dashboard (all of above)
```

### Section 2.2 — `tf observe health --ci`

**Purpose**: Real-time system health snapshot

**Composes**:
- `tf gate --ci`
- `tf doctor --json`

**Output Schema**:
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "command": "observe health",
  "status": "pass|fail",
  "components": {
    "gate": {
      "status": "pass|fail",
      "checks": { "total": N, "passed": N, "failed": N }
    },
    "doctor": {
      "mode": "k8s|compose",
      "docker": { "status": "healthy|unhealthy" },
      "kubernetes": { "available": true|false },
      "ai_lab": { "running": true|false }
    }
  }
}
```

**Exit Codes**:
- `0`: All components healthy
- `1`: Any component unhealthy

### Section 2.3 — `tf observe proofs --ci`

**Purpose**: Aggregate all subsystem proofs

**Composes**:
- `tf agent proof --ci`
- `tf deploy proof --ci`
- `tf marketplace proof --ci`

**Output Schema**:
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "command": "observe proofs",
  "status": "pass|fail|warn",
  "proofs": {
    "agent": { "status": "pass|fail|warn", "checks": N, "passed": N },
    "deploy": { "status": "pass|fail|warn", "checks": N, "passed": N },
    "marketplace": { "status": "pass|fail|warn", "checks": N, "passed": N }
  },
  "summary": {
    "total_checks": N,
    "total_passed": N,
    "total_failed": N,
    "total_warnings": N
  }
}
```

**Exit Codes**:
- `0`: All proofs pass
- `1`: Any proof fails

### Section 2.4 — `tf observe bundle --bundle <path> --ci`

**Purpose**: Bundle compliance summary

**Composes**:
- `tf release status --bundle <path> --ci`
- `tf release audit --bundle <path> --ci`
- `tf deploy policy --bundle <path> --ci`

**Output Schema**:
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "command": "observe bundle",
  "bundle": "<path>",
  "status": "pass|fail|warn",
  "sections": {
    "integrity": { "status": "pass|fail" },
    "audit": { "status": "pass|fail|warn", "pass": N, "fail": N, "warn": N },
    "policy": { "status": "pass|fail" }
  }
}
```

**Exit Codes**:
- `0`: Bundle compliant
- `1`: Bundle non-compliant

### Section 2.5 — `tf observe chain --bundle <path> --ci`

**Purpose**: Receipt chain visualization

**Composes**:
- `tf deploy history --bundle <path> --ci`

**Output Schema**:
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "command": "observe chain",
  "bundle": "<path>",
  "status": "pass|fail|warn",
  "chain": [
    {
      "step": 1,
      "type": "apply|promote",
      "environment": "dev|techsupport|prod",
      "timestamp": "<ISO8601>",
      "status": "pass|fail"
    }
  ],
  "total": N,
  "complete": true|false
}
```

**Exit Codes**:
- `0`: Chain valid
- `1`: Chain broken

### Section 2.6 — `tf observe summary --ci`

**Purpose**: Executive dashboard (all signals)

**Composes**: All of the above

**Output Schema**:
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "command": "observe summary",
  "status": "pass|fail|warn",
  "health": { "gate": "pass|fail", "doctor": "healthy|unhealthy" },
  "proofs": { "agent": "pass|fail", "deploy": "pass|fail", "marketplace": "pass|fail" },
  "bundle": {
    "available": true|false,
    "integrity": "pass|fail|n/a",
    "policy": "pass|fail|n/a"
  },
  "overall": {
    "score": "0.0-1.0",
    "grade": "A|B|C|D|F"
  }
}
```

**Exit Codes**:
- `0`: Grade A or B
- `1`: Grade C, D, or F

---

## Article III — Security Constraints

### Section 3.1 — Path Validation

```
CONSTRAINT: Bundle paths MUST:
  - Be absolute paths or relative to $PWD
  - Exist on disk
  - Contain manifest.json
  - NOT contain ".." traversal sequences
  - NOT be symlinks to sensitive directories
```

### Section 3.2 — Flag Sanitization

```
CONSTRAINT: All observe flags SHALL:
  - Be parsed by getopts/argparse (no eval)
  - NOT be interpolated into shell commands
  - NOT be passed to child processes verbatim
```

### Section 3.3 — Output Sanitization

```
CONSTRAINT: Before emitting JSON:
  - Strip any field matching: password|secret|key|token|credential
  - Validate no raw stack traces leak
  - Validate no file paths outside workspace
```

### Section 3.4 — Error Handling

```
CONSTRAINT: On any error:
  - Emit valid JSON with "status": "error"
  - Include error.code and error.message
  - Exit with code 1
  - NEVER emit partial/malformed JSON
```

---

## Article IV — Implementation Constraints

### Section 4.1 — Language

```
CONSTRAINT: Observe commands MUST be implemented in:
  - Bash (primary, for tf.sh integration)
  - OR Python 3.x (if complexity warrants)
  
NOT PERMITTED:
  - New compiled binaries
  - npm/node dependencies
  - External service calls
```

### Section 4.2 — Dependencies

```
CONSTRAINT: Observe commands MAY use:
  - jq (JSON parsing)
  - bash built-ins (printf, date, etc.)
  - Existing tf.sh functions
  
NOT PERMITTED:
  - New external dependencies
  - Network calls
  - Database connections
```

### Section 4.3 — Testing

```
CONSTRAINT: Every observe command MUST have:
  - Unit test: valid JSON output
  - Unit test: correct exit codes
  - Integration test: composition works
  - Security test: no mutation occurs
```

---

## Article V — Governance

### Section 5.1 — Amendment Process

```
PROCESS: To amend this constitution:
  1. Create RFC document in ops/observability/rfcs/
  2. Run test_observability_governance.sh (must pass)
  3. Gate review by human operator
  4. Merge with SpecLock update
  5. Increment version number
```

### Section 5.2 — Breaking Changes

```
CONSTRAINT: Breaking changes require:
  - Major version bump (e.g., 1.0.0 → 2.0.0)
  - Migration guide
  - 30-day deprecation notice
  - Human approval
```

### Section 5.3 — Sealed vs. Proposed

```
STATUS DEFINITIONS:
  🔒 SEALED    → Implemented, tested, frozen
  📝 PROPOSED  → Specified, not yet implemented
  ⚠️  DEPRECATED → Scheduled for removal
```

---

## Article VI — Version History

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-23 | 📝 PROPOSED | Initial specification |

---

## Appendix A — Command Quick Reference

```bash
# System health
tf observe health --ci

# Subsystem proofs
tf observe proofs --ci

# Bundle compliance
tf observe bundle --bundle ./bundle --ci

# Receipt chain
tf observe chain --bundle ./bundle --ci

# Executive summary
tf observe summary --ci
```

---

## Appendix B — Error Codes

| Code | Meaning |
|------|---------|
| OBS_SUCCESS | Operation completed successfully |
| OBS_GATE_FAIL | Gate checks failed |
| OBS_PROOF_FAIL | Proof check failed |
| OBS_BUNDLE_MISSING | Bundle path invalid |
| OBS_TIMEOUT | Execution exceeded 30s |
| OBS_INTERNAL | Internal error |

---

## Appendix C — Checklist for Implementers

- [ ] Read this constitution completely
- [ ] Implement in tf.sh or approved language
- [ ] Use only sealed commands from whitelist
- [ ] Emit valid JSON on all paths (success/error)
- [ ] Add unit tests for each command
- [ ] Add integration tests
- [ ] Add security tests (no mutation)
- [ ] Document in RELEASE_PLAYBOOKS.md
- [ ] Update version table

---

**🔒 SPECLOCK SEALED**

This document is the authoritative specification for the TerraFusion Observability layer. Any implementation that violates these invariants is non-compliant and MUST NOT be merged.

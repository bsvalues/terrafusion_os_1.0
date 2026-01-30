# Marketplace Execution Constitution v1.0.0 — SpecLock

> **Constitutional Anchor**: Runtime containment for third-party plugin execution  
> **Blast Radius**: Code execution, resource exhaustion, capability escalation  
> **Leverage**: Enables safe plugin runtime while maintaining government-grade security  
> **Dependency**: Marketplace Runtime Constitution v1.0.0 (Phase 1 - lifecycle governance)

---

## 1. Constitutional Scope

This constitution governs the **TerraFusion Marketplace Execution subsystem** — the mechanism for safely executing installed and enabled plugins with fail-closed capability enforcement, resource bounds, crash containment, and auditable logs.

**In Scope (Phase 2):**
- Plugin execution command: `tf marketplace run`
- Plugin termination command: `tf marketplace kill`
- Runtime capability enforcement (fail-closed)
- Resource limits (CPU timeout, memory bounds)
- Crash containment (plugin failure ≠ host failure)
- Execution audit logging (deterministic, tamper-evident)
- Runtime quarantine on policy violation

**Out of Scope (Phase 3+):**
- WASM runtime integration (using simulated harness v1)
- Inter-plugin communication (IPC)
- Hot-reload during execution
- Distributed plugin execution
- Plugin debugging/profiling tools

**Prerequisite:**
- Plugin MUST be installed (`tf marketplace install`)
- Plugin MUST be enabled (`tf marketplace enable`)
- Registry MUST show `enabled: true`

---

## 2. Execution Model: Simulated WASM Harness v1

Since no WASM runtime exists in the repository, Phase 2 implements a **Simulated WASM Harness** with strict fail-closed boundaries.

### 2.1 Harness Behavior

```
┌─────────────────────────────────────────────────────────────┐
│                    Simulated WASM Harness v1                │
├─────────────────────────────────────────────────────────────┤
│  Input:  plugin_id, entrypoint, capabilities, timeout       │
│  Output: exit_code, stdout (JSON), audit_log               │
│                                                             │
│  Execution Flow:                                            │
│  1. Validate plugin enabled in registry                     │
│  2. Validate entrypoint exists in manifest                  │
│  3. Validate capabilities against allowlist                 │
│  4. Start timeout watchdog                                  │
│  5. Execute in isolated subprocess with capability checks   │
│  6. Capture stdout/stderr                                   │
│  7. Write audit log                                         │
│  8. Return exit code (0=success, 1=policy/runtime, 2=invalid)│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Capability → Runtime Mapping (Fail-Closed)

| Capability | Runtime Permission | Simulated Behavior |
|------------|-------------------|-------------------|
| `ui.panel` | Read-only UI context | ALLOWED: returns mock UI context |
| `ui.command` | Trigger UI command | ALLOWED: returns command acknowledgement |
| `data.read` | Read property data | ALLOWED: returns mock data object |
| `data.write` | Write property data | ALLOWED: returns write confirmation |
| `gis.read` | Read GIS layers | ALLOWED: returns mock GIS data |
| `gis.render` | Render GIS overlay | ALLOWED: returns render confirmation |
| `net.*` | Network access | **DENIED**: Exit 1, policy violation |
| `fs.*` | Filesystem access | **DENIED**: Exit 1, policy violation |
| `proc.*` | Process spawn | **DENIED**: Exit 1, policy violation |
| `shell.*` | Shell execution | **DENIED**: Exit 1, policy violation |
| `exec.*` | Arbitrary execution | **DENIED**: Exit 1, policy violation |
| `*` (unknown) | Any other capability | **DENIED**: Exit 1, policy violation |

**Fail-Closed Principle**: Any capability not explicitly in the allowlist is DENIED.

### 2.3 Resource Limits

| Resource | Default | Flag Override | Enforcement |
|----------|---------|---------------|-------------|
| CPU Time | 30s | `--timeout <s>` | Hard kill (SIGKILL) |
| Memory | 128MB | N/A (v1 best-effort) | Advisory warning |
| Stdout | 1MB | N/A | Truncate with marker |
| Stderr | 256KB | N/A | Truncate with marker |

**Timeout Behavior:**
```bash
# Plugin exceeds timeout
tf marketplace run --plugin my-plugin --timeout 5
# Exit 1 + audit log: {"outcome": "timeout", "reason": "Exceeded 5s limit"}
```

---

## 3. Constitutional Invariants

These 7 invariants are **IMMUTABLE** without constitutional amendment:

### Invariant 1: Execution Requires Enabled Plugin (Exit 1)

**Only enabled plugins may execute.** Attempting to run a disabled or uninstalled plugin MUST fail.

```bash
# ❌ Plugin not installed
tf marketplace run --plugin nonexistent
# Exit 1: "Plugin not found in registry"

# ❌ Plugin installed but not enabled
tf marketplace run --plugin my-plugin  # enabled: false
# Exit 1: "Plugin not enabled. Run: tf marketplace enable --plugin my-plugin"

# ✅ Plugin installed and enabled
tf marketplace run --plugin my-plugin  # enabled: true
# Exit 0 (if execution succeeds)
```

**Test ID**: R1

### Invariant 2: Entrypoint Validation (Exit 2)

**Execution MUST specify a valid entrypoint declared in the plugin manifest.**

```bash
# ❌ Missing --entry flag
tf marketplace run --plugin my-plugin
# Exit 2: "Missing required --entry <entrypoint>"

# ❌ Invalid entrypoint (not in manifest)
tf marketplace run --plugin my-plugin --entry nonexistent
# Exit 2: "Entrypoint 'nonexistent' not declared in manifest"

# ✅ Valid entrypoint
tf marketplace run --plugin my-plugin --entry main
# Proceeds with execution
```

**Test ID**: R2

### Invariant 3: Capability Enforcement at Runtime (Exit 1)

**The harness MUST enforce capability restrictions during execution.**

If a plugin attempts to invoke a capability not in its declared allowlist:
- Execution MUST halt immediately
- Exit code MUST be 1
- Audit log MUST record the violation
- Plugin MUST be quarantined (marked in registry)

```bash
# Plugin declares capabilities: ["ui.panel", "data.read"]
# Plugin attempts to access: fs.write

tf marketplace run --plugin my-plugin --entry main
# Exit 1: "Capability violation: fs.write not in allowlist"
# Registry: plugin marked as quarantined
```

**Test ID**: R3

### Invariant 4: Timeout Enforcement (Exit 1)

**Execution MUST terminate after timeout expiration.**

```bash
# Default timeout (30s)
tf marketplace run --plugin slow-plugin --entry main
# After 30s: Exit 1 + "Timeout exceeded"

# Custom timeout
tf marketplace run --plugin slow-plugin --entry main --timeout 5
# After 5s: Exit 1 + "Timeout exceeded (5s)"
```

**Enforcement:**
- Start wallclock timer at execution begin
- SIGTERM at timeout
- SIGKILL at timeout + 5s if not terminated
- Exit code MUST be 1 (not 137/143)
- Audit log MUST record timeout

**Test ID**: R4

### Invariant 5: Crash Containment (Exit 1, Host Survives)

**Plugin crashes MUST NOT crash the host process.**

```bash
# Plugin crashes (segfault, panic, unhandled exception)
tf marketplace run --plugin crashy-plugin --entry main
# Exit 1: "Plugin execution failed: [crash reason]"
# Host process continues
# Registry unchanged (no quarantine for crashes, only policy violations)
```

**Guarantees:**
- Subprocess isolation: plugin runs in child process
- Exception handling: all plugin exceptions caught
- Resource cleanup: file handles, memory released
- State integrity: registry not corrupted

**Test ID**: R5

### Invariant 6: Deterministic Audit Logging

**Every execution MUST produce an audit log entry.**

**Audit Log Path:**
```
ops/marketplace/audit/{plugin_id}/{timestamp}.json
```

**Audit Log Schema:**
```json
{
  "version": "1.0.0",
  "plugin_id": "my-plugin",
  "plugin_version": "1.2.3",
  "entrypoint": "main",
  "capabilities_declared": ["ui.panel", "data.read"],
  "capabilities_invoked": ["ui.panel"],
  "started_at": "2025-12-18T19:30:00.000Z",
  "ended_at": "2025-12-18T19:30:02.500Z",
  "duration_ms": 2500,
  "timeout_limit_s": 30,
  "outcome": "success|timeout|crash|policy_violation|invalid",
  "exit_code": 0,
  "reason": null,
  "stdout_bytes": 1024,
  "stderr_bytes": 0,
  "memory_peak_mb": 45,
  "host_version": "1.0.0"
}
```

**Test ID**: R6

### Invariant 7: CI JSON Purity (--ci Flag)

**CI mode MUST produce machine-readable JSON output.**

```bash
# Human mode (default)
tf marketplace run --plugin my-plugin --entry main
# Output: Human-readable status messages

# CI mode
tf marketplace run --plugin my-plugin --entry main --ci
# Output: JSON only
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T19:30:02.500Z",
  "command": "marketplace run",
  "status": "success",
  "plugin_id": "my-plugin",
  "entrypoint": "main",
  "exit_code": 0,
  "audit_log": "ops/marketplace/audit/my-plugin/2025-12-18T19-30-00.json"
}
```

**Constraints:**
- stdout MUST be valid JSON (parseable by `jq`)
- NO ANSI escape codes
- stderr MAY contain diagnostic info (not parsed)
- Schema MUST be stable across minor versions

**Test ID**: R7

---

## 4. Command Surface

### 4.1 Execute Plugin

```bash
tf marketplace run --plugin <id> --entry <entrypoint> [options]

Options:
  --plugin <id>      Plugin ID (required)
  --entry <name>     Entrypoint name from manifest (required)
  --timeout <s>      Execution timeout in seconds (default: 30)
  --ci               Machine-readable JSON output
  --dry-run          Validate without executing

Exit Codes:
  0  Success (execution completed within policy)
  1  Policy/runtime failure (disabled, timeout, crash, capability violation)
  2  Invalid invocation (bad flags, missing entrypoint, malformed manifest)
```

### 4.2 Kill Running Plugin

```bash
tf marketplace kill --plugin <id> [options]

Options:
  --plugin <id>      Plugin ID (required)
  --ci               Machine-readable JSON output
  --force            SIGKILL immediately (default: SIGTERM then SIGKILL)

Exit Codes:
  0  Plugin terminated successfully
  1  Plugin not running or termination failed
  2  Invalid invocation
```

### 4.3 Query Execution Status

```bash
tf marketplace status --plugin <id> [options]

Options:
  --plugin <id>      Plugin ID (optional, omit for all)
  --ci               Machine-readable JSON output

Output:
  Running plugins with PID, start time, resource usage
```

---

## 5. Exit Code Contract

| Code | Meaning | Examples |
|------|---------|----------|
| 0 | Success | Execution completed, policy satisfied |
| 1 | Policy/Runtime Failure | Disabled plugin, timeout, crash, capability violation, plugin not found |
| 2 | Invalid Invocation | Missing flags, invalid entrypoint, malformed args |

**Alignment**: Consistent with Gate, Agent, Deploy, Marketplace Phase 1 constitutions.

---

## 6. Quarantine Behavior

When a plugin violates capability policy at runtime:

1. Execution halts immediately
2. Exit code = 1
3. Audit log records violation details
4. Registry updated: `status: "quarantined"`, `enabled: false`
5. Manual intervention required to re-enable

```json
// Registry after quarantine
{
  "id": "malicious-plugin",
  "status": "quarantined",
  "enabled": false,
  "quarantine_reason": "Capability violation: fs.write not in allowlist",
  "quarantined_at": "2025-12-18T19:35:00Z"
}
```

**Re-enabling quarantined plugins:**
```bash
tf marketplace enable --plugin malicious-plugin
# Exit 1: "Plugin is quarantined. Review audit logs and use --force to re-enable"

tf marketplace enable --plugin malicious-plugin --force
# Exit 0: Plugin re-enabled (quarantine cleared, audit logged)
```

---

## 7. Test Plan (RED Baseline)

### Section A: Invocation Validity (Exit 2)

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.A1 | Missing --plugin flag | Exit 2 |
| R.A2 | Missing --entry flag | Exit 2 |
| R.A3 | Unknown flags | Exit 2 |
| R.A4 | Invalid entrypoint (not in manifest) | Exit 2 |

### Section B: Execution Prerequisites (Exit 1)

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.B1 | Plugin not installed | Exit 1 |
| R.B2 | Plugin installed but not enabled | Exit 1 |
| R.B3 | Plugin enabled, valid execution | Exit 0 |

### Section C: Capability Enforcement (Exit 1)

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.C1 | Plugin invokes allowed capability | Exit 0 |
| R.C2 | Plugin invokes forbidden capability | Exit 1 + quarantine |
| R.C3 | Plugin invokes undeclared capability | Exit 1 + quarantine |

### Section D: Resource Limits

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.D1 | Execution within timeout | Exit 0 |
| R.D2 | Execution exceeds timeout | Exit 1 + audit "timeout" |
| R.D3 | Custom --timeout flag honored | Exit 1 after custom limit |

### Section E: Crash Containment

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.E1 | Plugin crashes | Exit 1, host survives |
| R.E2 | Plugin exits normally | Exit 0 |
| R.E3 | Registry unchanged after crash | No quarantine |

### Section F: Audit Logging

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.F1 | Audit log created on success | Log exists + valid JSON |
| R.F2 | Audit log created on failure | Log exists + valid JSON |
| R.F3 | Audit log schema compliance | All required fields present |

### Section G: CI JSON Purity

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.G1 | --ci output is valid JSON | jq parses without error |
| R.G2 | --ci output has no ANSI | No escape sequences |
| R.G3 | --ci output has required fields | version, timestamp, status, exit_code |

### Section H: Kill Command

| Test ID | Description | Expected |
|---------|-------------|----------|
| R.H1 | Kill running plugin | Exit 0 |
| R.H2 | Kill non-running plugin | Exit 1 |
| R.H3 | Kill with --ci | Valid JSON output |

---

## 8. Implementation Constraints

### 8.1 Simulated Harness (No Real WASM)

Since no WASM runtime exists:
- Use subprocess with restricted environment
- Capability checks via mock API boundaries
- Timeout via `timeout` command or alarm signals
- Memory bounds advisory only (log warning if exceeded)

### 8.2 Backward Compatibility

Phase 2 MUST NOT break Phase 1:
- All existing marketplace tests MUST pass (19/19)
- Registry schema MUST remain compatible
- Existing commands unchanged

### 8.3 Audit Log Security

- Audit directory: `ops/marketplace/audit/`
- Logs are append-only (new file per execution)
- Logs contain no secrets (capabilities, not credentials)
- Timestamp in filename: `YYYY-MM-DDTHH-MM-SS-sss.json`

---

## 9. Security Model

### Threat: Capability Escalation
- **Attack**: Plugin declares `data.read`, invokes `fs.write`
- **Defense**: Runtime capability check on every invocation
- **Test**: R.C2, R.C3

### Threat: Resource Exhaustion (DoS)
- **Attack**: Plugin runs infinite loop, exhausts CPU
- **Defense**: Timeout enforcement with hard kill
- **Test**: R.D2, R.D3

### Threat: Host Crash via Plugin
- **Attack**: Plugin triggers segfault in host
- **Defense**: Subprocess isolation, exception handling
- **Test**: R.E1, R.E3

### Threat: Audit Log Tampering
- **Attack**: Plugin writes fake audit entries
- **Defense**: Audit logs written by host, not plugin
- **Test**: R.F1, R.F2, R.F3

### Threat: Path Traversal
- **Attack**: `--entry "../../../etc/passwd"`
- **Defense**: Entrypoint validated against manifest whitelist
- **Test**: R.A4

---

## 10. Constitutional Amendment Process

Changes to this constitution require:

1. **SpecLock Document**: Define proposed changes with rationale
2. **RFC Submission**: Evidence of necessity (security bug, scale requirement)
3. **Breaker Review**: All governance tests GREEN + attack tests pass
4. **Shadow Review**: Run against 10+ historical plugin executions
5. **Version Bump**: Tag `v1.1.0-marketplace-execution-constitution`

---

## 11. Relationship to Phase 1

| Aspect | Phase 1 (Lifecycle) | Phase 2 (Execution) |
|--------|--------------------|--------------------|
| Scope | Install, enable, disable, remove | Run, kill, status |
| Tests | 19 tests | 22+ tests |
| Tag | v1.0.0-marketplace-constitution | v1.0.0-marketplace-execution-constitution |
| Invariants | 6 | 7 |
| Registry Changes | Yes (lifecycle state) | Yes (quarantine state) |

---

## 12. AGENT NOTES

### NOTES_NOW
- Phase 2 SpecLock created
- No existing WASM runtime — using simulated harness
- 22 tests planned across 8 sections

### RISKS_FOUND
- Memory enforcement is best-effort in v1
- No true WASM isolation — subprocess with checks
- Kill command may leave zombie processes

### DECISIONS
- Simulated WASM harness over "not implemented"
- Quarantine on capability violation (not crash)
- Audit logs per-execution (not aggregated)

### TODO_NEXT_SESSION
- Create test_marketplace_runtime_governance.sh (RED baseline)
- Implement cmd_marketplace_run()
- Implement cmd_marketplace_kill()
- Breaker attack pass

---

**Constitutional Status**: SPECLOCK COMPLETE — Ready for RED Baseline

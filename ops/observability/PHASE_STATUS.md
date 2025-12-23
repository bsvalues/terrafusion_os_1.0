# Observability Phase Status

> **Last Updated**: 2025-12-23T18:30:00Z  
> **Constitution**: v1.0.0

---

## Phase Summary

| Phase | Name | Status | Evidence |
|-------|------|--------|----------|
| 0 | Recon | ✅ COMPLETE | [OBSERVABILITY_RECON_REPORT.md](./OBSERVABILITY_RECON_REPORT.md) |
| 1 | SpecLock | ✅ COMPLETE | [OBSERVABILITY_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md](./OBSERVABILITY_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md) |
| 2 | TestPlan (RED) | ✅ COMPLETE | [test_observability_governance.sh](./test_observability_governance.sh) |
| 3 | Builder | 📋 READY | See implementation spec below |
| 4 | Breaker | 📋 READY | See security spec below |
| 5 | Seal | ⏳ PENDING | Tag v1.0.0-observability-constitution |

---

## Test Results (RED Phase Baseline)

```
PASSED: 10
FAILED: 12
SKIPPED: 0
STATUS: TESTS FAILING (RED PHASE)
```

### Failing Tests (to be fixed in Phase 3)

1. `tf observe health --ci` → emits help text, not JSON
2. `tf observe proofs --ci` → emits help text, not JSON
3. `tf observe summary --ci` → emits help text, not JSON
4. `tf observe health --ci` → contains ANSI codes
5. `tf observe summary --ci` → contains ANSI codes
6. `tf observe health --ci` → missing version field
7. `tf observe health --ci` → missing timestamp field
8. `tf observe health --ci` → missing status field
9. `tf observe health --ci` → missing components field
10. `tf observe invalid` → returns 0, should return 2
11. `tf observe bundle --bundle /nonexistent` → doesn't reject
12. `tf observe bundle --bundle ../../../etc` → doesn't reject traversal

---

## Phase 3: Builder Specification

### Required Implementations

Add to `ops/dev/tf.sh`:

```bash
# In the case dispatch:
observe)
    cmd_observe "$@"
    ;;

# New function:
cmd_observe() {
    local subcmd="${1:-}"
    shift || true
    
    case "$subcmd" in
        health)  cmd_observe_health "$@" ;;
        proofs)  cmd_observe_proofs "$@" ;;
        bundle)  cmd_observe_bundle "$@" ;;
        chain)   cmd_observe_chain "$@" ;;
        summary) cmd_observe_summary "$@" ;;
        --help)  usage_observe ;;
        *)       usage_observe; exit 2 ;;
    esac
}
```

### Composition Pattern

Each `cmd_observe_*` function MUST:

1. Parse `--ci` flag
2. Invoke sealed commands (no new logic)
3. Aggregate JSON outputs
4. Emit unified JSON
5. Return appropriate exit code

### Example: cmd_observe_health

```bash
cmd_observe_health() {
    local ci_mode=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --ci) ci_mode=true; shift ;;
            *) shift ;;
        esac
    done
    
    # Compose existing sealed commands
    local gate_json=$(./ops/dev/tf.sh gate --ci 2>/dev/null || echo '{"status":"fail"}')
    local doctor_json=$(./ops/dev/tf.sh doctor --json 2>/dev/null || echo '{}')
    
    # Aggregate
    local status="pass"
    if echo "$gate_json" | grep -q '"status":"fail"'; then
        status="fail"
    fi
    
    # Emit unified JSON
    if $ci_mode; then
        cat <<EOF
{
  "version": "1.0.0",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "command": "observe health",
  "status": "$status",
  "components": {
    "gate": $(echo "$gate_json" | python3 -c "import sys,json; g=json.load(sys.stdin); print(json.dumps({'status':g.get('status','unknown'),'checks':g.get('summary',{})}))"),
    "doctor": $(echo "$doctor_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps({'mode':d.get('mode','unknown'),'docker':d.get('docker',{}),'kubernetes':d.get('kubernetes',{})}))")
  }
}
EOF
    else
        # Pretty print for human
        echo "=== TerraFusion Health Check ==="
        echo "Gate: $status"
        echo "$(./ops/dev/tf.sh gate 2>/dev/null | head -5)"
    fi
    
    [[ "$status" == "pass" ]] && return 0 || return 1
}
```

---

## Phase 4: Breaker Specification

### Security Test Suite

Create `test_observability_security.sh`:

```bash
#!/usr/bin/env bash
# Security tests for tf observe commands

test_no_command_injection() {
    # Try to inject command via --bundle
    tf observe bundle --bundle "; rm -rf /" --ci 2>&1
    # Verify no command executed
}

test_no_path_traversal() {
    # Try to read sensitive files
    tf observe bundle --bundle "/etc/shadow" --ci 2>&1
    # Verify rejection
}

test_timeout_honored() {
    # Create hung command scenario
    # Verify timeout at 30s
}

test_no_secrets_in_error() {
    # Trigger error conditions
    # Verify no secrets leaked
}
```

### Fuzzing Targets

- `--bundle` parameter
- Subcommand names
- CI mode flag combinations

### Compliance Checks

- [ ] FISMA-High: No secrets in output
- [ ] NIST 800-53: Audit trail for observe calls
- [ ] Read-only enforcement: No mutations

---

## Phase 5: Seal Checklist

When Phase 3 and 4 complete:

1. [ ] All 22 tests pass (GREEN)
2. [ ] Security tests pass
3. [ ] Documentation updated
4. [ ] RELEASE_PLAYBOOKS.md includes observe commands
5. [ ] Tag: `git tag v1.0.0-observability-constitution`
6. [ ] Update version table in constitution

---

## Next Steps

**Builder Owner**: Implement `cmd_observe_*` functions in tf.sh  
**Breaker Owner**: Run security tests after implementation  
**Human Review**: Required before Phase 5 seal

---

**Phase Status Updated**: 2025-12-23  
**Protocol**: Evidence-Only  
**Authority**: Read-Only Constitution

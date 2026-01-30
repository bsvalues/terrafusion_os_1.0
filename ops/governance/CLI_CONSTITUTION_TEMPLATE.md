# CLI Constitution Template

**Pattern extracted from:** `tf gate` governance hardening (Dec 2024)
**Status:** Gold-standard governance framework for CLI design

---

## Pattern Summary

This template captures the **evidence-driven governance pattern** used to harden `tf gate`:
- SpecLock before implementation
- Tests before code changes
- Builder + Breaker validation
- Fail-fast invalid flag handling
- Human vs machine output separation
- Timeboxed execution
- Sterile shell validation

Reuse this pattern when designing any CLI that requires government-grade reliability.

---

## Phase 1: Define the Contract (SpecLock First)

### 1.1 Flag Semantics Matrix

Define **ALL** flag combinations explicitly:

| Flags | Purpose | Output Type | Exit Codes | Notes |
|-------|---------|-------------|------------|-------|
| (none) | Human dev mode | Human text | 0/1 | Default behavior |
| `--verbose` | Detailed human | Human text | 0/1 | More detail |
| `--ci` | Machine mode | JSON only | 0/1/2 | No human output |
| `--ci --verbose` | **INVALID** | JSON error | 2 | Fail-fast |

**Critical:** Document INVALID combinations, not just valid ones.

### 1.2 Exit Code Contract

| Code | Meaning | When | Machine Parseable? |
|------|---------|------|--------------------|
| 0 | Success | Operation completed successfully | Yes |
| 1 | Failure | Expected failure (validation, checks) | Yes |
| 2 | Invalid invocation | Wrong flags, missing args | Yes |
| 3+ | Reserved | Future use | - |

**Rule:** Exit codes MUST be deterministic and documented.

### 1.3 Output Separation

**Human mode:**
- ANSI colors allowed
- Box drawing, emojis allowed
- Multi-line formatting
- Progress indicators
- stdout AND stderr used

**Machine mode (`--ci`):**
- JSON to stdout ONLY
- No ANSI escape codes
- Schema-versioned
- Single-line or pretty-printed (deterministic)
- stderr for errors only

**Rule:** Human and machine modes NEVER mix output.

---

## Phase 2: Implement Fail-Fast Validation

### 2.1 Flag Validation Pattern

```bash
cmd_example() {
    local ci_mode=""
    local verbose_mode=""
    
    # Parse flags
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --ci) ci_mode="1" ;;
            --verbose) verbose_mode="1" ;;
            *) echo "Unknown flag: $1"; return 2 ;;
        esac
        shift
    done
    
    # Validate combinations BEFORE any work
    if [[ "$ci_mode" == "1" ]] && [[ "$verbose_mode" == "1" ]]; then
        # Machine mode: return JSON error
        printf '%s\n' '{"status":"error","error":{"code":"invalid_flags","message":"--ci cannot be combined with --verbose"}}'
        return 2
    fi
    
    # ... rest of implementation
}
```

**Key:** Validation happens FIRST, before any output or side effects.

### 2.2 Output Helper Pattern

```bash
human_echo() {
    # Only print in human mode
    if [[ "$ci_mode" != "1" ]]; then
        echo -e "$@"
    fi
    return 0
}

machine_output() {
    # Only in CI mode
    if [[ "$ci_mode" == "1" ]]; then
        printf '%s\n' "$1"
    fi
}
```

---

## Phase 3: Timeboxing and Resource Limits

### 3.1 Timeout Pattern

```bash
# Use 'command timeout' to prevent alias shadowing
suite_rc=0
command timeout 60 bash "$test_suite.sh" || suite_rc=$?

if [[ $suite_rc -eq 124 ]]; then
    # Exit code 124 = timeout
    echo "⚠ TIMEOUT (exceeded 60s budget)"
    # Decide: WARN or FAIL based on mode
fi
```

### 3.2 Budget Contract

Document in CONVENTIONS.md:
- Total runtime budget (e.g., ≤120s)
- Sub-operation budgets (e.g., test_suite: 60s)
- Timeout behavior per mode (WARN vs FAIL)

---

## Phase 4: Testing Strategy

### 4.1 Test Coverage Requirements

**Unit tests:**
- Flag parsing (valid combinations)
- Flag rejection (invalid combinations)
- Exit codes match contract
- JSON schema validation

**Integration tests:**
- Timeout enforcement
- Exit code propagation
- Output format (human vs machine)
- Sterile shell validation (no warnings)

### 4.2 Sterile Shell Pattern

```bash
#!/usr/bin/env bash
# Test: No shell warnings in minimal environment

output=$(env -i PATH=/usr/bin:/bin HOME="$HOME" USER="$USER" \
    /usr/bin/timeout 5 bash ./script.sh 2>&1 || true)

if echo "$output" | grep -q "ambiguous redirect"; then
    echo "✗ FAIL: script triggers shell warnings"
    exit 1
fi

echo "✓ PASS: clean in sterile environment"
exit 0
```

---

## Phase 5: Documentation Requirements

### 5.1 Quick Reference (Operator-Facing)

Create `COMMAND_QUICK_REFERENCE.md`:
- When to use each mode
- Flag matrix (1 table)
- Exit code meanings
- Troubleshooting (3-5 common issues)

### 5.2 Contract Documentation (Machine-Facing)

In `CONVENTIONS.md`:
- Constitutional freeze clause
- Flag semantics (explicit table)
- Exit code contract
- JSON schema version
- Timeout budgets

---

## Phase 6: Constitutional Freeze

### 6.1 Immutability Clause

Add to CONVENTIONS.md:

```markdown
## 🔒 CONSTITUTIONAL FREEZE

**[Component] semantics are constitutional.** Changes require:
- SpecLock update
- Explicit governance RFC
- Breaker + Shadow review

This governance layer is **IMMUTABLE** without explicit amendment process.
```

### 6.2 Release Boundary

```bash
git tag -a v1.0.0-[component]-constitution -m "[Component] governance sealed"
git push --tags
```

---

## Phase 7: CI/CD Integration

### 7.1 Enforce in CI

```yaml
# .github/workflows/gate.yml
- name: Gate Check
  run: ./ops/dev/script.sh --ci
  
- name: Validate JSON
  run: ./ops/dev/script.sh --ci | python3 -m json.tool
```

### 7.2 Pre-Commit Hook

```bash
# .git/hooks/pre-commit
./ops/dev/script.sh --ci >/dev/null 2>&1 || {
    echo "Gate failed. Run: ./ops/dev/script.sh"
    exit 1
}
```

---

## Checklist: Is Your CLI Constitution-Grade?

- [ ] All flag combinations documented (including INVALID ones)
- [ ] Exit codes deterministic and documented (0/1/2)
- [ ] Human and machine modes strictly separated
- [ ] Invalid flags fail-fast with JSON error (exit 2)
- [ ] Timeouts enforced with `command timeout`
- [ ] Timeout budgets documented
- [ ] Sterile shell test passes (no warnings)
- [ ] Test coverage: unit + integration + sterile
- [ ] Quick reference for operators
- [ ] Contract documentation for machines
- [ ] Constitutional freeze clause added
- [ ] CI enforces the contract
- [ ] Release tagged

---

## Anti-Patterns (Avoid These)

❌ **Mixing human and machine output**
```bash
# WRONG
if [[ "$ci_mode" == "1" ]]; then
    echo "Running checks..."  # Human text!
    echo '{"status":"pass"}'
fi
```

❌ **Undocumented flag combinations**
```bash
# WRONG: What does --ci --verbose do?
# (Answer: unknown, therefore broken)
```

❌ **Non-deterministic timeouts**
```bash
# WRONG: using bare 'timeout' (could be aliased)
timeout 60 script.sh

# RIGHT: unshadowable
command timeout 60 script.sh
```

❌ **Exit code ambiguity**
```bash
# WRONG
exit 1  # Is this validation failure or invalid invocation?

# RIGHT: documented contract
# 0 = pass, 1 = validation fail, 2 = invalid flags
```

❌ **Late flag validation**
```bash
# WRONG: validate after side effects
echo "Starting work..."
if [[ invalid ]]; then exit 1; fi

# RIGHT: validate FIRST
if [[ invalid ]]; then exit 2; fi
echo "Starting work..."
```

---

## Example: Full Implementation

See `ops/dev/tf.sh` `cmd_gate()` function for reference implementation of this pattern.

---

**This pattern is production-proven and government-grade.**
Reuse it for any CLI requiring deterministic, auditable behavior.

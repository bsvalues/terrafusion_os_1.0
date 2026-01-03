# Gate Quick Reference - Operator Guide

## When to Use Each Mode

### `tf gate` (Default - Development)
**Use when:** Daily development, pre-commit checks
```bash
tf gate
```
- **Output:** Human-readable with colors and box drawing
- **Checks:** 11 core constitution checks
- **Exit codes:** 0 = pass, 1 = fail
- **Warnings:** Printed but don't fail the gate

### `tf gate --full` (Pre-Commit - Complete Validation)
**Use when:** Before committing to protected scopes, pre-PR validation
```bash
tf gate --full
```
- **Output:** Human-readable + invariant suite results
- **Checks:** 11 core + test_gate_ci.sh + test_breaker_invariants.sh
- **Timeouts:** 60s for gate CI, 30s for breaker invariants
- **Timeout handling:** WARN (gate still passes)
- **Exit codes:** 0 = pass (with possible warnings), 1 = fail
- **Budget:** ≤120s total

### `tf gate --ci` (CI/CD - Machine Mode)
**Use when:** Automated CI pipelines, pre-commit hooks, machine parsing
```bash
tf gate --ci
```
- **Output:** JSON only to stdout (no ANSI codes, no human text)
- **Checks:** 11 core checks only (no suites)
- **Exit codes:** 0 = pass, 1 = fail
- **Schema:** version, timestamp, status, summary, checks[]

### ❌ `tf gate --ci --full` (INVALID)
**Never use:** This combination is rejected
```bash
tf gate --ci --full  # Exit 2, JSON error
```
- **Output:** JSON error payload
- **Exit code:** 2 (invalid invocation)
- **Reason:** --ci is machine mode (JSON stdout), --full is human mode (suites)

## Exit Code Contract

| Code | Meaning | When |
|------|---------|------|
| 0 | Pass | All checks passed (warnings allowed in --full) |
| 1 | Fail | One or more checks failed |
| 2 | Invalid | Invalid flag combination or invocation error |

## What WARN vs FAIL Means

### WARN (⚠)
- Doesn't fail the gate
- Indicates suboptimal conditions
- Examples: stale RAG index, protected scope without session
- **In --full mode:** Timeouts are WARN (gate passes)

### FAIL (✗)
- Gate fails, exit code 1
- Must be fixed before proceeding
- Examples: missing VS Code extensions, Docker disk >50GB

## Quick Troubleshooting

**Gate fails in --full but not regular mode?**
→ Check invariant suite failures (test_gate_ci.sh or test_breaker_invariants.sh)

**Timeout warnings in --full?**
→ Normal if suites exceed 60s/30s budgets (still passes)

**JSON parse error in CI?**
→ Ensure using `--ci` without `--full`, redirect stderr: `tf gate --ci 2>/dev/null`

**Exit code 2?**
→ Invalid flag combination, check command syntax

## CI/CD Integration

**Correct CI usage:**
```bash
tf gate --ci | python3 -m json.tool  # Validate JSON
```

**Never do this in CI:**
```bash
tf gate --ci --full  # INVALID
tf gate --full > output.json  # Wrong (human output, not JSON)
```

## Protected Scopes

Changes to these require active agent session:
- `ops/ai/`
- `ops/dev/`
- `backend/`
- `frontend/`
- `SDK/`
- `config/tenant.*`

**Start session:**
```bash
tf agent run --project=<project> --feature="<description>"
```

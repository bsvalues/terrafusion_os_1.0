# Agent Protocol Conventions

> Invariants that all agent/breaker code MUST follow.
> Violations will cause CI failures and breaker false positives.

## 🔒 CONSTITUTIONAL FREEZE

**Gate & Agent Runtime semantics are constitutional.** Changes to the following require SpecLock + RFC + breaker approval + shadow review:

### Gate Subsystem (v1.0.0-gate-constitution)
- `ops/dev/tf.sh` cmd_gate() implementation
- Gate semantics (checks, flags, exit codes)
- CI/CD contracts (JSON schemas, flag behavior)
- Timeout enforcement and exit code contracts

### Agent Runtime Subsystem (v1.0.0-agent-constitution)
- `ops/dev/tf.sh` cmd_agent() implementation + lifecycle commands
- Agent invocation contract (exit codes: 0=pass, 1=fail, 2=invalid)
- Session artifact schema (SESSION.json, CONTRACT.md, SPECLOCK.md, TESTPLAN.md, NOTES.md)
- ACTIVE_SESSION single-source-of-truth marker file
- Session state machine (active, completed, failed, aborted)
- Concurrent session prevention (one active session maximum)
- Gate-first enforcement (no session without gate pass)

This governance layer is **IMMUTABLE** without explicit constitutional amendment process.

**Amendment Process:**
1. Create SpecLock document defining proposed changes
2. Submit RFC with evidence of necessity (bug, security, scale requirement)
3. Pass breaker review (all governance tests GREEN)
4. Conduct shadow review (run against 10+ historical sessions)
5. Tag constitutional version bump (e.g., v1.1.0-agent-constitution)

---

## 1. CLI Invocation Rules

### No Bare CLI Commands

**NEVER** use bare CLI invocations that rely on shell `PATH`:

```python
# ❌ WRONG - depends on PATH being set correctly
subprocess.run(["tf", "gate"])
subprocess.run(["node", "script.js"])
subprocess.run(["python", "script.py"])
```

**ALWAYS** use deterministic resolvers:

```python
# ✅ CORRECT - repo-local path, works in CI with empty PATH
TF_CLI = "./ops/dev/tf.sh"
subprocess.run(["bash", "-c", f"cd {ROOT} && {TF_CLI} gate"])

# ✅ CORRECT - explicit interpreter path
subprocess.run([sys.executable, "script.py"])  # Uses running Python
subprocess.run(["bash", "-c", "command -v node && node script.js"])
```

### Resolution Priority

1. **Repo-local path first**: `./ops/dev/tf.sh`, `./node_modules/.bin/...`
2. **Explicit constant**: Define `TF_CLI`, `NODE_BIN`, etc. at module top
3. **Validated lookup**: Use `shutil.which()` with fallback, never assume

### Rationale

- CI environments may have minimal `PATH` (e.g., `/usr/bin:/bin` only)
- WSL/Docker/devcontainer PATH differs from interactive shell
- Breaker must pass even when `PATH=""` (ultimate portability test)

---

## 2. Bash `set -e` Safety

### Never Use Raw Command Substitution for Probes

**WRONG** - script exits if command returns non-zero:

```bash
set -e
result=$(some_command_that_might_fail)  # Script exits here!
exit_code=$?  # Never reached
```

**CORRECT** - capture exit code without triggering `set -e`:

```bash
set -e
result=$(some_command_that_might_fail) && exit_code=0 || exit_code=$?
# Script continues, exit_code captured correctly
```

### Alternative: Helper Function

```bash
# Define once at top of script
run_capture_rc() {
    local __rc_var=$1; shift
    local __out_var=$1; shift
    local __output __rc
    __output=$("$@" 2>&1) && __rc=0 || __rc=$?
    eval "$__rc_var=$__rc"
    eval "$__out_var=\$__output"
}

# Usage
run_capture_rc rc output python3 check_something.py
if [[ $rc -ne 0 ]]; then
    echo "Check failed: $output"
fi
```

### Rationale

- `set -e` (errexit) is good for fail-fast behavior
- But command substitution `$(...)` propagates exit codes
- Probes/checks need to capture failures without exiting
- The `&& rc=0 || rc=$?` pattern is idiomatic and safe

---

## 3. Gate Performance Contracts

### Runtime Bounds

`tf gate --full` MUST complete within **120 seconds** under normal dev host conditions.

**Sub-suite budgets** (enforced via `timeout`):
- `test_gate_ci.sh`: 60s
- `test_breaker_invariants.sh`: 30s

**Timeout behavior** (applies to `--full` mode only):
- Prints `⚠ TIMEOUT (exceeded Ns budget)`
- Status: **WARN** (increments warnings, not failures)
- Exit code: 0 (gate passes with warnings)
- Suites do NOT run in `--ci` mode (JSON-only, no suite execution)

**Flag combinations:**
- `tf gate` - 11 core checks, human output
- `tf gate --full` - 11 checks + invariant suites (timeboxed), human output
- `tf gate --ci` - 11 core checks only, JSON output to stdout
- `tf gate --ci --full` - **INVALID** (exit 2, JSON error payload)

**Rationale:**
- Prevents gate from blocking development workflow
- Makes "slow gate" a detectable regression
- Bounded runtime enables CI integration without hangs

### JSON Schema Stability

When `--ci` mode emits JSON, timeout warnings MUST be:
- Recorded as `"status": "warn"` in check results
- ANSI-free (no escape codes in JSON fields)
- Schema-stable (no ad-hoc text injection)

---

## 4. Breaker Portability Requirements

All breaker checks MUST pass under:

```bash
# Minimal CI-style PATH
env -i PATH=/usr/bin:/bin HOME="$HOME" bash -lc './ops/dev/tf.sh agent break'
```

### What This Tests

- No reliance on user-specific PATH entries
- No hardcoded absolute paths to user tools
- Scripts find their own dependencies via repo-relative paths

---

## 4. Testing Invariants

### Regression Tests Required For

1. **PATH hardening**: Breaker passes with stripped PATH
2. **set -e safety**: Gate checks complete even when probes fail
3. **JSON output**: CI mode produces valid JSON (no human text leakage)
4. **Forbidden patterns**: No bare CLI commands in critical scripts

### Location

- `ops/dev/tests/test_breaker_invariants.sh` - breaker + forbidden patterns
- `ops/dev/tests/test_gate_ci.sh` - gate JSON contract

### Enforcement Points

- **Local**: `tf gate --full` runs all invariant suites
- **CI**: `ops/scripts/gate-f-validate-all.sh` runs with minimal PATH

---

## 5. Breaker Contract

The Breaker is a critical quality gate. These rules are non-negotiable:

### Determinism

- Breaker MUST produce identical results regardless of developer environment
- Breaker MUST NOT depend on user-specific PATH, aliases, or shell config
- All CLI invocations MUST use repo-relative paths (`./ops/dev/tf.sh`)

### Hermeticity

- Breaker MUST pass with `PATH=/usr/local/bin:/usr/bin:/bin` (CI-style)
- Breaker MUST NOT require tools outside the repo or standard system paths
- External dependencies MUST be validated before use with graceful fallback

### No False Positives

- Breaker failures MUST indicate real problems, never tooling assumptions
- Every breaker check MUST be backed by a regression test
- "Works on my machine" is not an acceptable breaker state

### Change Protocol

- Breaker changes REQUIRE invariant suite updates
- New breaker checks REQUIRE corresponding test in `test_breaker_invariants.sh`
- Breaker regressions block merge (no exceptions)

---

## 6. Code Review Checklist

Before merging changes to `ops/agents/` or `ops/dev/`:

- [ ] No bare `tf`, `node`, `python` commands
- [ ] All subprocess calls use deterministic paths
- [ ] Command substitutions under `set -e` use `&& rc=0 || rc=$?`
- [ ] Breaker passes with `PATH=/usr/bin:/bin`
- [ ] Tests added for new invariants
- [ ] `tf gate --full` passes locally

---

## References

- `ops/agents/generate-contract.py`: TF_CLI constant pattern
- `ops/dev/tf.sh`: `set -e` safe exit code capture (check 10)
- `ops/dev/tests/test_breaker_invariants.sh`: regression guards

# Agent Protocol Conventions

> Invariants that all agent/breaker code MUST follow.
> Violations will cause CI failures and breaker false positives.

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

## 3. Breaker Portability Requirements

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

### Location

- `ops/dev/tests/test_breaker_invariants.sh` - breaker-specific
- `ops/dev/tests/test_gate_ci.sh` - gate JSON contract

---

## 5. Code Review Checklist

Before merging changes to `ops/agents/` or `ops/dev/`:

- [ ] No bare `tf`, `node`, `python` commands
- [ ] All subprocess calls use deterministic paths
- [ ] Command substitutions under `set -e` use `&& rc=0 || rc=$?`
- [ ] Breaker passes with `PATH=/usr/bin:/bin`
- [ ] Tests added for new invariants

---

## References

- `ops/agents/generate-contract.py`: TF_CLI constant pattern
- `ops/dev/tf.sh`: `set -e` safe exit code capture (check 10)
- `ops/dev/tests/test_breaker_invariants.sh`: regression guards

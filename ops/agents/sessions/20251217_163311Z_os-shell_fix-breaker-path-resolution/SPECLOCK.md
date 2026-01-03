# SpecLock: Fix breaker PATH resolution

> Session: `20251217_163311Z_os-shell_fix-breaker-path-resolution`
> Status: **FROZEN**

---

## Scope

<!-- Define exact files/modules in scope -->

```
ops/agents/generate-contract.py  - Add TF_CLI constant for deterministic path
ops/dev/tf.sh                    - Fix set -e exit on agent check failure
```

---

## Public API / Component Contracts

### CLI Commands / Flags
<!-- New command-line options -->

| Command | Flag | Type | Default | Description |
|:--------|:-----|:-----|:--------|:------------|
| tf gate | (no change) | | | Gate check 10 now completes even if session errors found |

### Internal Constants

| Constant | Value | File | Description |
|:---------|:------|:-----|:------------|
| TF_CLI | `./ops/dev/tf.sh` | generate-contract.py | Deterministic path to tf CLI |

---

## Error Model

| Code | Status | Message | When |
|:-----|:-------|:--------|:-----|
| 1 | fail | Gate check 10 session issues | Agent session health check finds errors |

---

## Backward Compat Rules

- **Breaking changes**: NONE
- All gate behavior unchanged externally
- PATH now resolved deterministically vs relying on shell PATH

---

## Non-goals

<!-- What this feature explicitly does NOT do -->

- Does NOT change gate check logic
- Does NOT modify breaker pass criteria
- Does NOT affect session completion workflow

---

## Frozen At

**Status**: FROZEN

**Frozen At**: 2025-12-17T16:46:00Z

**Frozen By**: claude-agent

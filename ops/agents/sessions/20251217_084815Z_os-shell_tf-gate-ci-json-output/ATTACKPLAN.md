# Attack Plan: tf gate --ci JSON output

> Session: `20251217_084815Z_os-shell_tf-gate-ci-json-output`
> Risk Level: **LOW**
> Status: **PENDING**

---

## Breaker Objectives

Your job is to **BREAK** what the Builder created.
Write findings to `ATTACK_REPORT.md`.
Propose hardening diffs in `PATCHLOG.md`.

---

## Attack Vectors

### 1. Race / Concurrency / Ordering

- [ ] Parallel requests handled correctly?
- [ ] State mutations atomic?
- [ ] Deadlock potential?
- [ ] Event ordering guaranteed?
- [ ] Idempotency on retry?

### 2. Security Boundaries

- [ ] AuthZ boundaries respected?
- [ ] Input injection risks (SQL, command, path)?
- [ ] Secrets not leaked in logs/errors?
- [ ] SSRF / external request validation?
- [ ] Rate limiting in place?
- [ ] CORS / CSP configured?

### 3. Input Fuzz Vectors

- [ ] Empty input
- [ ] Null / undefined / missing
- [ ] Maximum size / overflow
- [ ] Malformed data
- [ ] Unicode / special characters
- [ ] Boundary values (0, -1, MAX_INT)
- [ ] Deeply nested structures

### 4. Negative Tests to Add

<!-- Tests that should fail / reject bad input -->

| Scenario | Expected Behavior | Test Added |
|:---------|:------------------|:-----------|
| | | ⬜ |

### 5. Observability Validation

- [ ] Errors logged with context?
- [ ] Metrics emitted correctly?
- [ ] Trace spans have correct parent?
- [ ] No PII in logs?
- [ ] Health checks updated?

---

## Attack Results

Record findings in `ATTACK_REPORT.md`.

---

## Breaker Sign-off

- [ ] All LOW risk vectors checked
- [ ] Critical issues fixed
- [ ] Hardening diffs proposed
- [ ] Tests added for discovered issues
- [ ] No known vulnerabilities remaining

**Breaker**: _agent name_
**Date**: _timestamp_

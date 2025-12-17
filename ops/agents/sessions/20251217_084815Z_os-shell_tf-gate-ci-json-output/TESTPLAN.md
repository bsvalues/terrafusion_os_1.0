````markdown
# Test Plan: tf gate --ci JSON output

> Session: `20251217_084815Z_os-shell_tf-gate-ci-json-output`
> Status: **COMPLETE** ✅

---

## Success Criteria (Measurable)

| Criterion | Metric | Target | Measurement |
|:----------|:-------|:-------|:------------|
| JSON validity | Parse success | 100% | `python3 -m json.tool` exits 0 ✅ |
| Schema compliance | All required fields | 100% | JSON schema validation ✅ |
| Exit code accuracy | Correct exit for status | 100% | Test assertions ✅ |
| Backward compat | Human output unchanged | 100% | Diff comparison ✅ |

### Must Have
- [x] `tf gate --ci` outputs valid JSON to stdout ✅
- [x] Exit code 0 when all checks pass ✅
- [x] Exit code 1 when any check fails ✅
- [x] Exit code 2 on internal error ✅
- [x] JSON schema matches SpecLock ✅
- [x] Human output (`tf gate`) unchanged ✅

### Should Have
- [x] `--ci` and `--full` flags combinable ✅
- [x] Check-specific details in JSON ✅

### Nice to Have
- [ ] (none for v1)

---

## Tests Added

### Unit Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| `test_ci_flag_produces_json` | `test_gate_ci.sh` | `--ci` outputs valid JSON | ✅ |
| `test_ci_json_schema_required_fields` | `test_gate_ci.sh` | All required fields present | ✅ |
| `test_ci_json_schema_version` | `test_gate_ci.sh` | Version is "1.0.0" | ✅ |
| `test_ci_json_schema_status_enum` | `test_gate_ci.sh` | Status in [pass, fail, error] | ✅ |
| `test_ci_json_checks_array` | `test_gate_ci.sh` | Checks is array with 11 items | ✅ |
| `test_ci_json_summary_fields` | `test_gate_ci.sh` | Summary has total/passed/failed/warnings/skipped | ✅ |
| `test_ci_json_check_structure` | `test_gate_ci.sh` | Each check has id/name/status | ✅ |

### Integration Tests

| Test Name | File | Description | Status |
|:----------|:-----|:------------|:-------|
| `test_ci_exit_code_0_on_pass` | `test_gate_ci.sh` | Exit 0 when all pass | ✅ |
| `test_ci_exit_code_reflects_status` | `test_gate_ci.sh` | Exit matches status | ✅ |
| `test_ci_warn_does_not_fail` | `test_gate_ci.sh` | Warn status → exit 0 | ✅ |
| `test_ci_full_flag_combines` | `test_gate_ci.sh` | `--ci --full` works | ✅ |
| `test_human_output_unchanged` | `test_gate_ci.sh` | `tf gate` (no --ci) unchanged | ✅ |
| `test_ci_no_ansi_codes` | `test_gate_ci.sh` | CI output has no ANSI | ✅ |

---

## Test Results

**Run Date**: 2025-12-17T09:23:30Z
**Pass Rate**: 13/13 (100%)

```
═══════════════════════════════════════════════════════════════════════════
  ✓ All tests passed (13/13)
═══════════════════════════════════════════════════════════════════════════
```

---

## Commands

```bash
# Run gate (human mode - unchanged)
./ops/dev/tf.sh gate

# Run gate CI mode
./ops/dev/tf.sh gate --ci

# Validate JSON with Python (no jq required)
./ops/dev/tf.sh gate --ci | python3 -m json.tool

# Run tests
bash ops/dev/tests/test_gate_ci.sh
```

---

## Status Legend

- ⬜ Not started
- 🟡 In progress
- ❌ Failing (expected)
- ✅ Passing
- 🟢 Was failing → now passing

````

# Phase 45 Dashboard Spec Lock v1.0.0

Auto-Remediation Ops + Governance Dashboards (Benton Rollout)

Status: **FROZEN**

- Any change to titles, queries, or dashboard UIDs requires:
  - Spec version bump (v1.0.1+)
  - Updated validation tests
  - Reviewer approval

This spec is designed so validation tests can enforce:

- dashboard files exist
- dashboard UID & title match
- required panels exist
- each panel has **exact** title + **exact** PromQL
- no extra panels are required (extra panels allowed only if they do not violate query constraints)
- no queries reference non-spec metrics

---

## 1) Metrics Spec Lock v1.0.0 (Referenced by Panels)

Allowed metric names:

- `tf_runbook_autoexec_attempt_total`
- `tf_runbook_autoexec_real_total`
- `tf_runbook_autoexec_simulated_total`
- `tf_runbook_autoexec_block_total`
- `tf_runbook_killswitch_enabled`
- `tf_runbook_autoexec_invariant_violation_total`

Allowed labels by metric:

### `tf_runbook_autoexec_attempt_total`

Labels: `county_id`, `step_kind`, `safety_level`, `dry_run`

### `tf_runbook_autoexec_real_total`

Labels: `county_id`, `step_kind`, `safety_level`

### `tf_runbook_autoexec_simulated_total`

Labels: `county_id`, `step_kind`, `safety_level`

### `tf_runbook_autoexec_block_total`

Labels: `county_id`, `reason`
Allowed reason values:

- `killswitch`
- `flags`
- `policy`
- `county`
- `safety`
- `kind`
- `dryrun`

### `tf_runbook_killswitch_enabled`

Labels: `county_id`

### `tf_runbook_autoexec_invariant_violation_total`

Labels: `county_id`, `invariant`
Allowed invariant values:

- `benton_only`
- `safe_only`
- `diagnostics_only`
- `dryrun_no_exec`

Banned labels anywhere (cardinality risk):

- `step_id`
- `incident_id`
- `execution_id`
- `host`
- `node`
- `tenant`
- `message`
- `exception`
- `stacktrace`

---

## 2) Dashboard 1: Benton Ops

File:

- `grafana/phase45/atlas-auto-remediation-benton-ops.json`

Dashboard UID (must match exactly):
- `atlas-auto-remediation-benton-ops`

Dashboard Title (must match exactly):
- `Atlas Auto-Remediation — Benton Ops`

Time range expectation:

- default 6h (not enforced), but panels use `[5m]` windows as specified.

### Panel Spec (exact titles + PromQL)

> NOTE: Validation should locate panels by **title** and validate that at least one query target matches the specified PromQL exactly.

#### P1 — Kill Switch (Benton)

Title:

- `Kill Switch (Benton)`

PromQL:

```promql
max(tf_runbook_killswitch_enabled{county_id="benton"})
```

#### P2 — Auto-Exec Attempts (rate, DryRun vs Real)

Title:

- `Auto-Exec Attempts (rate, DryRun vs Real)`

PromQL:

```promql
sum by (dry_run) (rate(tf_runbook_autoexec_attempt_total{county_id="benton"}[5m]))
```

#### P3 — Auto-Exec Totals (Real vs Simulated)

Title:

- `Auto-Exec Totals (Real vs Simulated)`

PromQL (Target A):

```promql
sum(increase(tf_runbook_autoexec_real_total{county_id="benton"}[1h]))
```

PromQL (Target B):

```promql
sum(increase(tf_runbook_autoexec_simulated_total{county_id="benton"}[1h]))
```

#### P4 — Blocks by Reason (rate)

Title:

- `Blocks by Reason (rate)`

PromQL:

```promql
sum by (reason) (rate(tf_runbook_autoexec_block_total{county_id="benton"}[5m]))
```

#### P5 — Auto-Exec by Safety Level (Real, rate)

Title:

- `Auto-Exec by Safety Level (Real, rate)`

PromQL:

```promql
sum by (safety_level) (rate(tf_runbook_autoexec_real_total{county_id="benton"}[5m]))
```

#### P6 — Auto-Exec by Step Kind (Real, rate)

Title:

- `Auto-Exec by Step Kind (Real, rate)`

PromQL:

```promql
sum by (step_kind) (rate(tf_runbook_autoexec_real_total{county_id="benton"}[5m]))
```

#### P7 — Invariant Violations (Benton, rate)

Title:

- `Invariant Violations (Benton, rate)`

PromQL:

```promql
sum by (invariant) (rate(tf_runbook_autoexec_invariant_violation_total{county_id="benton"}[5m]))
```

#### P8 — Non-Eligible Auto-Exec Attempts (should be zero)

Title:

- `Non-Eligible Auto-Exec Attempts (should be zero)`

PromQL:

```promql
sum(rate(tf_runbook_autoexec_real_total{county_id="benton", safety_level!~"InfoOnly|LowRisk"}[5m]))
+
sum(rate(tf_runbook_autoexec_real_total{county_id="benton", step_kind!="Diagnostic"}[5m]))
```

---

## 3) Dashboard 2: Governance

File:

- `grafana/phase45/atlas-auto-remediation-governance.json`

Dashboard UID (must match exactly):
- `atlas-auto-remediation-governance`

Dashboard Title (must match exactly):
- `Atlas Auto-Remediation — Governance`

### Panel Spec (exact titles + PromQL)

#### G1 — Kill Switch Posture (All Counties)

Title:

- `Kill Switch Posture (All Counties)`

PromQL:

```promql
max by (county_id) (tf_runbook_killswitch_enabled)
```

#### G2 — Real Auto-Exec Outside Benton (MUST be zero)

Title:

- `Real Auto-Exec Outside Benton (MUST be zero)`

PromQL:

```promql
sum(rate(tf_runbook_autoexec_real_total{county_id!="benton"}[5m]))
```

#### G3 — Real Auto-Exec Non-Safe (MUST be zero)

Title:

- `Real Auto-Exec Non-Safe (MUST be zero)`

PromQL:

```promql
sum(rate(tf_runbook_autoexec_real_total{safety_level!~"InfoOnly|LowRisk"}[5m]))
```

#### G4 — Real Auto-Exec Non-Diagnostic (MUST be zero)

Title:

- `Real Auto-Exec Non-Diagnostic (MUST be zero)`

PromQL:

```promql
sum(rate(tf_runbook_autoexec_real_total{step_kind!="Diagnostic"}[5m]))
```

#### G5 — Block Reasons (All Counties, rate)

Title:

- `Block Reasons (All Counties, rate)`

PromQL:

```promql
sum by (reason) (rate(tf_runbook_autoexec_block_total[5m]))
```

#### G6 — Invariant Violations (All Counties, rate)

Title:

- `Invariant Violations (All Counties, rate)`

PromQL:

```promql
sum by (county_id, invariant) (rate(tf_runbook_autoexec_invariant_violation_total[5m]))
```

---

## 4) Validation Rules (for tests)

Tests MUST enforce:

1. Dashboard files exist at exact paths listed above.
2. Dashboard `uid` matches the UID in this spec.
3. Dashboard `title` matches the title in this spec.
4. Every panel listed exists with exact `title`.
5. Every panel's PromQL equals the PromQL in this spec (string equality).
6. No PromQL references metrics outside Metrics Spec Lock v1.0.0.
7. No PromQL references banned labels. (If present in any query string, fail.)
8. Optional: ensure queries use `[5m]` windows where specified.

---

## 5) Change Control

To modify any of:

- metric names
- label sets
- panel titles
- PromQL queries
- dashboard UID/title

You MUST:

- bump spec version
- update validation tests
- run breaker + reviewer
- document the reason (e.g. cardinality fix, better invariant visibility)

End of file.

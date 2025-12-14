# TerraFusion SpecLock Index

> Auto-generated from `INDEX.json` — do not edit directly.
> Regenerate with: `python scripts/speclock-index-gen.py`

**Version**: 1.0.0
**Updated**: 2025-12-13

---

## Overview

TerraFusion uses **SpecLock** to freeze and enforce API, schema, and governance contracts.
Each lock is immutable once published — changes require a new version via Amendment workflow.

## Lock Summary

| ID | Surface | Status | Spec | Artifacts | Tests |
|:---|:--------|:-------|:-----|:----------|:------|
| `runtimecontract.v1` | runtimecontract | ✅ active | v1.0.0 | 3/3 | 22 |
| `receipt.v1` | receipt | ✅ active | v1.0.0 | 3/3 | 25 |
| `pluginlock.v1` | pluginlock | ✅ active | v1.0.0 | 3/3 | 32 |
| `amendment.v1` | amendment | ✅ active | v1.0.0 | 2/2 | 25 |
| `statereport.v1` | state-report | ✅ active | v1.0.0 | 2/2 | 27 |
| `tf.dashboards.atlas_auto_remediation_benton_ops` | dashboards | ✅ active | v1.0.0 | 1/1 | 11 |
| `tf.dashboards.atlas_auto_remediation_governance` | dashboards | ✅ active | v1.0.0 | 1/1 | 11 |
| `tf.metrics.phase45_auto_remediation` | metrics | ✅ active | v1.0.0 | 0 | 11 |
## Lock Details

### RuntimeContract v1

**ID**: `runtimecontract.v1`  
**Surface**: `runtimecontract`  
**Status**: active  
**Purpose**: Shell-agnostic constitutional runtime contract - defines required endpoints, metrics, storage, and plugin admission for all deployment shells

**Specification**:
- ✅ [docs/spec-lock/locks/runtimecontract/runtimecontract.v1/SPEC_LOCK_v1.0.0.md](docs/spec-lock/locks/runtimecontract/runtimecontract.v1/SPEC_LOCK_v1.0.0.md)
- ✅ [docs/spec-lock/locks/runtimecontract/runtimecontract.v1/speclock.spec.json](docs/spec-lock/locks/runtimecontract/runtimecontract.v1/speclock.spec.json)

**Generated Artifacts**:
- ✅ [docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/runtimecontract.schema.json](docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/runtimecontract.schema.json)
- ✅ [docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/openapi-proof.yaml](docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/openapi-proof.yaml)
- ✅ [docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/k8s-readiness-snippet.yaml](docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/k8s-readiness-snippet.yaml)

**Tests** (22 assertions):
- ✅ [backend/tests/TerraFusion.Unit.SmokeTests/RuntimeContractTests.cs](backend/tests/TerraFusion.Unit.SmokeTests/RuntimeContractTests.cs)

**CI Tags**: `speclock`, `runtimecontract`, `governance`, `constitutional`, `k8s`, `admission`

**Related**: `receipt.v1`, `pluginlock.v1`, `amendment.v1`, `statereport.v1`

---

### ReceiptLock v1

**ID**: `receipt.v1`  
**Surface**: `receipt`  
**Status**: active  
**Purpose**: Citizen-verifiable receipts for government artifacts with public proof + FOIA bundle support

**Specification**:
- ✅ [docs/spec-lock/locks/receipt/receipt.v1/SPEC_LOCK_v1.0.0.md](docs/spec-lock/locks/receipt/receipt.v1/SPEC_LOCK_v1.0.0.md)
- ✅ [docs/spec-lock/locks/receipt/receipt.v1/speclock.spec.json](docs/spec-lock/locks/receipt/receipt.v1/speclock.spec.json)

**Generated Artifacts**:
- ✅ [docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.schema.json](docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.schema.json)
- ✅ [docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.openapi.snapshot.json](docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.openapi.snapshot.json)
- ✅ [docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.verifier.json](docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.verifier.json)

**Tests** (25 assertions):
- ✅ [backend/tests/TerraFusion.Unit.SmokeTests/ReceiptLockTests.cs](backend/tests/TerraFusion.Unit.SmokeTests/ReceiptLockTests.cs)

**CI Tags**: `speclock`, `receipt`, `governance`, `proof`, `foia`

**Related**: `pluginlock.v1`, `amendment.v1`

---

### PluginLock v1

**ID**: `pluginlock.v1`  
**Surface**: `pluginlock`  
**Status**: active  
**Purpose**: Marketplace plugin permission envelopes

**Specification**:
- ✅ [docs/spec-lock/locks/pluginlock/pluginlock.v1/SPEC_LOCK_v1.0.0.md](docs/spec-lock/locks/pluginlock/pluginlock.v1/SPEC_LOCK_v1.0.0.md)
- ✅ [docs/spec-lock/locks/pluginlock/pluginlock.v1/speclock.spec.json](docs/spec-lock/locks/pluginlock/pluginlock.v1/speclock.spec.json)

**Generated Artifacts**:
- ✅ [docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.schema.json](docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.schema.json)
- ✅ [docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.permissions.json](docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.permissions.json)
- ✅ [docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.policy.rego](docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.policy.rego)

**Tests** (32 assertions):
- ✅ [backend/tests/TerraFusion.Unit.SmokeTests/PluginLockTests.cs](backend/tests/TerraFusion.Unit.SmokeTests/PluginLockTests.cs)

**CI Tags**: `speclock`, `pluginlock`, `governance`, `marketplace`

**Related**: `receipt.v1`, `amendment.v1`

---

### AmendmentLock v1

**ID**: `amendment.v1`  
**Surface**: `amendment`  
**Status**: active  
**Purpose**: Constitutional governance upgrade workflow

**Specification**:
- ✅ [docs/spec-lock/locks/amendment/amendment.v1/SPEC_LOCK_v1.0.0.md](docs/spec-lock/locks/amendment/amendment.v1/SPEC_LOCK_v1.0.0.md)
- ✅ [docs/spec-lock/locks/amendment/amendment.v1/speclock.spec.json](docs/spec-lock/locks/amendment/amendment.v1/speclock.spec.json)

**Generated Artifacts**:
- ✅ [docs/spec-lock/locks/amendment/amendment.v1/generated/amendment.schema.json](docs/spec-lock/locks/amendment/amendment.v1/generated/amendment.schema.json)
- ✅ [docs/spec-lock/locks/amendment/amendment.v1/generated/amendment.workflow.json](docs/spec-lock/locks/amendment/amendment.v1/generated/amendment.workflow.json)

**Tests** (25 assertions):
- ✅ [backend/tests/TerraFusion.Unit.SmokeTests/AmendmentLockTests.cs](backend/tests/TerraFusion.Unit.SmokeTests/AmendmentLockTests.cs)

**CI Tags**: `speclock`, `amendment`, `governance`, `constitutional`

**Related**: `receipt.v1`, `pluginlock.v1`, `statereport.v1`

---

### StateReportLock v1

**ID**: `statereport.v1`  
**Surface**: `state-report`  
**Status**: active  
**Purpose**: Federated state-level reports requiring county quorum signatures

**Specification**:
- ✅ [docs/spec-lock/locks/state-report/state-report.v1/SPEC_LOCK_v1.0.0.md](docs/spec-lock/locks/state-report/state-report.v1/SPEC_LOCK_v1.0.0.md)
- ✅ [docs/spec-lock/locks/state-report/state-report.v1/speclock.spec.json](docs/spec-lock/locks/state-report/state-report.v1/speclock.spec.json)

**Generated Artifacts**:
- ✅ [docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json](docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json)
- ✅ [docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.template.json](docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.template.json)

**Tests** (27 assertions):
- ✅ [backend/tests/TerraFusion.Unit.SmokeTests/StateReportLockTests.cs](backend/tests/TerraFusion.Unit.SmokeTests/StateReportLockTests.cs)
- ✅ [backend/tests/TerraFusion.Unit.SmokeTests/StateMeshBreakerTests.cs](backend/tests/TerraFusion.Unit.SmokeTests/StateMeshBreakerTests.cs)

**CI Tags**: `speclock`, `state-report`, `governance`, `mesh`, `quorum`

**Related**: `receipt.v1`, `pluginlock.v1`, `amendment.v1`

---

### Atlas Auto-Remediation Benton Ops Dashboard

**ID**: `tf.dashboards.atlas_auto_remediation_benton_ops`  
**Surface**: `dashboards`  
**Status**: active  
**Purpose**: Phase 45 dashboard for Benton County auto-remediation operations

**Specification**:
- ✅ [grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md](grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md)
- ✅ [grafana/phase45/speclock.spec.json](grafana/phase45/speclock.spec.json)

**Generated Artifacts**:
- ✅ [grafana/phase45/atlas-auto-remediation-benton-ops.json](grafana/phase45/atlas-auto-remediation-benton-ops.json)

**Tests** (11 assertions):
- ✅ [backend/tests/TerraFusion.Unit.Tests/Phase45/GrafanaDashboardValidationPhase45Tests.cs](backend/tests/TerraFusion.Unit.Tests/Phase45/GrafanaDashboardValidationPhase45Tests.cs)

**CI Tags**: `speclock`, `dashboards`, `phase45`, `benton`

**Related**: `tf.dashboards.atlas_auto_remediation_governance`

---

### Atlas Auto-Remediation Governance Dashboard

**ID**: `tf.dashboards.atlas_auto_remediation_governance`  
**Surface**: `dashboards`  
**Status**: active  
**Purpose**: Phase 45 governance dashboard for policy compliance and SLO tracking

**Specification**:
- ✅ [grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md](grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md)
- ✅ [grafana/phase45/speclock.spec.json](grafana/phase45/speclock.spec.json)

**Generated Artifacts**:
- ✅ [grafana/phase45/atlas-auto-remediation-governance.json](grafana/phase45/atlas-auto-remediation-governance.json)

**Tests** (11 assertions):
- ✅ [backend/tests/TerraFusion.Unit.Tests/Phase45/GrafanaDashboardValidationPhase45Tests.cs](backend/tests/TerraFusion.Unit.Tests/Phase45/GrafanaDashboardValidationPhase45Tests.cs)

**CI Tags**: `speclock`, `dashboards`, `phase45`, `governance`

**Related**: `tf.dashboards.atlas_auto_remediation_benton_ops`

---

### Phase 45 Auto-Remediation Metrics

**ID**: `tf.metrics.phase45_auto_remediation`  
**Surface**: `metrics`  
**Status**: active  
**Purpose**: Allowed metrics: tf_runbook_autoexec_total, tf_runbook_autoexec_duration_seconds, tf_remediation_policy_eval_total, tf_runbook_killswitch_enabled, tf_runbook_autoexec_block_total, tf_remediation_slo_compliance_ratio

**Specification**:
- ✅ [grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md](grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md)
- ✅ [grafana/phase45/speclock.spec.json](grafana/phase45/speclock.spec.json)

**Tests** (11 assertions):
- ✅ [backend/tests/TerraFusion.Unit.Tests/Phase45/GrafanaDashboardValidationPhase45Tests.cs](backend/tests/TerraFusion.Unit.Tests/Phase45/GrafanaDashboardValidationPhase45Tests.cs)

**CI Tags**: `speclock`, `metrics`, `phase45`

---
## Generator Registry

Scripts that generate artifacts from spec data:

| Surface | Script | Description |
|:--------|:-------|:------------|
| `runtimecontract` | ✅ `scripts/speclock-runtimecontract-gen.py` | Generates runtime contract schema, OpenAPI fragment, and K8s readiness snippet |
| `receipt` | ✅ `scripts/speclock-receipt-gen.py` | Generates receipt schema and verifier artifacts |
| `pluginlock` | ✅ `scripts/speclock-pluginlock-gen.py` | Generates plugin permission envelope schema |
| `amendment` | ✅ `scripts/speclock-amendment-gen.py` | Generates amendment workflow schema |
| `state-report` | ✅ `scripts/speclock-state-report-gen.py` | Generates state report schema with quorum validation |
| `api` | ✅ `scripts/speclock-openapi-snapshot.py` | Generates deterministic OpenAPI snapshot JSON |
| `api_ts_sdk` | ✅ `scripts/speclock-sdk-gen-ts.py` | Generates TypeScript types from spec_data_path |
| `api_cs_dtos` | ✅ `scripts/speclock-sdk-gen-cs.py` | Generates C# DTO records from spec_data_path |
| `dashboards` | ✅ `scripts/speclock-grafana-render.py` | Renders Grafana dashboard JSON from spec_data_path |
| `alerts` | ✅ `scripts/speclock-alert-compile.py` | Compiles PrometheusRule YAML from spec_data_path |
| `opa` | ✅ `scripts/speclock-opa-gen.py` | Generates OPA Rego policy from spec_data_path |

---

## Maintenance

### Adding a New Lock

1. Create spec directory: `docs/spec-lock/locks/{surface}/{surface}.v1/`
2. Write `SPEC_LOCK_v1.0.0.md` (human-readable spec)
3. Write `speclock.spec.json` (machine-readable)
4. Create generator script in `scripts/speclock-{surface}-gen.py`
5. Add entry to `INDEX.json`
6. Add entry to `GENERATORS.json`
7. Write tests in `backend/tests/TerraFusion.Unit.SmokeTests/`
8. Run: `python scripts/speclock-index-gen.py`

### Updating a Lock

Locks are immutable. To update:

1. Create Amendment proposal (see `amendment.v1`)
2. Get county quorum approval
3. Create new version: `{surface}.v2/`
4. Deprecate old version in `INDEX.json`

### CI Integration

All SpecLocks are validated in CI via:
- `scripts/ci-seal-gate.sh` (Gate 1)
- `scripts/ci-seal-gate.ps1` (Windows)

---

*Generated by speclock-index-gen.py*

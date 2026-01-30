# PACS Contract SpecLock v1.0.0

> **Status**: ACTIVE
> **Surface**: `pacscontract`
> **Version**: 1.0.0
> **Effective**: 2025-12-14
> **County**: Benton (pilot), extensible to all 39 WA counties

---

## Purpose

This SpecLock defines the **immutable contract** between TerraFusion OS and Harris PACS (TrueAutomation) database systems.

**What this contract enforces:**

1. Which databases TerraFusion is allowed to connect to
2. Which objects (views, indexes, procedures) TerraFusion depends on
3. Connection semantics (encryption, timeouts, read-only by default)
4. Fail-closed behavior on drift or missing objects

**What this contract forbids:**

- Direct table access (only views allowed)
- Write operations (read-only by default, writes require amendment)
- Referencing undeclared objects
- Silent fallback on missing dependencies

---

## 1. Supported Databases (Explicit Allowlist)

```yaml
databases:
  allowed:
    - name: pacs_oltp
      purpose: Production PACS database (property, valuation, ownership)
      required: true
    - name: CIAPS
      purpose: County Integrated Assessment & Permit System (building permits)
      required: false

  forbidden:
    - name: PACS_Training
      reason: Training/backup clone - no production queries
    - name: TA_AppSvr
      reason: Internal TrueAutomation server - no external access
    - name: ReportServer
      reason: SSRS catalog - no direct queries
    - name: Web_Internet_Benton
      reason: Public staging - ETL only, no direct access
```

**Invariant**: Any database not in `allowed` list MUST fail-closed if referenced.

---

## 2. Required Objects (TerraFusion Dependencies)

### 2.1 pacs_oltp Views

TerraFusion ONLY queries these TerraFusion-specific views (not raw tables):

| View Name | Purpose | Required Columns |
|-----------|---------|------------------|
| `vw_TerraFusion_Property_Core` | Core property data for API | prop_id, geo_id, prop_type_cd, assessed_val, taxable_val, situs_display |
| `vw_TerraFusion_Property_Ownership` | Ownership/mailing | prop_id, owner_id, owner_name, mail_addr_1, mail_city, mail_state, mail_zip |
| `vw_TerraFusion_Assessment_History` | Valuation history | prop_id, prop_val_yr, assessed_val, improvement_value, land_value |

**Invariant**: Missing view → fail-closed with explicit error code `PACS_VIEW_MISSING`.

### 2.2 pacs_oltp Indexes

Performance indexes required for sub-second API response:

| Index Name | Table | Purpose |
|------------|-------|---------|
| `IX_TerraFusion_Property_GeoID` | property | geo_id lookups |
| `IX_TerraFusion_PropertyVal_PropYear` | property_val | year-based valuation queries |
| `IX_TerraFusion_Situs_Property` | situs | address lookups |

**Invariant**: Missing index → log warning, continue (performance degradation acceptable).

### 2.3 pacs_oltp Procedures

| Procedure Name | Purpose | Access Mode |
|----------------|---------|-------------|
| `sp_TerraFusion_HealthCheck` | System diagnostics | read-only |

**Invariant**: Missing procedure → fail-closed for health checks.

### 2.4 CIAPS Objects (Optional)

| Object | Type | Purpose |
|--------|------|---------|
| `building_permit` (via synonym) | table | Permit data |
| `prop_building_permit_assoc` (via synonym) | table | Property-permit linkage |

**Invariant**: CIAPS unavailable → degrade gracefully, return empty permit list.

---

## 3. Connectivity Contract

```yaml
connection:
  encryption: required          # TLS 1.2+ mandatory
  timeout_seconds: 30           # Connection timeout
  command_timeout_seconds: 60   # Query timeout
  application_name: TerraFusion-OS
  min_pool_size: 5
  max_pool_size: 100

access_mode:
  default: read_only            # No writes without amendment
  writes_require: amendment     # Write access requires formal amendment

authentication:
  method: sql_server            # SQL Server authentication (not Windows)
  user: TerraFusion_Integration
  password_source: vault        # Never in config files

permissions:
  required:
    - db_datareader             # Read access to views
    - EXECUTE on sp_TerraFusion_HealthCheck
  forbidden:
    - db_datawriter             # No write access by default
    - db_owner                  # Never
    - sysadmin                  # Never
```

---

## 4. Drift Semantics (Fail-Closed)

### 4.1 View Missing

```
Error Code: PACS_VIEW_MISSING
Behavior: Fail-closed
Message: "Required view '{view_name}' not found in pacs_oltp. Contract version mismatch."
Action: Refuse all queries, require operator intervention
```

### 4.2 Column Missing from View

```
Error Code: PACS_COLUMN_MISSING
Behavior: Fail-closed
Message: "Required column '{column_name}' missing from view '{view_name}'"
Action: Refuse queries for that entity
```

### 4.3 Index Missing

```
Error Code: PACS_INDEX_MISSING
Behavior: Log warning, continue
Message: "Performance index '{index_name}' missing. Queries may be slow."
Action: Continue with degraded performance
```

### 4.4 Permission Denied

```
Error Code: PACS_PERMISSION_DENIED
Behavior: Fail-closed
Message: "Insufficient permissions on '{object_name}'. Required: {permission}"
Action: Refuse operation, require DBA intervention
```

### 4.5 Connection Failed

```
Error Code: PACS_CONNECTION_FAILED
Behavior: Fail-closed for required databases
Message: "Cannot connect to PACS database '{database}'"
Action: Mark system unhealthy, refuse requests
```

---

## 5. Version Compatibility

```yaml
contract_version: 1.0.0
pacs_schema_version_min: "9.0"    # TrueAutomation PACS 9.x
pacs_schema_version_max: "9.99"   # Upper bound for this contract

upgrade_path:
  - version: 2.0.0
    trigger: "New views required for tax billing integration"
    process: Amendment workflow
```

---

## 6. Runtime Proof Endpoint

Contract validation exposed via:

```
GET /ops/pacs/proof
```

**Response Schema**:

```json
{
  "contract_version": "1.0.0",
  "contract_hash": "sha256:abc123...",
  "validation_time": "2025-12-14T12:00:00Z",
  "databases": {
    "pacs_oltp": {
      "connected": true,
      "views_present": ["vw_TerraFusion_Property_Core", "..."],
      "views_missing": [],
      "indexes_present": ["IX_TerraFusion_Property_GeoID", "..."],
      "indexes_missing": []
    }
  },
  "status": "VALID",
  "errors": []
}
```

**Invariant**: `/healthz/ready` MUST fail if PACS contract is invalid.

---

## 7. Amendment Process

This contract is **immutable**. Changes require:

1. Formal Amendment proposal (see `amendment.v1`)
2. Technical impact assessment
3. County quorum approval (Benton + 1 other)
4. New contract version: `pacscontract.v2`
5. Migration window with dual-contract support

**Example amendments requiring new version**:
- Adding new required views
- Enabling write access
- Adding new database to allowlist
- Changing timeout thresholds

---

## Related Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Machine-readable spec | `speclock.spec.json` | CI validation |
| Schema JSON | `generated/pacscontract.schema.json` | Runtime validation |
| Proof endpoint spec | `generated/pacscontract.openapi.yaml` | API documentation |

---

## Test Requirements

Minimum 10 assertions covering:

1. SpecLock parses successfully
2. All declared databases exist
3. All required views exist
4. Required columns present in views
5. All required indexes exist
6. Connection properties enforced
7. Read-only invariant asserted
8. Unexpected object not referenced
9. SpecLock registered in INDEX
10. Failure messages are explicit

---

*SpecLock authored by TerraFusion Elite Government OS Engineering*
*Effective: 2025-12-14*
*Classification: GOVERNANCE / CONSTITUTIONAL*

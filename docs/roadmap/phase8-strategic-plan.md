# Phase 8 Strategic Plan: County/Tenant Isolation + Data Governance

> **Classification:** Government Operations — FISMA-HIGH  
> **Phase:** 8 — Multi-County Production Hardening  
> **Dependencies:** Phase 7 Complete (Production Cutover Safety)  
> **Target:** Q2 2026

---

## Executive Summary

**Phase 7** established production readiness for **single-county operations** with operational fitness (SLOs), safe deployment (cutover/rollback), and trace enforcement.

**Phase 8** extends TerraFusion to **secure multi-county production** by enforcing tenant isolation, data governance, and least-privilege data planes — the foundation for 39-county Washington State deployment.

---

## Strategic Context

### Why Phase 8 Matters

TerraFusion is a **government operating system serving sovereign county entities**. Each county's data must be cryptographically isolated with:

1. **Jurisdictional sovereignty** — County A cannot access County B's property records
2. **Audit trails** — Every cross-county API call is logged with justification
3. **Least-privilege data planes** — Services can only access data they need for their function
4. **Export controls** — County data export requires explicit approval + audit
5. **Retention policies** — Automated purging after legal retention period

**Current State:**  
- Code-level county filtering exists (`WHERE countyId = :currentCounty`)
- No enforcement that filtering is consistently applied
- No cryptographic namespace isolation
- No export control gates
- No automated retention enforcement

**Phase 8 Goal:**  
Make county isolation **architecturally impossible to violate**, not just policy-based.

---

## Phase 8 Scope

### 8.1 County Namespace Isolation

**Objective:** Enforce tenant boundaries at the infrastructure layer.

**Implementation:**

1. **Database Multi-Tenancy Pattern**
   - Option A: Schema-per-county (`benton_county.properties`, `yakima_county.properties`)
   - Option B: Row-level security (PostgreSQL RLS policies)
   - Recommendation: **Row-level security** (easier migration, better performance)

2. **API Gateway County Context**
   - Every request tagged with `X-TerraFusion-County-ID` header
   - Gateway enforces header presence (401 if missing)
   - Backend services validate header matches authenticated user's county
   - Cross-county requests require explicit `X-TerraFusion-County-Override` + audit

3. **County Isolation Gate**
   - Scans backend code for direct database access without county filter
   - BLOCKS merges if unfiltered queries exist (with ratcheting exemptions)
   - Validates RLS policies are enabled on all county-scoped tables

**Artifacts:**
- `docs/architecture/county-isolation.md` — isolation design
- `backend/k8s/postgres-rls-policies.sql` — RLS policy definitions
- `tools/gates/county-isolation-gate.mjs` — enforcement gate

---

### 8.2 Least-Privilege Data Planes

**Objective:** Services can only access data required for their function.

**Implementation:**

1. **Service-Specific Database Users**
   - `terrafusion_api` user: Read/write properties, assessments
   - `terrafusion_operations` user: Read-only properties, write processing logs
   - `terrafusion_consciousness` user: Read-only for AI processing
   - `terrafusion_audit` user: Write-only to audit tables

2. **Database Permission Audit**
   - Scan `GRANT` statements in migration scripts
   - Validate no service has `SUPERUSER` or `ALL` privileges
   - Enforce least-privilege via gate

**Artifacts:**
- `backend/migrations/AddServiceUsers.sql` — service user setup
- `tools/gates/db-privilege-gate.mjs` — least-privilege enforcement

---

### 8.3 Export Controls

**Objective:** County data export requires explicit approval + audit trail.

**Implementation:**

1. **Export API Endpoints**
   - `/api/v1/export/{countyId}/properties` — bulk export (requires justification)
   - Requires `CountyDataExport` permission role
   - Rate-limited: 1 export per county per 24 hours
   - Audit log includes: requester, county, record count, justification

2. **Export Approval Workflow**
   - Export request creates `ExportRequest` entity (pending state)
   - County coordinator must approve via email link
   - Approval expires after 7 days
   - Rejected exports are logged

3. **Export Gate**
   - Validates all bulk data endpoints require `CountyDataExport` permission
   - Validates all exports emit audit trail
   - BLOCKS merges if unaudited export paths exist

**Artifacts:**
- `backend/TerraFusion.Core/Services/CountyDataExportService.cs`
- `docs/ops/export-controls.md` — export policy
- `tools/gates/export-control-gate.mjs`

---

### 8.4 Data Retention + Purging

**Objective:** Automated purging after legal retention period (NIST 800-53 AU-11).

**Implementation:**

1. **Retention Policy Configuration**
   ```json
   {
     "auditLogs": { "retentionDays": 2555 },  // 7 years (FISMA)
     "propertyAssessments": { "retentionDays": 3650 },  // 10 years (county law)
     "userSessions": { "retentionDays": 90 },
     "apiLogs": { "retentionDays": 365 }
   }
   ```

2. **Purging Service**
   - Background job runs daily at 02:00 UTC
   - Identifies records exceeding retention period
   - Archives to cold storage (S3 Glacier)
   - Purges from hot database
   - Audit trail includes: table, record count, execution time

3. **Retention Gate**
   - Validates all tables with PII/audit data have retention policy
   - Validates purging service is enabled in production
   - Validates cold storage backup exists before purge

**Artifacts:**
- `backend/TerraFusion.Operations/Services/DataRetentionService.cs`
- `docs/ops/data-retention.md`
- `tools/gates/retention-policy-gate.mjs`

---

## Success Criteria

| Criterion | Validation |
|-----------|-----------|
| **County isolation is architecturally enforced** | RLS policies enabled + county-isolation-gate passes |
| **Services use least-privilege DB access** | db-privilege-gate passes (no SUPERUSER grants) |
| **Export controls are audited** | export-control-gate passes + audit trail verified |
| **Retention is automated** | retention-policy-gate passes + purging job enabled |
| **Cross-county access is blocked** | Integration test: County A cannot query County B data |

---

## Phase 8 Gates

| Gate ID | Name | Scope | Rules |
|---------|------|-------|-------|
| 8.1 | County Isolation | Backend code + DB | ~25 rules |
| 8.2 | DB Privilege | Migration scripts | ~15 rules |
| 8.3 | Export Control | API endpoints | ~12 rules |
| 8.4 | Retention Policy | Data lifecycle | ~10 rules |

**Total:** ~62 new gate rules across 4 dimensions.

---

## Implementation Sequencing

### Week 1-2: County Isolation Foundation
1. Enable PostgreSQL RLS on `properties`, `assessments`, `tax_levies`
2. Add `countyId` filter to RLS policies
3. Deploy county-isolation-gate
4. Remediate violations (if any)

### Week 3-4: Least-Privilege Data Planes
1. Create service-specific database users
2. Migrate connection strings to use service users
3. Revoke broad permissions (e.g., `ALL` grants)
4. Deploy db-privilege-gate

### Week 5-6: Export Controls
1. Implement `CountyDataExportService`
2. Add approval workflow
3. Audit log integration
4. Deploy export-control-gate

### Week 7-8: Data Retention
1. Define retention policies per table
2. Implement `DataRetentionService` background job
3. Set up cold storage (S3 Glacier)
4. Deploy retention-policy-gate

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| RLS performance overhead | Benchmark queries; add indexes on `countyId` |
| Service user migration breaks existing code | Blue/green deployment; test in staging first |
| Export approval workflow delays operations | Auto-approve for county coordinators; time-bound approvals |
| Cold storage restore latency | Test restore procedure; document RTO |

---

## Metrics & KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| County isolation violations (production) | 0 | Prometheus `county_isolation_violations_total` |
| Cross-county API calls (legitimate) | < 10/day | Audit log query |
| Data export requests approved | > 95% within 24h | Export approval service metrics |
| Retention purge success rate | 100% | Purging job success metric |

---

## Regulatory Alignment

| Standard | Requirement | Phase 8 Deliverable |
|----------|-------------|---------------------|
| **FISMA-HIGH** | Multi-tenant isolation | County RLS policies + isolation gate |
| **NIST 800-53 AC-4** | Information flow enforcement | Cross-county access audit + export controls |
| **NIST 800-53 AU-11** | Audit record retention | Retention policy + automated purging |
| **FedRAMP** | Least-privilege data access | Service-specific DB users + privilege gate |

---

## Dependencies

- Phase 7 complete (SLO, cutover, DR, trace coverage)
- PostgreSQL 14+ (for row-level security)
- Cold storage provisioned (S3 Glacier or equivalent)
- County coordinator approval workflow UI

---

## Next Steps (Post-Phase 8)

**Phase 9 Candidates:**
1. **Real-time compliance monitoring** — continuous FISMA control validation
2. **Zero-trust network architecture** — service mesh with mTLS
3. **AI model governance** — ML model versioning + bias detection
4. **Federated identity** — SSO across 39 counties

---

*Government. Transcended. Isolated. Governed.*

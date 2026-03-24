# Phase 33: PACS Live Integration — Environment Prerequisites

**Status**: ENVIRONMENT-GATED — do not open until SQL Server is provisioned
**Owner**: SRE + County IT
**Depends on**: Phase 32 (TerraCanon Live) sealed, `TF_*` env vars deployed

---

## What Phase 33 Delivers

Live connection from TerraFusion to Harris PACS 9.0 SQL Server — replacing the 89,247-parcel static seed with a live query layer via the six `pacscontract.v1` adapter views.

The adapter views already exist as declarations in `terra-fusion-sync`. Phase 33 proves they return real data.

---

## The Six Adapter Views (already declared)

| View | Purpose |
|---|---|
| `vw_TerraFusion_Property_Core` | Parcel identity, address, ownership |
| `vw_TerraFusion_Property_Ownership` | Owner name, mailing address, transfer date |
| `vw_TerraFusion_Assessment_History` | Assessment values by tax year |
| `vw_TerraFusion_Comparable_Sales` | Sales comps (price, date, distance) |
| `vw_TerraFusion_Cama_Characteristics` | Building characteristics (sq ft, beds, baths) |
| `vw_TerraFusion_Improvement_Cost_Matrices` | Marshall & Swift cost matrices |

---

## SRE Checklist — Required Before Phase 33 Opens

### County IT / SQL Server

- [ ] Harris PACS 9.0 SQL Server reachable from TerraFusion staging host (TCP port 1433)
- [ ] TerraFusion service account created in SQL Server with `SELECT` on `pacscontract.v1` schema
- [ ] All six adapter views created and returning data: `SELECT TOP 1 * FROM pacscontract.v1.vw_TerraFusion_Property_Core`
- [ ] Firewall rule: TerraFusion staging IP → SQL Server port 1433 (ALLOW)
- [ ] SSL/TLS encryption enabled on SQL Server connection

### Environment Variables (staging + prod)

```bash
# Required — set by SRE before Phase 33 opens
TF_DEV_PACS_HOST=<sql-server-hostname>
TF_DEV_PACS_PORT=1433
TF_DEV_PACS_DATABASE=<pacs-database-name>
TF_DEV_PACS_USER=<service-account-username>
TF_DEV_PACS_PASSWORD=<service-account-password>   # rotate after initial set
TF_DEV_PACS_ENCRYPT=true
TF_DEV_PACS_TRUST_SERVER_CERT=false               # must be false in prod
```

### Pre-flight Verification

```bash
# From staging host — verify SQL Server reachable
nc -zv $TF_DEV_PACS_HOST 1433 && echo "PORT OPEN" || echo "BLOCKED"

# Test connection with sqlcmd
sqlcmd -S $TF_DEV_PACS_HOST -U $TF_DEV_PACS_USER -P $TF_DEV_PACS_PASSWORD \
  -Q "SELECT COUNT(*) FROM pacscontract.v1.vw_TerraFusion_Property_Core"
# Expected: 89247 (or close — Benton County parcel count)
```

---

## Phase 33 Code Tasks (open only after SRE checklist complete)

### Task 1: Connection smoke
```bash
# From os-platform/development/testing-suite/
node phase33-pacs-connection-smoke.mjs
```
Script: connect → `SELECT TOP 1` on each of the 6 views → assert non-null result → log row counts.

### Task 2: `pacsService.ts` live adapter
- Replace `getPacsProperties()` static seed path with live SQL query via the `TF_DEV_PACS_*` env vars
- Keep static seed as fallback when env vars absent (dev safety net)
- Existing `PropertySearch.test.tsx` mocks `pacsService` — these tests must stay green

### Task 3: PropertySearch live smoke
- Load PropertySearch in staging
- Search "Kennewick" → verify results from live PACS data
- Click first result → Property Workbench opens with live parcel data

### Task 4: Governance seal CP26
- Evidence: SQL Server reachable, 6/6 views return data, row counts match expected ranges
- PropertySearch live smoke PASS
- Vitest 6186/6186 (no regressions from pacsService change)

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| SQL Server firewall blocks staging IP | HIGH | County IT must whitelist before Phase 33 opens |
| PACS service account lacks view permissions | HIGH | County DBA must grant SELECT on `pacscontract.v1` schema |
| View definitions don't match adapter contracts | MEDIUM | Run `SELECT TOP 1` on each view to confirm columns |
| TF_DEV_PACS_PASSWORD exposed in env file | HIGH | Never commit to `.env`; use secrets manager |
| Static seed data diverges from live PACS | LOW | Expected — live data is authoritative |

---

## Classification

**ENVIRONMENT-GATED**: Phase 33 does not open until all SRE checklist items above are checked.
**No code work is possible before SQL Server is provisioned.**
**Estimated effort once unblocked**: 1 day (connection smoke + pacsService adapter + live smoke + CP26 seal).

---

*Phase 20 static verification (adapter views declared) completed 2026-03-21. Evidence in `docs/superpowers/artifacts/cp19/pacs-phase20-static.md`.*

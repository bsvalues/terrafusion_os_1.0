# P3 — Backend Operational Excellence

**Program:** P3  
**Status:** QUEUED  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Make the TerraFusion backend operable, diagnosable, and release-gated. This program establishes what "backend ready" means as a concrete evidence-backed contract, not a subjective judgment. No deployment until WO-BACKEND-007 (release gate definition) produces a gate the operator agrees with.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Backend code changes (non-schema) | Schema changes / EF migrations |
| Config changes | Production deployment |
| Build warning fixes | PACS connection |
| Health check improvements | Data mutation |
| ADR documents | County-facing changes |

---

## Work Orders (Ordered)

| WO | Title | Status | Description |
|----|-------|--------|-------------|
| WO-BACKEND-001 | Backend runtime truth audit | **NEXT** | Enumerate all endpoints; verify which return data vs stubs vs 404 |
| WO-BACKEND-002 | Build warning burn-down | QUEUED | Enumerate all `dotnet build` warnings; fix or document each |
| WO-BACKEND-003 | Service registry validation | QUEUED | Verify all registered services have health checks; find orphaned registrations |
| WO-BACKEND-004 | Health/readiness truth contract | QUEUED | Define what `/healthz` and `/healthz/ready` must verify for the demo to be operator-trusted |
| WO-BACKEND-005 | Runtime configuration contract | QUEUED | Document every required runtime config key; verify all present in appsettings hierarchy |
| WO-BACKEND-006 | Auth/security endpoint proof | QUEUED | Prove all protected endpoints reject unauthenticated requests; prove dev-token works in Development |
| WO-BACKEND-007 | Release gate definition | QUEUED | Produce the formal "backend is release-ready" gate criteria — operator approves before 003D |
| WO-BACKEND-008 | Backend operational packet and runbook | QUEUED | Produce final backend ops packet: startup, monitoring, restart, rollback |

---

## Dependency Chain

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008
```

WO-BACKEND-007 must be operator-approved before P1/WO-DEPLOY-BENTON-003D (App Service smoke) runs.

---

## Interaction with P1

P3 runs in parallel with P1 where possible. P1/003D is blocked on P3/007. The operator may choose to run 003D before P3/007 for demo purposes — that is a documented risk acceptance, not a default.

---

## Stop Conditions

- If WO-BACKEND-001 finds a critical service failure that blocks the demo path, escalate to operator before continuing P1
- If WO-BACKEND-007 produces gate criteria the operator cannot meet before the demo date, the operator decides: demo anyway with documented risk, or delay demo

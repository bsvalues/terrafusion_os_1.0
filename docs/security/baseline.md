# TerraFusion Security Baseline — Current vs Target

**Status as of 2026-05-12.** This document is the honest source of truth for TerraFusion's current security posture. Where `CLAUDE.md` / `README.md` aspirational language ever differs from this file, **this file wins**.

This file was created as part of PR-1 of the immediate-week production-readiness tranche, in response to the Project Prometheus T3 (Security) audit conducted 2026-05-12. The audit determined that prior "FISMA-HIGH compliant" framing was not defensible as written. Inaccurate FISMA claims are themselves a compliance incident, so the documentation is being retracted to "posture target" language while the underlying controls are remediated in parallel PRs (PR-2 through PR-5).

## Target posture

- **FISMA-HIGH** per NIST SP 800-53 Rev 5
- **WCAG 2.1 AA** accessibility (frontend)
- **Sovereign-county data isolation** (per-deployment + defense-in-depth query filters)

## Current posture: OPEN gaps (Prometheus T3 — 13 CRITICAL findings)

| # | NIST Control | Finding | Status | Planned remediation |
|---|---|---|---|---|
| 1 | **AC-3** Access Enforcement | No global `FallbackPolicy` on the main API; Workbench and Drain controllers reachable anonymously | **OPEN** | PR-2 (auth criticals) |
| 2 | **AU-2** Audit Events | `AuditLogs` writes hardcoded `UserId="System"`; no real user attribution. The `AuditableEntityInterceptor` referenced in older docs is **not implemented** | **OPEN** | PR-2 (auth criticals) — implement interceptor; route `HttpContext` user identity into `SaveChangesAsync` |
| 3 | **SC-12** Cryptographic Key Establishment | JWT signing key falls back to a hardcoded-prefix default if configuration is missing | **OPEN** | PR-2 (auth criticals) — fail-closed on missing key |
| 4 | **IA-2** Identification & Authentication | `DevelopmentLdapService` registered in both Development AND Production DI branches | **OPEN** | PR-2 (auth criticals) — env-gate registration |
| 5 | **AC-3 / SC-8** Transport Security | Main API host does NOT call `UseHttpsRedirection()` | **OPEN** | PR-3 (observability criticals — host-level surface) |
| 6 | **AC-4** Information Flow / County Isolation | EF `HasQueryFilter` for county scoping is commented out; isolation depends entirely on per-controller `Where(p => p.CountyId == …)` discipline | **OPEN** | PR-2 (auth criticals) — restore query filter as defense-in-depth |
| 7 | **AC-3** Permission Checks | `InMemorySecurityService.HasPermissionAsync` always returns `true` — bypasses authorization entirely | **OPEN** | PR-2 (auth criticals) — replace with real RBAC evaluator OR refuse to register in non-Test environments |
| 8 | **SC-23** Session Authenticity | JWT stored in `localStorage` (XSS-exposed) | **PARTIAL / KNOWN-ACCEPTED** | Tracked as F-07 in `frontend/.../securityBaseline.ts`; httpOnly cookie migration scheduled post-immediate-week |
| 9 | **AU-12** Audit Generation (immutable artifact) | Production deploy script builds local container images with no immutable tags; rollback evidence is unreliable | **OPEN** | PR-4 (infra criticals) |
| 10 | **CM-3 / SA-10** Configuration Change Control | No required-status-check enforcement on `main`; force-push possible | **OPEN** | PR-5 (CI/CD criticals) |
| 11 | **SC-12 / SI-7** Secrets in Config | `appsettings.{Env}.local.json` files commit-able in worktree (gitignored, but discovered by audit); historic JWT/DB secrets in older configs | **OPEN** | PR-2 + repo-hygiene sweep |
| 12 | **AU-9** Protection of Audit Information | Audit log write path is in-band with the request lifecycle; an unhandled exception in business logic can drop the audit row | **OPEN** | PR-3 (observability criticals) |
| 13 | **IR-4** Incident Handling | No documented incident-response runbook for security events in the SOC backlog | **OPEN** | Out-of-scope for immediate-week; tracked separately |

## What IS implemented today

These controls are real, verified by the Prometheus audit, and should be preserved as-is:

- **PII redaction at canonical write-time** — `PacsOwnerCanonicalProjector` blanks `FirstName` / `LastName` / `BirthDt` whenever `ConfidentialFlag = true`. This is fail-closed (the redaction happens at the projector boundary, not at the read API).
- **HMAC-signed evidence packets** (Workbench-H) — signature is length-checked and fail-closed; cannot be silently downgraded.
- **Per-row `AuditLogs` rows exist** — every write goes through the audit path. The *attribution columns are fake* (gap #2 above), but the row volume and timing data are real and recoverable.
- **Migrations have real `Down()` methods** — verified by the audit; no `NotImplementedException` stubs that would block rollback.
- **Snyk** dependency scanning on every PR.

## In-flight remediations (immediate-week tranche)

This baseline is PR-1 of 5. Parallel PRs landing the actual fixes:

- **PR-2** — Auth criticals (gaps 1, 2, 3, 4, 6, 7, 11)
- **PR-3** — Observability criticals (gaps 5, 12)
- **PR-4** — Infra criticals (gap 9)
- **PR-5** — CI/CD criticals (gap 10)

This file MUST be updated as each PR lands — a gap moves from **OPEN** to **CLOSED** only when a PR with the fix is merged AND a regression test exists in the gate.

## Reference

Project Prometheus audit, conducted **2026-05-12** by the Elite Engineering Cloud Coach orchestrator (T3 Security workstream). Full findings available on request from the assessor's office or the audit owner.

## Doc-truth contract

Any markdown file in this repository that claims "FISMA-HIGH compliant" or "FISMA-HIGH compliance" (rather than "FISMA-HIGH posture target") without linking to this baseline is **stale by definition** and should be corrected on sight. The destination is FISMA-HIGH; the present is "in flight."

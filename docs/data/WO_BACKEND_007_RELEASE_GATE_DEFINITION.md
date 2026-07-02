# WO-BACKEND-007 — Release Gate Definition

**Program:** P3 — Backend Operational Excellence
**Date:** 2026-07-02
**Mode:** Docs synthesis (R1). No code, no runtime change, no deployment.
**Sources:** Observed CI checks (this session's PRs) + `.github/workflows/*` + BACKEND-001..006 findings.
**Authority Boundary:** SW-01/02/03/09/10 not crossed.

---

## 0. Purpose

Define what "release-ready" means for `TerraFusion.API`, grounded in the gates that actually run and
the runtime-truth criteria established by BACKEND-001..006. This is the **standard a backend change
must clear** before it reaches the demo (and, later, a county). Synthesis only — it does not change
any gate.

---

## 1. Gates That Actually Run (observed on this session's PRs)

These are **required** status checks on `main` (block auto-merge until green):

| Gate | Enforces |
|------|----------|
| **Warning Gate (0 warnings tolerance)** | `dotnet build TerraFusion.sln -c Release /warnaserror` → **0 emitted warnings** (`ci.yml:256`) |
| **Backend Gate (.NET 8) / Canonical .NET Test Run** | full backend build + `TerraFusion.API.Tests` |
| **⚙️ Backend Fast Gate** | restore + `/warnaserror` build + **unit tests incl. `TerraFusion.Unit.Tests`** (catches breaks the canonical gate misses — proven by the BACKEND-004 recovery) |
| **Quality Gate Validation** | quality checks |
| **Canon Gates** | canonical spine / constitution checks |
| **Drift Guard (dotnet canonical)** · **Snyk Drift Guard** | dependency/CVE drift |
| **Migration Apply Check** | EF migrations apply cleanly |
| **Evidence Gate (r1:verify-evidence)** | evidence artifacts present |
| **🔒 SEAL / 🔒 TerraFusion Seal Gate** | aggregate enforcement (fails if any sub-gate fails) |
| **required_conversation_resolution** (branch protection) | all bot review threads resolved |

**Non-blocking / informational:** CodeQL, Trivy (NEUTRAL), Frontend gates (skipped for backend-only PRs).

---

## 2. Runtime-Truth Criteria (from BACKEND-001..006)

Beyond "it builds and tests pass," a backend release must be **honest about its runtime**. The audits
established these criteria:

| Criterion | Source | Release bar |
|-----------|--------|-------------|
| Health surfaces do not contradict | BACKEND-001 F1-F3 | `/health/ready` gates on real init (200 Ready / 503 NotReady) — **met (BACKEND-004)** |
| Degraded state is reported honestly | BACKEND-001 | `/api/system/health` returns real `Degraded` (not faked Healthy) — **met** |
| Build provenance is present | BACKEND-001 F5 | `/health` `gitSha` is a real commit when built in CI — **met (BACKEND-005)**: `GITHUB_SHA`→`InformationalVersion` |
| 0 emitted warnings | BACKEND-002 | `/warnaserror` gate green — **met** |
| Config truth (no misleading proofs) | BACKEND-001 F4 | `/ops/pacs/proof` should reflect the actual DB, not the dev SQLite — **OPEN** (parked WO) |
| Auth is deny-by-default + no prod bypass | BACKEND-006 | FallbackPolicy=RequireAuthenticatedUser; dev-token `IsDevelopment()`-gated; prod secret env-driven — **met (proven)** |
| Service topology is honest | BACKEND-003 | `/api/service-registry` should not imply an absent multi-service topology — **OPEN** (single-service demo; low priority) |

---

## 3. The Release Gate (definition)

A backend change is **release-ready to the demo** when ALL hold:

1. **All required CI gates green** (§1) — including the Fast Gate (unit tests) and Warning Gate.
2. **Runtime-truth criteria met or explicitly waived** (§2) — no NEW health/provenance/auth regression.
3. **Diff is intended-files-only** — verified via `git show --stat` + `gh api compare` (post-incident discipline).
4. **Honest disclosure** — no fabricated metrics, no stale counts (`84,418` parcels, not `89,247`); degraded/unavailable states surfaced.
5. **No unauthorized wall crossing** — SW-01 (deploy), SW-02 (mutation), SW-03 (secrets), SW-09 (runtime), SW-10 (auth) only with explicit authorization.

**Promotion beyond the demo (county go-live) is SW-04** and out of scope for this gate.

---

## 4. Known Open Gates (not blockers for the demo; each a future WO)

| Open item | Criterion | WO |
|-----------|-----------|----|
| `/ops/pacs/proof` reports dev SQLite (`terrafusion-dev.db`), not the Azure PG | Config truth (F4) | backend config-truth WO |
| `CanonicalDebugController` `[AllowAnonymous]` on mutation endpoints | Auth defense-in-depth | WO-BACKEND-SEC-DEBUG-001 (operator decision) |
| `/api/service-registry` empty / implies absent topology | Topology honesty (F1/F3 of BACKEND-003) | backend config WO |
| App Service health-check-path points at shallow `/health` | Liveness truth (F1) | deploy WO (SW-01) — point at `/health/ready` |
| LDAP/AD production integration stubbed (fail-closed) | Auth completeness | separate WO |

---

## 5. Recommendation

Adopt §3 as the written **backend release gate** and reference it from the operational runbook
(BACKEND-008). The CI gates already enforce §1; §2/§3 add the runtime-truth + honesty + intended-diff
discipline this session proved necessary (two CI breaks were caught by §1's Fast Gate + §3's
intended-diff check).

---

**WO-BACKEND-007: COMPLETE (definition).** Pairs with WO-BACKEND-008 (operational runbook).

# WO-BACKEND-002 — Build Warning Posture Verification

**Program:** P3 — Backend Operational Excellence
**Date:** 2026-07-01
**Mode:** Read-only verification (R0). No build mutation, no code change, no new artifacts generated.
**Sources:** `main` CI config + committed warning artifacts.
**Authority Boundary:** SW-02/SW-03 not crossed. **No duplicate register created** (see §3).

---

## 0. Headline

**The backend warning burn-down is effectively COMPLETE and gated.** The CI Warning Gate builds the
full backend solution with `/warnaserror` and **passes on every merge** → the current build emits
**0 warnings**. The frequently-cited "2,233 warnings" figure is a **quarantined historical snapshot**,
not the current state. No new warning register is needed; creating one would duplicate existing
artifacts and misrepresent current posture.

---

## 1. The Live Gate (authoritative current signal)

`.github/workflows/ci.yml` → job `warning_gate` ("Warning Gate (0 warnings tolerance)"):

```bash
dotnet restore backend/TerraFusion.sln
dotnet build backend/TerraFusion.sln -c Release /warnaserror --no-restore
# + publish check for NETSDK1194
```

`/warnaserror` promotes **any** emitted warning to a build error. The gate is **green on merged PRs**
(observed on recent PRs, e.g. #1121). Therefore the current `Release` build of `TerraFusion.sln`
emits **zero warnings** — this is enforced, not asserted.

---

## 2. The "2,233" Figure Is Historical

`QUARANTINE/root-artifacts/dotnet-warning-taxonomy.json` reports `totalWarnings: 2233`:

| Code | Count | Nature |
|------|-------|--------|
| CS1591 | 1,748 | Missing XML doc comment — **only emitted when `GenerateDocumentationFile=true`** |
| CS8618 | 275 | Non-nullable field uninitialized |
| CS1998 | 146 | async method without await |
| CS8603/8601/8604/8602/8605 | ~40 | nullable-reference flow |
| CS0618/0169/0414/0162/0649/1572/1587 | ~23 | obsolete / unused / misc |

This artifact lives under `QUARANTINE/` (archived, not active). It was generated under a stricter /
doc-generating build config. The dominant CS1591 class (78% of the total) **does not emit** in the
standard build because `GenerateDocumentationFile` is not enabled — which is why the `/warnaserror`
gate passes at 0 despite the historical count. `backend/Directory.Build.props` uses **per-advisory**
suppressions (not a blanket `NoWarn`), consistent with a real 0-warning build rather than a masked one.

---

## 3. Why No New Register (non-duplication)

Existing warning artifacts already cover this ground:
- `.ci_artifacts_local/dotnet-warnings.json` (CI artifact)
- `QUARANTINE/root-artifacts/dotnet-warning-snapshot.json`, `dotnet-warning-taxonomy.json`
- `scripts/governance/warningsGate.mjs` (governance script)
- Prior burn-down work merged (e.g. PR #1120 "burn down API test nullable warnings")
- Stale local branches `wo/backend-warning-baseline` / `-2` (no open PRs — not active)

Producing a fresh register would duplicate these and, worse, re-surface the historical 2,233 as if
current. The correct posture is **verification**, done here.

---

## 4. Honest Nuance

- "0 warnings" = **0 emitted** warnings under the gated `Release` build. It is not a claim that the
  codebase has zero latent issues (e.g., CS1591 doc coverage is simply not required).
- If a future WO enables XML doc generation, CS1591 would re-emit at scale — that would be a
  **scope decision** (doc-coverage policy), not a regression, and belongs in its own WO.

---

## 5. Recommendation

- **Close WO-BACKEND-002 as verified-complete.** The 0-warning `/warnaserror` gate is the standing
  control; no burn-down backlog exists in the gated build.
- Optionally (future, low priority): move the historical `dotnet-warning-taxonomy.json` note into a
  short "historical" header so the 2,233 figure is not mistaken for current state.
- Do **not** enable `GenerateDocumentationFile` without a deliberate doc-coverage WO.

---

## 6. Evidence Log

- Gate: `.github/workflows/ci.yml:256-291` (`/warnaserror` full-sln build, passing on merges)
- Historical taxonomy: `QUARANTINE/root-artifacts/dotnet-warning-taxonomy.json` (`totalWarnings: 2233`)
- Suppression policy: `backend/Directory.Build.props` (per-advisory, no blanket NoWarn)
- No `GenerateDocumentationFile=true` found in backend build props (CS1591 does not emit)
- Governance script: `scripts/governance/warningsGate.mjs`

---

**WO-BACKEND-002: COMPLETE (verified — burn-down gated at 0; no duplicate register created).**
Next in program: WO-BACKEND-003 (Service Registry Validation — read-only).

# Loop 5 — Residual Verification

*Closes the small Loop-4 residuals. Verification only; recovery lock ACTIVE.*

---

## Residual 1 — CurrentUse context reachability → RESOLVED (it IS live)

`CurrentUseDbContext` is **authoritative/live-wired in the API**, not a ghost:
- `TerraFusion.API/Program.cs:2519` → `builder.Services.AddCurrentUseServices(builder.Configuration);`
- API csproj references the project (`TerraFusion.API.csproj:69`).
- Extension defined at `CurrentUseServiceExtensions.cs:24` (`AddCurrentUseServices`), 3 conditional `AddDbContext<CurrentUseDbContext>` variants (dedicated connection; a test confirms it *ignores the global SQLite hint* → its own DB).
- Also has a standalone host (`TerraFusion.CurrentUse.Host/Program.cs:9`).

**Consequence — the live API process hosts FOUR persistence contexts across 3–4 databases:**

| Context | Database | Role |
|---|---|---|
| `TerraFusionDbContext` | main (`DefaultConnection`) | domain (authoritative) |
| `TerraFusionContext` (Identity) | **same main DB** | auth/seed |
| `LevyDbContext` | separate (`LevyDatabase` / `levy-dev.db`) | levy |
| `CurrentUseDbContext` | dedicated (schema `currentuse`) | current-use |

Truth-table status for CurrentUse upgraded: **ghost/unresolved → PARALLEL (live, dedicated DB)**.

---

## Residual 2 — CI signal distortion, enlarged sample → REFINED

**Method (replayable):** `pull_request_read get_check_runs` returns the *resolved/latest*
check-run state per PR head. Classify each substantive + Seal-Gate check.

**Sample: 6 PRs** (PR #1080 from Loop 4 + 5 recent closed: 1078, 1075, 1072, 1071, 1015).

| PR | Final Seal Gate | Substantive jobs (Vitest/Backend/Frontend/Security) | total checks | Class (final state) |
|---|---|---|---|---|
| 1078 | success | all success | 68 | clean |
| 1075 | (light run, 4 checks; docs/agent) | n/a | 4 | clean |
| 1072 | success | all success | 67 | clean |
| 1071 | success | all success | 69 | clean |
| 1015 | success | all success | 55 | clean |
| 1080 (Loop 4) | failure ×4 on **superseded** commits; HEAD settling green | pass when uninterrupted | — | **foot-gun (transient only)** |

**Refined finding (this corrects the Loop-4 lean on a transient sample):**
- In the **final settled** check state, **5/5 closed PRs were fully GREEN** — their
  closed-unmerged status was the **recut/cherry-pick workflow, NOT CI failure**
  (reinforces Lane 3 / XJ-5 from the opposite direction: closed-unmerged ≠ failed).
- The Seal Gate **cancelled-as-failed foot-gun corrupts TRANSIENT, per-superseded-commit
  signals** (the webhook-delivered failures on #1080), **not the final resolved PR state**,
  which settles green once the last run completes uninterrupted.
- **Net for branch trust (precise):**
  - Disposition based on a PR's **final resolved CI state** → relatively safe.
  - Disposition based on **transient/historical per-commit failures**, or on PRs **abandoned
    mid-flight** (never reached a clean final run) → **unsafe** (Hard Rule 5 still applies there).
- **Bonus (F13 quantified):** each PR fires **55–69 check runs** — concrete confirmation of
  the ~91-workflow sprawl; the vast majority are skip/trivial governance/incident/break-glass checks.

**Scope honesty:** sample n=6 PRs (1 transient-observed + 5 final-state). Not the full
population; method is specified for extension. No population rate estimated.

---

## Residual 3 — cert/levy data home → OWNER PRODUCT QUESTION (not forensic)

Forensic fact (Loop 4): `LevyCertification` data bifurcates — cert/Dais surface writes the
**main DB** (Core entity), the Levy module writes the **Levy DB** (Levy entity). Whether
these *should* be one source of truth is a **product/architecture decision**, not a forensic
one. **Surfaced for owner; deliberately unresolved here.** (No edits — recovery lock.)

---

## Loop 5 outcome
All three residuals closed (1 resolved, 1 refined, 1 correctly escalated). **No new disorder
category.** Loop-4's exit-gate verdict stands and is strengthened: the CI-distortion concern
is now precisely bounded (transient vs final), and the persistence truth table is complete
(4 live contexts, 3–4 DBs). The bar to *consider* salvage planning remains cleared; releasing
the recovery lock is the owner's decision.

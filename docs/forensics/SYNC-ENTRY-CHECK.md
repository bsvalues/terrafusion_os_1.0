# Sync Entry-Check Package (read-only; lock ACTIVE)

*First Tier-1 domain entry-check, per `TIER1-PORT-PLAN.md` §1 (Sync). **Read-only**:
`git diff`/`rev-list` only — no merge, no cherry-pick, no checkout-mutation, no lock release.
Method = **content-presence, not branch status** (recut-aware; Lane 3 doctrine).*

> **Headline verdict (corrects the Tier-1 plan's premise):** the named legacy Sync heads are
> **SUPERSEDED** — `main`'s sync engine is a near-strict **superset** of every one of them
> (main ahead by **393–5,360 lines**; branch-only ≤ **41 lines**, mostly *older* variants).
> The one merge-candidate "bridge" (`codex/sync-db-evidence-runtime-path`) is real and additive
> but **mis-domiciled** — it carries **Pilot-evidence + Forge County-Studio**, **zero** backend
> sync engine. ⇒ **There is no clean Sync-domain first-release candidate among these heads.**
> The genuine Sync ingress already landed in `main` via recut and evolved past the legacy work.

---

## A. Evidence base (all vs current `origin/main` @ `2ae013561`)

| Source head | merge-base w/ main | ADDED (branch-only) | MODIFIED (in both) | sync-subset: branch-only lines | sync-subset: main-ahead lines |
|---|---|---|---|---|---|
| `feat/sync-complete-2-v3-year-sliced-imprv-attr` | **NONE** (port-only) | 62 (100% test/e2e) | 349 | 17 | 393 |
| `feat/sync-doctrine-4-impl-v9-hosted-test` | **NONE** | 62 (100% test/e2e) | 360 | 29 | 2,938 |
| `feat/sync-pop-4c-canonical-parcel` | **NONE** | 62 (100% test/e2e) | 389 | 41 | 5,360 |
| `feat/sync-pop-4d-final-closure` | **NONE** | 62 (100% test/e2e) | 389 | 41 | 5,360 |
| `feat/attr-pop-1-attribute-dictionary-populator` | **NONE** | 62 (100% test/e2e) | 390 | 41 | 5,001 |
| `feat/attr-pop-2-value-grain-populator` | **NONE** | 62 (100% test/e2e) | 392 | 41 | 4,598 |
| `codex/sync-db-evidence-runtime-path` (bridge) | `16f7d6353` ✅ | 20 (17 pilot-evidence / 2 forge / 1 test) | 130 | — (no backend sync touch) | — |

*sync-subset = `Core/Sync/**`, `Data/Services/{LegacyPacsRaw,TruthPacs,CanonicalTf}/**`, `Core/GIS/**`.*

**Shared residual floor — CHARACTERIZED:** the **62 ADDED branch-only files are 100% the
e2e/test noise floor** (61 `os-platform/development` e2e + 1 `tests/costforge-ai`), uniform across
every head, **0 genuine new source**. So **true-residual of new source = 0** (plan's claim holds);
the *only* genuine residual is the small **modified-file hunk delta**, and that delta runs the
**wrong way** (main ahead).

---

## B. Compact entry-check table
`source head → target files in main → residual type → actionability → owner fence → notes`

| Source head | Target files in main | Residual type | Actionability | Owner fence | Notes |
|---|---|---|---|---|---|
| All 6 legacy heads (`sync-complete-2-v3`, `sync-doctrine-4-v9`, `sync-pop-4c/4d`, `attr-pop-1/2`) | sync engine **already present & richer in main** (`PacsSaleTruthPromoter`, `PacsImprvCanonicalProjector`, `ArcGis*`, `Pacs*LandingService`, `*TruthPromoter`, canonical readers) | **SUPERSEDED** (main superset; branch = recut ancestor) | **DO NOT PORT** — wholesale port strips 393–5,360 lines from main = **regression** | PACS source-of-truth direction (PACS→TF) immutable; county isolation | branch fragments are *older* logic (e.g. hardcoded `ValidSaleCode="100"` vs main's `CountyRatioCodebook`/`IRatioQualificationPolicy`) |
| same — the **≤41 branch-only lines** | a handful of files where branch has lines main lacks | **MICRO-IMPROVEMENT candidates** (defensive fragments) | **per-fragment look only**, low value; verify main doesn't already cover via reworked policy layer | PACS direction; county isolation | concrete fragments listed in §C; mostly already-handled-differently in main |
| `codex/sync-db-evidence-runtime-path` | `os-platform/core/pilot/**`, `frontend/.../forge/county-studio/**` (NOT backend sync) | **ADDITIVE / NEW** (ahead 17, behind 150; +6,991/−265; 20 new files) | **mergeable but NOT a Sync release** — reclassify to **Pilot/Forge** path; needs rebase over 150 commits (30 modified county-studio files main has evolved) | county sovereignty (it asserts county-studio sovereignty contracts) | name "sync-db-evidence" is misleading — it is *sync-drain-state **evidence*** (pilot readiness) + County-Studio UI, a Forge/Pilot asset |

---

## C. The only genuine "new" surface — branch-only fragments (sync-pop-4d, representative)
*These are the entire improvement candidate set. Each needs a "main already covers this?" check
before any cherry-pick is even proposed. Most are older variants main has reworked.*

| File | Branch-only fragment | Likely disposition |
|---|---|---|
| `TruthPacs/PacsSaleTruthPromoter.cs` | inline `ValidSaleCode="100"` + stale-axis/supp-pointer rejection counters | **superseded** — main moved this to `CountyRatioCodebook`/`IRatioQualificationPolicy` (a more-evolved policy layer) |
| `GIS/ArcGisRest/ArcGisNightlySyncHostedService.cs` | malformed-county-key `Guid.TryParse` guard + structured skip-log | **verify** — possible genuine defensive micro-improvement if main lacks the guard |
| `Sync/PacsWsdorCanonical/ITfParcelWsdorReader.cs` | richer XML-doc three-state lookup contract (NotFound/NoEntries/Found→404) | **doc-only** — interface exists in main; port docs only if main's is thinner |
| `GIS/ArcGisRest/ArcGisFeatureServiceClient.cs` | per-county config binding (`GetForCounty`, `BuildQueryUrl`) | **verify vs main's −139-line rework** — likely main has a different (newer) county-config path |

Net: 1 doc improvement, ≤2 defensive-guard candidates, the rest superseded. **No engine-level value.**

---

## D. Summary verdict (the four buckets requested)

1. **What is genuinely new:** essentially nothing at the engine level. Only ~2 small defensive
   fragments (malformed-county-key guard; possibly the per-county ArcGIS binding) and 1 doc-comment
   improvement — all needing a "main already covers this?" confirmation, all low-value.
2. **What is already superseded:** the **entire legacy Sync engine** on all 6 heads. Main is a
   near-strict superset (recut descendant + 150-commit evolution). Porting them = regression.
3. **What is unsafe until later:** the `codex/sync-db-evidence-runtime-path` bridge — *safe to
   merge in principle* (real merge-base, additive) but **not as a Sync release**: it is Pilot/Forge
   content, is 150 commits behind, and would need rebase + County-Studio conflict resolution.
   Defer to the **Forge/Pilot** path, not Sync.
4. **First narrow Tier-1 release candidate:** **NONE in the Sync domain from these heads.** The
   correct next action is **not** a Sync port — it is to (a) record this supersession finding,
   (b) **re-point the Tier-1 plan**: Sync ingress is *already landed*; the live question shifts to
   Dais/Levy (the ratified Option-C SoR, genuinely not yet in main) and the Forge/Pilot bridge.

---

## E. Doctrine notes
- **HR-6 honored:** did not collapse from counts alone — characterized the 62-file floor *and*
  inspected the ≤41 branch-only lines per head before declaring supersession.
- **Content-presence beat branch status again:** branch names ("complete", "final-closure",
  "v9-hosted-test") implied pending value; content shows recut ancestors of already-landed work.
  This is the **same pattern** as the v2 batch-landed check — now confirmed for Sync specifically.
- **Lock remains ACTIVE.** No code, no merge, no cherry-pick, no release. This artifact is a
  read-only entry-check; it *recommends against* opening a Sync port and *re-aims* Tier-1.

## F. Recommendation (for owner ratification)
1. **Close the Sync legacy-port lane** as *superseded-by-main* (do not open a narrow Sync release).
2. **Reclassify** `codex/sync-db-evidence-runtime-path` from "Sync bridge" → **Forge/Pilot
   candidate** in `TIER1-PORT-PLAN.md`.
3. **Advance the real critical path to Dais/Levy** — run the equivalent entry-check on the
   `r2/*` Levy heads (characterize the suspected ~42 floor first), since that is where genuinely
   not-yet-landed value (the ratified Option-C SoR) actually sits.

# Cross-Lane Contradiction Synthesis (Loop 3)

*Synthesis pass — not new broad auditing, not recovery.* Joins findings across lanes to
expose contradictions that no single lane could see. Recovery lock: **ACTIVE**.

---

## XJ-1 — F11 ↔ F13 : do ghost workspaces feed fake build/CI assumptions?
**Question:** does the misleading workspace layer leak into CI/build truth?
**Finding (medium confidence):** Partly contained. CI build entrypoints are grounded in
*real* targets (`backend/TerraFusion.sln`, `pnpm -C frontend build`), and the classifier
keys off real paths — so the ghost `applications/`/`src/`/`SDK/` roots from
`.workspace-map.json` do **not** appear to drive the merge-gate build. **But** `dev-os.mjs`
(the launcher) scans the non-existent `applications/` dir, so *local* dev/launch truth is
already diverging from *CI* build truth. **Verdict:** ghost structure has NOT yet poisoned
CI, but the launcher and CI now disagree on what the app set is.
**Deferred:** grep CI workflows for any reference to ghost roots (Loop 4).

## XJ-2 — F11 ↔ F16 : who maintains the misleading workspace layer?
**Finding (high confidence):** No one. `.workspace-map.json`, `dev-os.mjs`, and the
launcher/workspace layer have **no CODEOWNERS steward** (F16). The authority illusion
persists precisely because the ghost map is unowned and stale (last touched 2025-10-10,
Windows root). **Verdict:** RF-5 (ghost authority) is sustained by RF-2 (ownership vacuum)
— they are the same failure viewed from two angles.

## XJ-3 — F14 ↔ F15 : do schema lineages map to different config/env roots?
**Finding (high confidence):** Yes — the fracture is consistent across both layers.
- `CurrentUseDbContext` hardcodes PG schema `"currentuse"` (F14) and has its own connection
  wiring (`CurrentUseServiceExtensions.cs`, 3 AddDbContext variants) — a distinct env path.
- `LevyDbContext` keys off `LEVY_DATABASE_URL` / `ConnectionStrings:LevyDatabase` (separate
  connection string) vs `TerraFusionDbContext`'s `DefaultConnection`.
- This means **3 contexts → up to 3 connection-string/env surfaces**, layered on top of the
  `config/`↔`configs/` and `appsettings`↔`api-unified` duplication (F15).
**Verdict:** persistence fracture (RF-1) and config fracture (RF-3) are coupled — a single
DB recovery must reconcile *both* schema lineage *and* its env/connection surface.

## XJ-4 — F14 ↔ Runtime Truth : which lineage does the live spine actually use?
**Finding (high confidence — grounded in `TerraFusion.API/Program.cs`):**
- Live API wires **`TerraFusionDbContext`** as the primary (registered ~20+ times across
  conditional branches; the real spine context) — plus a separately-named
  **`TerraFusionContext`** (`:2293`; also used by Consciousness `Program.cs:91`) and
  **`LevyDbContext`** (`:2477`).
- `CurrentUseDbContext` is wired via its module extension (`CurrentUseServiceExtensions`).
- **Therefore the dual `LevyCertification` (Core simple vs Levy complex) is co-loaded in the
  SAME live process** → the ambiguity is operational, not archival.
- **Open flag:** is `TerraFusionContext` an alias of `TerraFusionDbContext` or a real second
  core context? If the latter, the live spine has *two* core contexts — escalate.
**Verdict:** the live persistence spine is `TerraFusionDbContext`, but it does **not** run
alone; Levy (and the context-name ambiguity) ride alongside it. Schema recovery is hazardous
until `TerraFusionContext` vs `TerraFusionDbContext` and the dual LevyCertification are resolved.

## XJ-5 — F13 ↔ Branch Census : how many branches/PRs were wrongly judged failing?
**Finding (mechanism confirmed, magnitude deferred):** The Seal Gate cancelled-as-failed
foot-gun (RF-4) demonstrably produces phantom failures (observed 3× on PR #1080 superseded
commits). This means historical "failing" signals on branches/PRs are **not trustworthy as
evidence of code failure** without re-classification. **We cannot yet quantify** how many of
the 742 branches / closed-unmerged PRs were mis-judged — that requires replaying per-PR CI
conclusions and separating `cancelled` from `failure`.
**Action:** Lane 3 (PR disposition) must, in Loop 4, tag each PR's CI signal as
real-fail / governance-fail / foot-gun before using it. **No branch may be dispositioned
`ignore` on the basis of a CI "failure" until reclassified (Hard Rule 5).**

## XJ-6 — F16 ↔ Canon-vs-Actual : which "complete" claims have no runtime evidence?
**Finding (high confidence):** The canon-vs-actual contradictions (Lane 6) and the
false-completion register (F16) are the same set viewed twice:
- "1,008 agents" / "50,000 agents" / "Consciousness operational" → contradicted by runtime
  (stubs return "lane unavailable"); **complete-claim with zero runtime evidence**.
- "FISMA-HIGH" / "sealed" / "AuditableEntityInterceptor" → contradicted by `security/baseline.md`
  and missing interceptor; **complete-claim outrunning code**.
- Only **W5F** (and scoped Phase-20) carry evidence gates.
**Verdict:** treat the docs/claims layer as **high-noise unless evidence-backed** (Hard Rule 4).
The ~412 completion docs are a *narrative* surface, not a *truth* surface.

---

## Net synthesis
Three findings are now **primary hidden-system generators**: **ghost structure (RF-5)**,
**schema/config fracture (RF-1+RF-3)**, and **false authority / false completion (RF-2)** —
with **CI signal distortion (RF-4)** amplifying all three by making branch/PR truth
unreliable. Dependency truth (F12) is cleared. The cross-joins show these are not six
independent problems but a smaller number of coupled failures: *unowned ghost authority*
that nobody reconciles, *fractured persistence/config* that the live spine actually carries,
and a *narrative + CI signal layer* that disguises both.

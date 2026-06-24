# Forensic Recovery — Hard Rules (promoted from findings)

*Loop 3.* These are **binding rules**, promoted from Loop 2 findings + Loop 3 synthesis.
They extend the playbook's Operating Doctrine. They apply to all subsequent loops and to any
recovery action.

## HR-1 — Workspace artifacts are non-authoritative unless runtime/build truth confirms them
`.workspace-map.json`, `*.code-workspace`, `dev-os.mjs` scan targets, IDE configs, and
devcontainer layers are **evidence of intent, not structure**. Structural truth is only what
`platform.json` + `pnpm-workspace.yaml` + `terrafusion.app.json` + actual build/runtime
wiring confirm. *(Source: F11 / RF-5.)*

## HR-2 — Schema truth must be lineage-classified before any persistence recovery work
No migration, DbContext, entity, or DB-touching change proceeds until its **lineage**
(which of the ≥3 contexts) and **conflict status** are classified. The dual `LevyCertification`
and the `TerraFusionContext` vs `TerraFusionDbContext` ambiguity must be resolved first.
Code presence ≠ valid persistence lineage. *(Source: F14 / RF-1.)*

## HR-3 — Rotated secrets do not close F15
Credential rotation fixes **exposure posture**, not **config topology**. F15 stays open
until config is singular (resolve `config/`↔`configs/`, `appsettings`↔`api-unified`),
runtime port contracts are validated (dev-compose vs `platform.json`), and stale committed
values are externalized to `${TF_*}`. *(Source: F15 / RF-3.)*

## HR-4 — No "complete" claim is valid without evidence-backed runtime/build/merge proof
A `*COMPLETE.md`, `*SUCCESS.json`, status endpoint, or canon assertion is **narrative, not
truth**, unless tied to a verified runtime/build/merge artifact (e.g. W5F's evidence gates).
Default posture for the ~412 completion docs: **high-noise until proven**. *(Source: F16, Lane 6, Lane 9 / RF-2.)*

## HR-5 — CI failure signals must be classified before they influence branch disposition
Every CI "failure" is tagged **real-fail** / **governance-fail (soft-gate)** /
**workflow-foot-gun (e.g. Seal Gate cancelled-as-failed)** before it is used as evidence.
No branch/PR may be dispositioned (esp. `ignore`) on the basis of an unclassified CI failure.
*(Source: F13 / RF-4; observed live on PR #1080.)*

---

## Two-truths principle (generalized from F15)
A finding can have a **historical truth** (what happened / what is in the record) and a
**current operational truth** (present posture). Resolving the latter (e.g. rotating secrets)
**changes risk posture but does not erase the forensic fact**. Both truths are recorded;
neither overwrites the other. *(Source: F15 secret rotation, 2026-06-24.)*

## HR-6 — Reclassify by evidence, not vibe (value ≠ runtime ≠ naming)
Three axes are independent and must not be collapsed: **(a) marketing/naming**,
**(b) runtime status** (REAL/LATENT/MOCKED/FICTION — F17), **(c) latent engineering value**
(the 5 tiers — F18). Bad marketing ≠ bad substance; MOCKED/FICTION *at runtime* ≠ no *value*.
- The repo already suffered **failure mode #1: believing claims too easily.** Do not now commit
  **failure mode #2: discarding real work because the packaging is embarrassing.** Both lose value.
- Decide salvage on the **value tier + claim-stripped residue** (strip the mythology — what
  still does something useful?), never on naming or current wired-status.
- **Simulations, benchmarks, and provenance manifests are relabeled honestly, not discarded.**
  A "stub" that contains real math (e.g. IAAO COD/PRD) is promoted, not deleted.

### Value tiers (F18 / owner taxonomy)
1. Real & useful · 2. Experimental but real · 3. Simulated/benchmarked (honest relabel) ·
4. Presentation-heavy / weakly grounded · 5. Fictionalized (trash).
Tier 1–2 = salvage-eligible; 3 = keep as labeled artifact; 4 = honest placeholder /
implement-or-strip-claim; 5 = archaeology/deprecate.

## HR-7 — Recover into the future topology, not the old repo; salvage ≠ migration
Recovery's goal is **"recover the right assets into the right future homes,"** not "fix the
old monorepo into one forever-repo." Two distinct operations, never conflated:
- **Salvage** = find/preserve real value (R12).
- **Migration** = place it in the correct **new** repo (TerraFusionOS / Sync / Dais / Atlas /
  Forge / Dossier / legacy-only). Migration waits until target repos exist AND the core spine is proven.
- **Every needle carries `future_repo_target`.** "Valuable" is insufficient — it must be correctly placed.
- **Do not pull wrapper noise forward** (ghost workspace layers, fake platform wrappers, suite
  logic disguised as core, Levy-as-platform confusion, MOCKED/FICTION theater) — a cleaner
  topology must not re-import the old blur.
- **Topology-aware, phased** (A classify → B core → C platform/Sync → D suites). Beware the new
  failure mode: **premature split** before enough is known. Decide homes now; extract last.
*(Source: owner topology decision, 2026-06-24; `RECOVERY-TOPOLOGY-MATRIX.md`.)*

## HR-8 — Split boundaries are owned, not assumed (split ≠ duplicate)
When a surface splits across the new topology, the boundary must be explicit or the split does
not happen. Binding sub-rules (see `RECOVERY-TOPOLOGY-MATRIX.md`):
- **shared-contracts is a real home:** shared interfaces / event contracts / DTOs / cross-repo
  API / workbench tab contracts / sync→suite payloads are **core-OWNED but explicitly shared**,
  never buried in shell code.
- **R-WB:** Workbench is never a domain repo — only host · tab contract · orchestration · route-collapse target.
- **R-ATLAS:** Atlas UI/interaction → Atlas; spatial ingestion/feeds → Sync.
- **R-PILOT:** Pilot stays in core until its AI internals are runtime-real + evidence-backed +
  independently owned + large enough — never split because it "sounds modular."
- **R-SPLIT:** every split surface assigns exactly one owner each for **runtime · contracts ·
  persistence · ingestion · UI host · tests.** Any unfilled cell ⇒ not cleared to split (else
  today's mess is recreated across N repos).

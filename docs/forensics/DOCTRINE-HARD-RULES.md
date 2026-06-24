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

# WO-FECF-002 — Recovery Classification & Topology Eligibility

**Status:** READY FOR AGENT EXECUTION (blocked on prerequisite — see §Prerequisites)
**Mode:** Classification only. **No moves.** No salvage, extraction, port, split, merge, delete, rename, or rewrite.
**Governing doctrine:** FECF (see `WO-FECF-001-FORENSIC-ESTATE-AUDIT.md`, Appendices A–E). This WO inherits the FECF confidence labels and the D-Lexicon, and feeds the Ratification gate (App. E).
**Position in lifecycle:** `Discover (FECF-001) → ▶ Classify (FECF-002) ◀ → Ratify → Recover → Migrate`

---

## 1. Purpose

FECF-001 proved *what exists, what is real, what is live, what is contradicted, what is unknown.* It did **not** decide what to recover or where it should live. WO-FECF-002 is the **missing bridge between forensic discovery and physical recovery.**

Its purpose is **not to move code.** Its purpose is to classify **every recoverable surface** along seven axes so that a later Ratification gate has a complete, confidence-labelled basis to accept or reject — before any Recovery or Migration WO opens.

> If this WO ends with anything moved, extracted, or deleted, it has failed. The only artifact it produces is a **Recovery Classification Register** (§4) and an updated **Topology Hypothesis Register** (FECF-001 App. C2).

## 2. Non-goals (forbidden)

Do **not**: move, copy, extract, port, split, merge, delete, rename, archive, or rewrite any file, branch, or history; create new repos; modify the estate in any way; promote a target home to an approved destination; promote eligibility to approval; promote an Inferred/Suspected finding to Proven; treat this register as authorization for recovery. Recovery and migration are **separate, later, ratified WOs.**

## 3. Prerequisites (gate-in)

1. **Un-shallow the history first** (FECF-001 §16 step 1). Lineage drives reality and topology assignment; a shallow clone floors file ages and hides whether a disconnected surface was previously live. Classification performed on shallow history must be labelled **Unknown (history-blocked)** for any lineage-dependent axis.
2. FECF-001 outputs are available as input (Surface Classification Register A1, Strata Map A2, Promotion Risk Matrix A3, Topology Hypothesis Register C2).
3. Read-only access only. (Un-shallow fetches history; it does not alter tracked content.)

## 4. Required output — the Recovery Classification Register

For **every recoverable surface** (file group, module, package, branch family, or system), record all seven axes. Every axis carries a confidence label: **Proven · Corroborated · Inferred · Suspected · Unknown · Contradicted.**

| Axis | Question | Notes |
|---|---|---|
| **1. Reality** | Is the code substantive, or theater? | Judge by *implementation*, not name (FECF-001 App. A doctrine). |
| **2. Liveness** | Wired into a live build/runtime *now*? | "Unwired ≠ dead" — pair *current liveness* (often Proven) with *prior liveness* (often Unknown until un-shallowed). |
| **3. Authority** | Does it govern process/policy/canon? | Governance-Critical surfaces are recovered differently from leaf code. |
| **4. Recovery value** | Is it worth preserving, and why? | High/Medium/Low/None + rationale. None ≠ delete; it means "not a recovery candidate." |
| **5. Topology eligibility** | Which future home(s) could it belong to? | Use the Topology Confidence Ladder (FECF-001 C1). Multiple/"undecided" allowed. **Hypothesis, not destination.** |
| **6. Confidence** | Overall placement confidence | Lowest of the lineage-dependent axes; never exceeds evidence. |
| **7. Migration prerequisites** | What must be true before any move? | Blocking unknowns (C2), build/owner/security gates, .sln/workspace decisions, dedup vs QUARANTINE copies. |

**Register row shape:**
`surface · reality(conf) · liveness now/prior(conf) · authority(conf) · recovery-value(conf) · topology-eligibility[home…](conf) · overall-conf · migration-prereqs · blocking-unknowns`

### Worked seed rows (from FECF-001, to be expanded)

| Surface | Reality | Liveness (now/prior) | Authority | Recovery value | Topology eligibility | Migration prereqs |
|---|---|---|---|---|---|---|
| `frontend/apps/os-shell/` | real (Proven) | live / live (Proven) | — | High | TerraFusionOS core (Proven) | none material |
| `spec-lock/` + `os-platform/core` gates | real (Corroborated) | governance-live (Corroborated) | Governance-Critical (Corroborated) | High | core (Corroborated) | pick canonical root post-split |
| `backend/src/TerraFusion.Sync` | real (Corroborated) | live / Unknown | — | High | TerraFusion-Sync (Corroborated) | ETL/PACS boundary; PACS stays source |
| `TerraFusion.Levy` (3 locations) | real (Proven) | live / Unknown | — | High | TerraFusion-Dais (**Inferred — roadmap**) | **consolidate 3 copies first**; confirm Dais subsumes vs sibling |
| `web-audit-tracker` | real v1.2.0 (Proven) | unwired / Unknown | — | High | **Undecided** (Unknown) | owner + product decision; build proof |
| `os-platform/specialized/morphic-resonance` et al. | fantasy by implementation (Proven) | unwired / Unknown | — | **None** | legacy-only (Proven) | not a recovery candidate |
| `backend/api-unified` | unknown | unwired / Unknown | — | Low (likely abandoned) | Undecided | **Pass-2 resolved lineage:** abandoned/superseded (first 2025-09-02, last 2026-03-19; FECF-001 App. F); remaining: `.sln`/disposition decision |

## 5. Method (per surface)

Apply **Classification Before Evaluation** (FECF-001 App. A): `classify → liveness → authority → quality → target-home`. Do **not** infer reality from names, nor death from current disconnection. For each disconnected surface, separately establish *current* liveness (often Proven) and *prior* liveness (Unknown until history is un-shallowed). Content-hash candidates against `QUARANTINE/` and `os-platform/` copies to distinguish duplication from divergence before assigning value.

## 6. Handoff to Ratification (App. E gate)

This WO does **not** ratify. On completion it submits the Recovery Classification Register to the Ratification gate (FECF-001 App. E2), which independently checks acceptance, topology acceptance, confidence review, **adversarial challenge**, evidence stability, and blocking-unknown resolution. Only ratified rows may seed a Recovery WO.

## 7. Allowed final states

- **CLASSIFICATION_INCOMPLETE** — coverage of recoverable surfaces below threshold; more passes required.
- **CLASSIFICATION_STABILIZING** — coverage improving, register converging; not yet ready for ratification.
- **READY_FOR_RATIFICATION** — every recoverable surface classified on all seven axes with confidence; blocking unknowns enumerated. Hands off to the Ratification gate. **Does not authorize recovery.**
- **BLOCKED** — required evidence unavailable (e.g. history could not be un-shallowed; lineage axes remain Unknown).

## 8. Stop conditions

Stop and report if: history cannot be un-shallowed (lineage axes stay Unknown); reality cannot be established for material surfaces; topology eligibility conflicts cannot be reduced to labelled hypotheses; or any instruction would require a move/delete/merge/rewrite. **Do not proceed to recovery. Do not convert eligibility into approval. Do not hide unknowns.**

---

*WO-FECF-002 is a classification work order under the FECF governing doctrine. It produces a register, not a change. Recovery and migration are separate, later, ratified work orders. Confidence is not promoted to truth; eligibility is not promoted to approval; a target home is not promoted to a destination.*

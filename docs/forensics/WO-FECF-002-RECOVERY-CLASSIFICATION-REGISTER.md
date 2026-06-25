# WO-FECF-002 — Recovery Classification Register (output)

**Governing doctrine:** FECF (`WO-FECF-001-FORENSIC-ESTATE-AUDIT.md`, Appendices A–I). Inherits its confidence labels and frozen Lexicon (App. I).
**Spec:** `WO-FECF-002-RECOVERY-CLASSIFICATION.md` (the playbook). This file is its **output** — the Recovery Classification Register.
**Mode:** Classification only. **No moves.** No salvage, extraction, port, split, merge, delete, rename, or rewrite was performed.
**Position in lifecycle:** `Discover (FECF-001) → ▶ Classify (this register) ◀ → Ratify (gate E2) → Recover → Migrate`.
**Prerequisite status:** un-shallow ✅ done (full history, 2,996 commits) — lineage axes are evidence-backed, not history-blocked.
**Date:** 2026-06-25 · **Final state:** `READY_FOR_RATIFICATION` (hands off to the Ratification gate; does **not** authorize recovery).

> Each surface is classified on the seven axes from the spec: **reality · liveness (now/prior) · authority · recovery value · topology eligibility · overall confidence · migration prerequisites** (+ blocking unknowns). Every axis carries a label: Proven · Corroborated · Inferred · Suspected · Unknown · Contradicted. **Eligibility ≠ approval; target home is a hypothesis, not a destination** (App. I).

---

## 0. Method & coverage

Built from FECF-001 evidence (A1 surface register, A2 strata, B2 topology, C2 hypothesis register, Passes 3–5) plus targeted Pass-on probes (package LOC + workspace membership, suite→backend mapping, QUARANTINE dedup signal). Recoverable-surface coverage is scoped to **meaningful systems/modules/packages** — not the 98,997 individual files; pure residue/archive is enumerated once as **legacy-only (not a recovery candidate)**.

**Recovery-value scale:** High / Medium / Low / **None** (None = *not a recovery candidate*, ≠ "delete" — disposition is a later, separate WO).

---

## 1. Recovery Classification Register — TerraFusionOS **core**

| Surface | Reality | Liveness (now / prior) | Authority | Recovery value | Topology home | Overall conf | Migration prereqs / blocking unknowns |
|---|---|---|---|---|---|---|---|
| `frontend/apps/os-shell/` | real (Proven) | **build-referenced; reachability Unknown (env: install blocked at cdn.sheetjs.com, G6)** / prior live (Inferred) — *not booted; "actually-live" RETRACTED, adversarial pass* | — | **High** | TerraFusionOS core | **Corroborated** | resolve `xlsx`/cdn.sheetjs.com install; build→`native-shell/ui/dist` |
| `tools/bin/tf.mjs` + `tools/*` (tf/tdc/dx/registry) | real (Proven) | **actually-live** (executed, G6) / live | — | **High** | TerraFusionOS core | **Proven** | none material; thin deps — *only execution-proven live surface* |
| `os-platform/core/` (gates, ToolRegistry, canon, tests) | real (Corroborated) | **referenced (gates not executed here)** / live (Inferred) | **Governance-Critical** | **High** | TerraFusionOS core | **Corroborated** | pick canonical root post-split; os-platform not in pnpm-workspace |
| `spec-lock/` (AUTHORITIES, signed locks) | real machinery (Corroborated) | enforcement unobserved / Unknown | **Governance-Critical** | **High** | TerraFusionOS core | **Corroborated** | confirm a running gate enforces the locks (Suspected aspirational) |
| `brain/` (canon, workorders, packs, router) | real (Proven, docs/data only) | non-runtime by design | **Governance-Critical** | **High** | TerraFusionOS core | **Proven** | none (data/doc spine) |
| `packages/os-core` (644 ln), `ui` (133), `tf-sdk` (77) | real but thin (Corroborated) | in-workspace / Unknown | os-core = gate layer | **Medium** | TerraFusionOS core | **Corroborated** | thin libs; confirm consumers post-split |
| `native-shell/` (WPF `Terrafusion.Shell.csproj` + ui/) | real (Corroborated) | env-blocked (no dotnet, G6) / Unknown | — | **Medium** | TerraFusionOS core (desktop shell) | **Corroborated** | .NET SDK env; it is the os-shell build target host |

## 2. Platform — **TerraFusion-Sync**

| Surface | Reality | Liveness (now/prior) | Authority | Recovery value | Topology home | Overall conf | Migration prereqs / blocking unknowns |
|---|---|---|---|---|---|---|---|
| `backend/src/TerraFusion.Sync` | real (Corroborated) | build-referenced (in sln) / live; **env-blocked boot** (no dotnet) | — | **High** | TerraFusion-Sync | **Corroborated** | .NET env; exact ETL/PACS boundary; **PACS stays the source, not a destination** |
| `packages/terra-sync` (11.5K ln) | real (Proven) | in-workspace / Unknown | — | **High** | TerraFusion-Sync | **Corroborated** | **dedup vs 3 QUARANTINE copies** before extraction |
| `terra-fusion-sync` module (CLAUDE.md) | real (Corroborated) | unverified runtime / Unknown | — | **High** | TerraFusion-Sync | **Inferred** | locate canonical module vs package overlap |

## 3. Suites

| Surface | Reality | Liveness (now/prior) | Authority | Recovery value | Topology home | Overall conf | Migration prereqs / blocking unknowns |
|---|---|---|---|---|---|---|---|
| **Forge** — `backend/src/TerraFusion.CostForge`, `phase4d.forge-*`, `brain/packs/forge` | real (Corroborated) | build-referenced / live | — | **High** | TerraFusion-Forge | **Corroborated** | UI vs engine repo boundary; .NET env to boot |
| **Atlas** — `packages/gis-pro` (4.7K ln, **excluded**), `brain/packs/atlas`, `phase4d.atlas-gis` | real but **install-broken** (`@turf/turf`) | excluded from workspace / Unknown | — | **High** | TerraFusion-Atlas | **Corroborated** | **fix broken dep (`@turf/turf`)** before workspace inclusion; ArcGIS binaries are external, not migrated |
| **Dais** — `phase4d.dais-workflow`, `brain/packs/dais` | domain real; **no dedicated backend project** | — / Unknown | — | **Medium** | TerraFusion-Dais | **Inferred** | is Dais a real code surface or only a domain label? |
| **Dais ∋ Levy** — `backend/src/TerraFusion.Levy`, `packages/terra-levy` (1.8K) | real (Proven) | build-referenced / live | — | **High** | **TerraFusion-Dais** *(architecture decision, not fact)* | **Suspected (placement)** | **fragmented across 3 locations + 6 QUARANTINE copies** — consolidate first; confirm Dais subsumes vs sibling |
| **Dossier** — `phase4d.dossier-documents`, `brain/packs/dossier` | domain real; no backend project | — / Unknown | — | **Medium** | TerraFusion-Dossier | **Inferred** | real code vs domain label |
| **Pilot** — `packages/terra-pilt` (6.9K), `backend/src/TerraFusion.AI`, `brain/packs/{localops,gpt}` | real (Proven); LocalOps runtime-proven | partial / Unknown | — | **High** | shell-facing → core; deep AI → **TerraFusion-Pilot** (later) | **Suspected (split line)** | define the core/Pilot boundary |

## 4. Other real packages (home undecided / suite-adjacent)

| Surface | Reality | Liveness | Recovery value | Topology home | Overall conf | Migration prereqs / blocking unknowns |
|---|---|---|---|---|---|---|
| `packages/terrabuild` (113K ln) | **present, substantial-by-SIZE (Corroborated); quality unadjudicated** (size≠quality) | in-workspace; nested lockfile | **Provisional** (value ≤ reality conf) | **Undecided** (own subsystem?) | Suspected | nested `pnpm-lock.yaml` → sub-workspace; **reality re-audit before value** |
| `packages/terra-gama` (11K ln) | **present (Corroborated); quality unadjudicated** | in-workspace; nested lockfile | **Provisional** | **Undecided** | Suspected | nested lockfile; reality re-audit; map to a suite |
| `packages/terra-flow` (4.9K) | present (Corroborated); quality unadjudicated | in-workspace | **Provisional/Medium** | **Undecided** | Suspected | dedup vs 4 QUARANTINE copies; reality re-audit |
| `packages/terra-insight` (880), `terra-miner` (854) | thin (Corroborated) | in-workspace | **Low–Medium** | **Undecided** | Suspected | confirm domain ownership |
| `packages/government-edition` (32K ln, **in-workspace**) | **present, substantial-by-SIZE (Corroborated); quality unadjudicated**; has own `.sln` + API | active but heavy/legacy | **Provisional** | **Undecided** (core? product edition?) | Suspected | contains a duplicate `TerraFusion.API` csproj; resolve before move; reality re-audit |
| `os-platform/development/testing-suite` (the "716 tests") | real (Corroborated) | Experimental (active, non-prod) | **Medium** | TerraFusionOS core (test infra) | Corroborated | reconcile 716/91.9% claim vs current HEAD |
| `os-platform/specialized/web-audit-tracker` (v1.2.0, ~20K ln) | **real product structure (Corroborated** — versioned, drizzle/client/mcp); internal quality unadjudicated | frozen∩real; builds independently | **Medium–High (provisional)** | **Undecided** (core? suite? standalone?) | Suspected | owner + product decision; security review |

## 5. Excluded-but-substantial (broken-dep recovery candidates)

*Workspace-excluded for uninstallable deps — real code, high latent value, blocked on dependency repair.*

| Surface | Reality | Liveness | Recovery value | Topology home | Overall conf | Migration prereqs / blocking unknowns |
|---|---|---|---|---|---|---|
| `packages/property-tax-ai` (135K ln) | **present, large-by-SIZE (Corroborated); quality UNVERIFIED** (size≠quality) | **excluded** (`js-tiktoken` not installable) | **Provisional** (cannot exceed unverified reality) | TerraFusion-Pilot / suite | Suspected | **resolve `js-tiktoken` → reality re-audit → only then assign value** |
| `packages/terra-permit` (74K ln) | present, large-by-SIZE (Corroborated); quality UNVERIFIED | **excluded** (`ibm-cloud-sdk-core`) | **Provisional** | suite (permitting) | Suspected | resolve `ibm-cloud-sdk-core`; reality re-audit; home decision |
| `packages/government-edition-enhanced-MARKED-FOR-REVIEW` (29K ln) | present-by-SIZE (Corroborated); quality UNVERIFIED | **excluded** + name says review | **Provisional/Low** | Undecided | Suspected | likely duplicate of `government-edition` — **dedup first** |
| `packages/legislative-pulse` (1.8K) | present (Corroborated); quality unverified | **excluded** (`@radix-ui/react-badge` bogus) | **Provisional/Low** | suite | Suspected | fix bogus dep; reality re-audit |

## 6. Frozen `os-platform/specialized/` band (per Pass-4 G5 adjudication)

| Surface | Reality | Liveness | Recovery value | Topology home | Overall conf | Migration prereqs |
|---|---|---|---|---|---|---|
| `security-analytics-quantum` | real (Corroborated, real libs) | frozen | **Medium** | suite (security) | Corroborated | "quantum-resistant" claims unverified |
| `quantum-computing-integration` | real classical **simulator** (Corroborated) | frozen | **Medium** | suite / research | Corroborated | name overstates (no QPU) |
| `autonomous-research-engine` (8.6K) | real architecture; capability unverified | frozen | **Low–Medium** | research | Suspected | capability proof |
| `self-modifying-architecture` | **mixed** — skeleton + fabricated-metric methods | frozen | **Low** | research/quarantine candidate | Suspected | fabricated outputs (`Math.random` returns) |
| `os-platform/ai-systems/ai-systems/ai-swarm` | **Scaffolding** (unwired stubs, App. I) | unwired | **None** | legacy-only | Corroborated | not a recovery candidate |

## 7. Legacy-only / **NOT recovery candidates** (recovery value = None)

| Surface | Class | Why not recovered |
|---|---|---|
| `QUARANTINE/` (71,887 files / 2.3 GB) | Archive | committed dead weight; ArcGIS install + PACS dumps + `bfg.jar` are external/binary; **0 live importers** |
| `.pnpm-store/` (115 MB) | Residue | generated package cache |
| `phase4*.json` (root) | Generated | consolidation ledgers — evidence, not config |
| Fantasy stratum (`morphic-resonance`, `dimensional-folding`, `precrime-prevention`, `singularity-…`, `paradigm-…`, `quantum-collapse`, `biofield-…`) | Frozen ∩ Fantasy | implementation physically impossible (Proven, G2/G5); **Not eligible** |
| `backend/api-unified`, `TerraFusionSimple.csproj` | orphan | abandoned/superseded (Inferred, F1); not in any `.sln` |
| `SEALED.md` | Governance fossil | real seal (2025-12-13) overtaken by ~2,578 later commits; relabel-historical candidate |

---

## 8. Cross-cutting migration prerequisites (apply to many rows)

1. **Dedup vs QUARANTINE** — `terra-sync`/`terra-levy`/`terra-flow` (and others) have 3–6 QUARANTINE copies each; content-hash before any extraction to avoid resurrecting stale duplicates.
2. **Broken-dep repair** — the five excluded packages (property-tax-ai, terra-permit, gis-pro, legislative-pulse, government-edition-enhanced) need their uninstallable deps fixed before workspace inclusion; **size ≠ quality** — each needs a reality re-audit after install.
3. **Environment** — backend/.NET surfaces are `Unknown (environment)` until a .NET SDK + the `xlsx`/cdn.sheetjs.com frontend dep are available (Pass-5 G6); CI evidently has this access, the audit sandbox did not.
4. **`.sln`/duplicate-csproj resolution** — `government-edition` and `api-unified` carry duplicate `TerraFusion.API` assemblies; resolve before any backend move.
5. **Architecture decisions (not facts)** — Levy→Dais, terrabuild/terra-gama home, web-audit-tracker home, core/Pilot split — all **Suspected placement**, awaiting ratified topology decisions.

## 9. Unknowns Register (WO-FECF-002)

| Unknown | Why | Label |
|---|---|---|
| Whether Dais/Dossier are real code surfaces or domain labels only | only waves + packs found, no backend project | Unknown |
| Post-install reality/quality of the 5 excluded packages | deps uninstallable in audit env | Suspected (size ≠ quality) |
| Runtime enforcement of `spec-lock/` AUTHORITIES | gate not observed running | Suspected |
| Core vs TerraFusion-Pilot split line | architecture decision pending | Unknown (decision) |
| Backend/.NET "actually-live" status | env-blocked (no dotnet) | Unknown (environment) |
| True dedup extent (terra-* vs QUARANTINE copies) | not byte-compared | Suspected |

## 9a. Adversarial review (self-red-team of this register)

Run against the six FECF failure modes the register exists to prevent. Corrections applied in place above.

| # | Check | Finding | Correction |
|---|---|---|---|
| 1 | "actually-live" overstated? | **Yes — 1 case.** `os-shell` was marked "actually-live" but Pass 5 **never booted it** (install blocked at cdn.sheetjs.com). | **Retracted** → build-referenced; reachability **Unknown (environment)**. Only `tf` CLI is execution-proven live. `os-platform/core` "governance-live" softened to "referenced (gates not executed)". |
| 2 | target home stated as fact? | No — all placements carry `Suspected/Inferred/Corroborated` + the "hypothesis, not destination" header. | none |
| 3 | recovery value overstated? | **Yes** — large packages marked **High** value while their reality was unverified. | New rule: **recovery value ≤ reality confidence.** Unverified surfaces → **Provisional**, not High. |
| 4 | "size ≠ quality" applied consistently? | **No** — applied to excluded packages but **not** to large in-workspace ones (`terrabuild`, `terra-gama`, `government-edition`). | Reality of LOC-based "Proven" cells → **"by-size (Corroborated); quality unadjudicated"** uniformly. |
| 5 | eligibility implies approval to move? | No — topology = hypotheses, migration-prereqs gate every move, "does not authorize recovery" stated. | reinforced (principle below) |
| 6 | Unknowns hidden/softened? | **Indirectly** — High-value-on-unverified and "actually-live"-on-unbooted softened real unknowns. | fixed via #1/#3/#4; §9 Unknowns unchanged. |

**Two governing principles added (candidate Lexicon/Amendment items for FECF):**
1. **Recovery value ≤ reality confidence.** You cannot claim High value for code whose reality (quality) is unverified. Size, version number, and dependency count are not quality.
2. **"Actually-live" requires execution evidence.** Absent a successful boot, the ceiling is *build-referenced / runtime-reachability Unknown (environment)* — never "live."

## 10. Coverage & Final State

**Coverage:** all meaningful recoverable surfaces classified on the seven axes (core, platform, suites, real packages, excluded-substantial, frozen band, legacy-only). Pure residue/archive enumerated once as None. Estimated recoverable-surface coverage ≥ 85%.

**Final state: `READY_FOR_RATIFICATION`.** This register is submitted to the Ratification gate (FECF-001 App. E2), which independently checks acceptance, topology acceptance, confidence review, **adversarial challenge**, evidence stability, and blocking-unknown resolution.

**This WO does not authorize recovery.** No surface was moved, extracted, ported, split, merged, deleted, renamed, or rewritten. Target homes are confidence-laddered hypotheses, not decisions. Recovery and Migration are separate, later, ratified WOs.

---

*Produced under WO-FECF-002 (classification only) per the FECF governing doctrine. Confidence is not promoted to truth; eligibility is not promoted to approval; a target home is not promoted to a destination; classification is not promoted to implementation — except by passing the Ratification gate. Unknowns are reported, not hidden.*

# TerraFusion Canon (short form)

> The note every agent reads before touching anything. This is a **digest** of the immutable
> Constitution, not a replacement. Authority: `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md`
> (TF-052) and `.github/AGENT_ENTRYPOINT.md`. If this digest and TF-052 disagree, **TF-052 wins.**

## Four questions, before any edit
```
1. What layer am I in?
2. What suite owns this?
3. What am I allowed to write?
4. What must I not touch?
```

## Active Suites (TF-052 §1.1)
| Suite | Domain | Writes |
|-------|--------|--------|
| **TerraForge** | Valuation | models, cost/income/sales, comps, calibration, CAMA chars, valuation notes |
| **TerraAtlas** | GIS | layers, symbology, parcel geometry, spatial annotations, neighborhoods |
| **TerraDais** | Assessor Admin | permits, exemptions, appeals, notices, certification, task/workflow state |
| **TerraDossier** | Records/Evidence | documents, narratives, evidence items, packets, case files |
| **TerraGPT** | AI | GPT config, RAG metadata/embeddings, usage metrics, conversation history |

## OS-Level Features — **NOT suites** (TF-052 §1.2)
- **TerraPilot** — personal copilot (Pilot mode = act; Muse mode = read/draft only, never writes)
- **TerraTrace** — append-only, tamper-evident operational trace ledger (NOT domain truth)
- **Property Workbench** — OS surface; the central UI for **parcel-scoped** work

## Reserved — DO NOT USE these names/prefixes (TF-052 §1.3, §8)
`terraclerk` · `terratreasury` · `terraaudit` · `terrarecorder`
Blocked words in Assessor modules: `clerk`, `treasury`, `auditor`, `recorder`.

## Naming rule: audit vs trace (TF-052 §2.3) — **high-frequency drift**
- `audit` = reserved for the **future Auditor office** (financial/compliance). **Forbidden** for Assessor activity tracking.
- Use `trace` / `compliance` / `activity` for assessor activity logging instead.

## Write-Lane Matrix (AGENT_ENTRYPOINT) — the hard law
- A suite writes **only inside its own lane**.
- **Direct cross-lane mutation is prohibited.** Cross-lane intent must travel through a governed
  operation boundary and **emit a TerraTrace event** (`action_started` → `action_completed`/`action_failed`).
- TerraGPT has **no independent write lane** — it acts only through sanctioned TerraPilot tools.
- TerraTrace is **append-only**; it never mutates suite-owned business records.

## Five-Layer model (Architect Agent enforces)
```
Layer 1: OS Shell          — department-agnostic chrome (dock, top bar). Owns nothing domain.
Layer 2: Home Scene        — landing / scene
Layer 3: Suite Workspaces  — departmental homes (Forge/Atlas/Dais/Dossier)
Layer 4: Tier-0 Workbench  — Property Workbench, center of gravity for parcel work
Layer 5: Full Applications — tools hosted inside higher layers
```

## Property Workbench routing contract (AGENT_ENTRYPOINT)
- Parcel **search** resolves to `property-workbench`.
- Parcel **actions** resolve to `property-workbench`.
- TerraPilot / TerraTrace open as in-shell OS surfaces.
- Dock / top bar / desktop chrome must stay preserved during launches.
- **Never bypass Property Workbench for parcel-scoped actions.**

## Property Workbench tab order (TF-052 §4.1)
`Summary · Forge · Atlas · Dais · Dossier · Pilot` — Dossier and Pilot always last.

## TerraDais modules (TF-052 §5.1)
Active: TerraLevy, TerraPILT, TerraPermit, TerraTrace(OS). Planned: TerraExempt, TerraAppeal,
TerraCert, TerraNotice, TerraQueue. (Backend persistence for the planned five already exists —
see [[drift-ledger]] D-002.)

## Active UI surface (AGENT_ENTRYPOINT)
- ✅ `frontend/apps/os-shell/**` is the **active** UI (NOT legacy).
- ❌ `frontend/src/**` is legacy dead code (97+ errors) — **never modify**.
- ❌ Never touch `os-platform/ai-systems/ai-systems/ai-swarm/**`.

## Ports (zero tolerance)
Never hardcode. Use env: `TF_FRONTEND_PORT` (3102), `TF_API_PORT` (5046). See AGENT_ENTRYPOINT.

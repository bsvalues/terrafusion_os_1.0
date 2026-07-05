# WO-WB-004 — Mock / Live / Stub Provenance Audit

**Program:** PROPERTY-WORKBENCH-READINESS (step 4) · **Owner:** Claude Code · **Mode:** read-only discovery, docs/audit only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `77269a65` · **Method:** counts **computed** from `tools/registry/tool-maturity.json` + `tools/registry/terrapilot.tools.json` (not estimated); data-mode contract read first-hand; cited `file:line`.
**Builds on:** WO-WB-001/002/003.

This is the **census**. The workbench sources runtime data through exactly **two channels**; this WO quantifies the provenance of each and issues the mock/live/stub verdict.

---

## 1. The two data-provenance channels

| Channel | How surfaces use it | Provenance question |
|---------|--------------------|---------------------|
| **Domain-data channel** | stores + domain hooks (`usePropertyStore`, `useForgeValuation`, `useParcelBoundary/Layers`, `useDossierDetails`) backed by `LiveDataProvider` | live vs mock/fixtures? |
| **Governed-tool channel** | `invokeTool(toolId)` → the 117-tool TerraPilot registry | backend-integrated vs stub? |

## 2. Domain-data channel — **live-only by contract**

- `frontend/apps/os-shell/src/services/dataProvider.ts:38` — `export type DataMode = 'live';` (the type admits only `'live'`).
- `dataProvider.ts:82` — **"Fail-fast contract: any non-live `VITE_DATA_MODE` throws immediately"**; unset or `'live'` is the canonical default (`:42,:87-90`).
- `LiveDataProvider.ts:347` — `readonly mode: DataMode = 'live';`; results are stamped `dataSource: 'live'` (`:215,:338`).

**Verdict:** the domain-data channel has **no runtime mock/fixtures mode** — the provider hard-fails on anything but live. Fixtures exist **only in tests** (e.g. `__tests__/…`), never in a shipped data path.

> **Correction to WO-WB-001 §4.1 wording:** the `PropertyWorkbench.tsx:172` inline comment "`DataProvider → snapshot/live/fixtures`" is **stale** — the current `DataMode` is live-only and fail-fast. Recorded as a stale-comment finding for the Gap Register (WO-WB-005).

## 3. Governed-tool channel — the maturity census (computed)

Source: `tools/registry/tool-maturity.json` (schemaVersion, `generatedBy: WO-TERRAPILOT-P8`, `generatedOn: 2026-07-02`) + `tools/registry/terrapilot.tools.json` (v2.0.0). **117 tools** in each.

### 3.1 Maturity state (all 117)

| Maturity state | Count | Level |
|----------------|-------|-------|
| `stub-contract` | **116** | L1 |
| `contract-covered` | **1** | L2 |
| `backend-integrated` | **0** | — |
| `promoted` | **0** | — |
| `declared` | 0 | — |

- **`liveIntegration: true` → 0 of 117.** Every tool is `liveIntegration: false`.
- **`disclosureRequired: true` → 117 of 117.** Every tool requires a disclosure; the default disclosure string is **"tool layer in development"**.
- The single `contract-covered` (L2) tool is `summarize_levy_rate_components` (a Dais tool — the one Dais invokes, WO-WB-003 §2).

### 3.2 Tool count by suite (from `terrapilot.tools.json`)

| Suite | Tools | Suite | Tools |
|-------|-------|-------|-------|
| os | 28 | audit | 6 |
| forge | 26 | clerk | 6 |
| dais | 21 | dossier | 6 |
| pilot | 15 | atlas | 2 |
| treasury | 7 | **total** | **117** |

**Verdict:** the governed-tool channel is **100 % pre-integration** — 0 tools backend-integrated, 116/117 at L1 stub-contract, 1 at L2 contract-covered, and every tool carries a mandatory "in development" disclosure at runtime.

## 4. Mock / live / stub verdict

| Classification | Where it applies | Evidence |
|----------------|------------------|----------|
| **MOCK (fabricated data at runtime)** | **nowhere** | honesty contracts forbid it (WO-WB-001 §5); domain provider fail-fasts on non-live (§2); tool responses are disclosed, not faked |
| **LIVE** | domain-data channel (when endpoints respond) + the 1 contract-covered tool's contract path | `LiveDataProvider` live-only (§2); `summarize_levy_rate_components` L2 (§3.1) |
| **STUB (pre-integration, disclosed)** | governed-tool channel | 116/117 stub-contract, 0 backend-integrated, all `disclosureRequired` (§3.1) |
| **STUB (UI placeholder)** | `income/DcfPanel.tsx` | the one source-level UI stub (WO-WB-001 §4.2) |

There is **no mock surface** at runtime. The honesty of the workbench is structural: domain data is live-or-fail-fast, tool data is stub-but-disclosed, and the UI renders `unavailable`/preloaded-store states rather than fabrications.

## 5. Per-surface provenance

| Surface | Domain-data channel | Governed-tool channel (maturity) |
|---------|--------------------|----------------------------------|
| Summary | live parcel/CAMA store (live-only) | minimal tool use |
| Forge | live forge hooks (26 forge tools) | all L1 stub-contract |
| Atlas | live GIS hooks (2 atlas tools) | all L1 stub-contract |
| Dais | live (levy/appeals) + store | 21 dais tools — 20 L1 + **1 L2** (`summarize_levy_rate_components`) |
| Clerk | live `recordings` store slice | 6 clerk tools — all L1 stub-contract |
| Treasury | live `taxStatements` store slice | 7 treasury tools — all L1 stub-contract |
| Audit | live `auditTrail` store slice | 6 audit tools — all L1 stub-contract |
| Dossier | live `useDossierDetails` hook | 6 dossier tools — all L1 stub-contract |
| Pilot | lists the registry itself | 15 pilot tools — all L1 stub-contract |

(The 28 `os`-suite tools are orchestration/route/trace, not tab-scoped.)

## 6. Readiness implication

The workbench's path to runtime richness is now **quantified**: it is gated on **promoting 117 tools from `stub-contract` → `backend-integrated`** (currently 0 % done, 1 tool at the intermediate L2), *plus* the live domain endpoints being available. There is **no mock debt to unwind** — nothing fake to remove; the work is forward integration under an already-honest UI. This is the single most important readiness number in the program: **0/117 tools live-integrated.**

## 7. Unknowns (deferred)

1. The **promotion protocol / effort** per tool (evidence paths exist in `tool-maturity.json`, e.g. `promotionProtocol`, `backingService`) — sequencing is WO-WB-006's decision, not this census.
2. Whether any **backend endpoints** already exist for the L1 tools (backend is out of this program's read-only frontend scope) — noted as a dependency.
3. Whether the `os`-suite 28 tools include any already-wired orchestration (route_to_parcel is L1 stub-contract per WO-WB-001 §4.3) — not individually enumerated here.

**STOP_TYPE:** `WB_PROVENANCE_AUDIT_COMPLETE`

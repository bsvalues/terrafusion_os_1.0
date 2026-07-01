# WO-TERRAPILOT-P3..P6 — Tool Maturity Audit (Evidence Packet)

**Program:** P5 — TerraPilot Tool Maturity
**Date:** 2026-07-01
**Mode:** Read-only (R0). No code change, no tool promoted, no runtime change, no secrets, no deployment.
**Sources:** `main` source (`tools/registry/terrapilot.tools.json`, `os-platform/core/pilot/*`) +
live anonymous probes of the deployed demo (`2026-07-01`).
**Ladder:** L0 Declared · L1 Runnable(stub) · L2 Contract-covered · L3 Live-integrated · L4 Promoted
(see [terrapilot-promotion-protocol.md](../brain/workorders/programs/terrapilot-promotion-protocol.md), WO-P2).

---

## WO-TERRAPILOT-P3 — Handler Parity Audit

**Verified counts** (`registerHandler` cross-referenced against declared toolIds):

| Metric | Count | Source |
|--------|-------|--------|
| Declared tools | **117** | `tools/registry/terrapilot.tools.json` (v2.0.0) |
| Stub handler registrations | 80 | `os-platform/core/pilot/handlers.ts` |
| Real handler registrations | 54 | `os-platform/core/pilot/handlers.real.ts` (55 `backendGet/Post/Put` markers) |
| **Union handled** | **117** | stub ∪ real |
| **L0 orphans (declared, no handler)** | **0** | — |
| **L3-capable in code** (real handler, matches declared id) | **54** | 0 real handlers unmatched |
| **L1 stub-only** | **63** | declared − real |

**Findings:**
- **Handler parity is 100%** — every declared tool has at least a stub handler. No L0 orphans. (This
  corrects a casual "45% coverage" read: coverage of *real* handlers is 54/117 (46%), but *handler
  parity* is 117/117.)
- **54 tools (46%) are L3-capable in code** — `handlers.real.ts` calls real backends (CostForge,
  Levy, Properties, Dossier, PILT) via `backendGet/Post/Put` + `acquirePilotToken`, overriding the
  stub at startup.
- **63 tools (54%) are L1 stub-only** — canned/deterministic responses, no backend call.

**Risk distribution (manifest):** read_only 74 · write_low 31 · write_high 11 · irreversible 1.
**Muse/LLM-mode tools:** 27.

---

## WO-TERRAPILOT-P4 — Stub Disclosure Diagnostics

### Endpoint-level disclosure — EXEMPLARY ✅ (deployed demo probes)
| Endpoint | Response | Honest? |
|----------|----------|---------|
| `/api/pilot/health` | `{"status":"degraded","runtimeOnline":false,"message":"Pilot runtime offline — using .NET fallback stubs"}` | ✅ explicit |
| `/api/pilot/tools` | `{"tools":[],"source":"stub","runtimeOnline":false}` | ✅ |
| `/api/pilot/traces` | `{"events":[],"total":0,"source":"stub","runtimeOnline":false}` | ✅ |
| `/api/pilot/manifest` | 401 (auth-gated) | — |

The deployed pilot surface **discloses its stub/offline state on every endpoint** rather than faking
tools or data. This is the target behavior the promotion protocol §4 says to preserve.

### The deeper truth — deployed-live count is ZERO
`runtimeOnline:false` means the **Node pilot runtime (port 4317) is not deployed**; the .NET API
serves fallback stubs. Therefore **none of the 54 L3-capable handlers is reachable on the demo** —
they live in the un-deployed Node runtime. **Deployed-live tools = 0.** "Real handler in code" ≠
"deployed-live" — this is the maturity guard one level deeper than "manifest green ≠ live."

### Per-tool payload disclosure — INCONSISTENT ⚠️
Endpoint-level disclosure is honest, but individual stub handler payloads in `handlers.ts` are
uneven: some carry a stub marker (e.g. `source: 'WA DOR ... stub'` ~line 1164), others return
canned domain text with **no per-payload `source:"stub"`** (e.g. `summarizeDossierHandler` returns a
summary + `payloadRef` with no stub flag). A caller reading only the payload could miss that it is
stubbed. **Recommendation:** every stub handler payload should carry a `source:"stub"` /
`runtimeOnline:false` marker, matching the endpoint envelope.

---

## WO-TERRAPILOT-P5 — First Real Backend-Integrated Tool Candidate Review (read-only)

**Goal:** identify the single best candidate to promote L2→L3 first — **review only; no promotion**
(actual promotion crosses SW-09/SW-10/SW-01 and needs authorization).

**Selection criteria:** `read_only` (no write-lane risk), calls a **stable, already-existing** backend
endpoint, low PII, small blast radius.

**Candidates (from the 54 L3-capable, read_only):**
| Tool | Backend call | Notes |
|------|--------------|-------|
| `summarize_levy_rate_components` | `POST /api/levy-calculation/calculate-rate` | read_only; Levy math |
| `explain_model_results` | `GET /api/costforge/{parcelId}/breakdown` | read_only; CostForge |
| `compare_assessed_value_history` | `GET /api/properties/{parcelId}` | read_only; property history |
| `summarize_parcel_casefile` | `GET /api/dossier/parcels/{parcelId}/casefile` | read_only; dossier |
| `calculate_pilt_payment` | `GET /api/pilt/districts` | read_only; PILT |

**Recommendation:** **`explain_model_results`** (or `summarize_levy_rate_components`) as the first
L3 — read_only, single GET, no mutation, self-contained CostForge/Levy data. **Blockers to L3-on-demo
(each a separate authorized WO):**
- Node pilot runtime not deployed → deploy it **or** port the one handler to the .NET API (**SW-01/SW-09**)
- Its backend endpoint (`/api/costforge/*`) is **401** on the demo → needs the auth/session decision (**SW-10**)
- If Muse/LLM narration is included, `ANTHROPIC_API_KEY` is required (**SW-03**) — pick a **non-Muse**
  read_only tool for the first L3 to avoid the LLM dependency.

**This WO promotes nothing.** It recommends the candidate and names the walls.

---

## WO-TERRAPILOT-P6 — Tool Promotion Evidence Rollup

### Verified maturity state (per the L0–L4 ladder)
| Level | Definition | Count | Basis |
|-------|-----------|-------|-------|
| L0 Declared (no handler) | manifest only | **0** | 100% parity |
| L1 Runnable (stub) | stub handler, no backend | **63** in code; **117 effective on demo** | runtime offline → all served as stubs |
| L2 Contract-covered | schema + spec | (all 117 schema-covered via `terrapilot.tools.schema.json`; per-tool integration specs not individually verified) | — |
| L3 Live-integrated | real handler returning real data | **54 in code · 0 deployed-live** | Node runtime offline on demo |
| L4 Promoted | L3 + tests + operator approval | **0** | — |

### Verdict (against the program's stop condition)
The program says: *"If P1 finds 0 tools at L2+, treat TerraPilot as alpha/stub."* Here **54 tools are
L3-capable in code**, so TerraPilot is beyond alpha in the codebase — but **0 tools are deployed-live**,
so on the running demo TerraPilot is a **stub layer**. Per the **disclosure rule** (protocol §4),
TerraPilot must still be disclosed as **"tool layer in development"** until at least one tool is
**deployed-live (L3 on the running runtime)** with evidence — which has not happened.

### Two maturity vocabularies (reconcile — doc-vs-doc gap)
1. **Program ladder** L0–L4 (per-tool) — used here.
2. **`tools/registry/autonomy-viewer`** IMM5 (Initial→Developing→Defined→Managed→Optimizing) —
   system-level CMM, not per-tool.
These are different axes. Recommend a short note in the autonomy-viewer model pointing to the L0–L4
per-tool ladder as the canonical **tool** maturity vocabulary (a future docs WO).

### Rollup findings
- 117 declared · 100% handler parity · 54 L3-capable-in-code · **0 deployed-live** · 0 L4.
- Endpoint-level stub disclosure is exemplary; per-tool payload disclosure is inconsistent (P4).
- First-L3 candidate: `explain_model_results` (read_only), blocked by SW-01/09/10 (P5).
- TerraPilot correctly remains "in development" per the disclosure rule.

---

## Stop Walls Respected

| Wall | Status |
|------|--------|
| SW-01 deployment | not crossed (read-only) |
| SW-02 data mutation | not crossed |
| SW-03 secrets | not crossed (no LLM key handled) |
| SW-08 external integration | not crossed |
| SW-09 runtime behavior | not crossed (no tool promoted) |
| SW-10 auth/security | not crossed |

**No tool promoted stub→live.** P5 is review-only; the L2→L3 promotion it recommends is a separate,
operator-authorized WO.

---

## Evidence Log

- Manifest: `tools/registry/terrapilot.tools.json` (117 tools, v2.0.0), `terrapilot.tools.schema.json`
- Handlers: `os-platform/core/pilot/handlers.ts` (80 stub regs), `handlers.real.ts` (54 real regs, 55 backend calls)
- Dispatch/governance: `os-platform/core/pilot/ToolRunner.ts` (write-lane/risk/county-isolation gates), `PilotController.ts`
- Maturity model: `tools/registry/autonomy-viewer` (IMM5, system-level)
- LLM: `os-platform/core/pilot/local-agent/{claudeAdapter,localOpsProvider,modelAdapter}.ts` (gated by ANTHROPIC_API_KEY)
- Deployed probes (anon): `/api/pilot/{health,tools,traces}` all `runtimeOnline:false`/`source:"stub"`; `/api/pilot/manifest` 401
- Verified counts: declared 117; parity 117/117 (L0=0); real 54; stub-only 63; muse 27; risk 74/31/11/1

---

**WO-TERRAPILOT-P3..P6: COMPLETE (read-only).** R0/docs queue for this program exhausted. The next
step — promoting the first tool to **deployed-live L3** — crosses SW-01/SW-09/SW-10 and requires
explicit operator authorization (per WO-P2 §2 L2→L3 gate).

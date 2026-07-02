# WO-WORKBENCH-008 — Pilot Integration Truth

## Result

`PASS`

The Property Workbench Pilot tab is implemented as a governed parcel-scoped AI/tool invocation surface. It does not directly own suite data. It loads Muse-mode read-only tools, invokes them through the TerraPilot API lifecycle, surfaces correlation IDs, and displays parcel-scoped trace evidence.

This work order is evidence-only. No runtime code, route code, package files, CI, schema/migration, county data, PACS integration, tool allowlist, risk policy, trace policy, or deployment surface was changed.

## Scope

Goal: classify Pilot integration in the canonical assessor Workbench experience.

Inspected surfaces:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx`
- `frontend/apps/os-shell/src/hooks/useToolInvocation.ts`
- `frontend/apps/os-shell/src/api/pilotApi.ts`
- `frontend/apps/os-shell/src/components/pilot/ExecutionConsole.tsx`
- `frontend/apps/os-shell/src/components/pilot/EvidenceRail.tsx`
- `frontend/apps/os-shell/src/components/pilot/RiskPolicyGate.tsx`
- `frontend/apps/os-shell/src/services/pilotRbac.ts`
- `frontend/apps/os-shell/src/services/terraTrace.ts`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/workbench.riskPolicy.test.ts`
- `frontend/apps/os-shell/src/__tests__/api/pilotApi.traceNormalization.test.ts`
- `frontend/apps/os-shell/src/__tests__/pilot/pilot.rbac.contract.test.ts`
- `frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail*.test.tsx`

## Domain Canon

GPT/Pilot canon requires:

- GPT assistance acts through TerraPilot tools and approved service APIs.
- GPT does not directly mutate suite-owned records.
- Tool calls carry risk classification: `read_only`, `write_low`, `write_high`, `irreversible`.
- Write-high and irreversible actions require higher-friction confirmation.
- AI/tool actions must be traceable through TerraTrace when appropriate.
- Trace is append-only evidence, not mutable business state.

The Property Workbench Pilot tab follows that posture by presenting only read-only Muse tools and routing all invocation through the Pilot API/hook path.

## Runtime Shape Observed

The Workbench Pilot tab is a real implemented tab, not a placeholder.

Observed behavior:

- the tab renders as `property-pilot-tab`
- it loads tools with `listPilotTools('muse')`
- it filters visible tools through `filterMuseReadOnlyTools`
- it states that the panel provides only read-only reasoning and explanation tools
- tool execution calls `useToolInvocation().invoke(tool.toolId, { parcelId })`
- invocation lifecycle is surfaced through `ExecutionConsole`
- invocation history records terminal states with `correlationId`
- parcel-scoped trace events are loaded through `usePilotTraceList({ parcelId })`
- trace events are rendered through `EvidenceRail`

The tab also links to a full console at `/property/{parcelId}/pilot`, but this WO did not classify that standalone console as a separate capability.

## Tool Invocation Path

The observed invocation chain is:

```text
PropertyPilot
  -> listPilotTools('muse')
  -> filterMuseReadOnlyTools(...)
  -> useToolInvocation.invoke(toolId, { parcelId })
  -> validatePilotTool(...)
  -> optional confirmation state
  -> invokePilotTool(...)
  -> POST /api/pilot/invoke
  -> response correlationId / traceEventId
  -> ExecutionConsole + EvidenceRail
```

This is the correct integration shape for a Workbench assistant surface. Pilot is the tool-control choke point; Workbench tabs do not directly mutate Forge, Atlas, Dais, or Dossier records.

## Risk And Confirmation Model

Observed policy model:

- `read_only` tools do not require confirmation
- `write_low` tools do not require confirmation in current policy
- `write_high` tools require confirmation and reason
- `irreversible` tools require confirmation, reason, and supervisor approval

The Workbench Pilot tab additionally filters to Muse-mode read-only tools, so write-capable tools are not presented in the tab by default.

## Trace And Evidence Model

Trace evidence observed:

- `PilotInvokeResponse` includes `correlationId` and optional `traceEventId`
- trace detail loads by correlation ID through `getPilotTrace(correlationId)`
- parcel trace list loads through `listPilotTraces({ parcelId })`
- trace event normalization maps legacy `tool_completed` to `tool_succeeded`
- `ExecutionConsole` displays correlation ID and terminal trace evidence
- `EvidenceRail` renders trace timelines
- elevated trace export exists through an admin/elevated path, not ordinary Workbench use

This confirms a trace-aware integration posture. This WO did not prove backend append-only storage or production trace retention.

## Contract Evidence Observed

Relevant tests exist for:

- PropertyPilot Muse-first filtering
- risk policy ordering and confirmation requirements
- TerraPilot RBAC and tool allowlists
- Pilot API trace normalization
- Pilot API `/api/pilot/invoke` route usage
- EvidenceRail rendering
- execution console and risk confirmation UI behavior
- trace immutability checks in Workbench test surfaces
- attestation gates for TerraPilot RBAC and TerraTrace append-only emitter shape

Observed `PropertyPilot.museFirst` test behavior:

- Muse read-only tools render
- write-capable Muse tools do not render
- Pilot-mode tools do not render
- loaded operation history wording is honest

## Surface Classification

| Surface | Classification | Evidence |
| --- | --- | --- |
| Workbench Pilot tab | implemented | `PropertyPilot.tsx`, tab tests |
| Tool discovery | implemented | `listPilotTools('muse')` |
| Tool filtering | implemented | `filterMuseReadOnlyTools` |
| Invocation lifecycle | implemented | `useToolInvocation` state machine |
| Confirmation state | implemented | preflight confirmation phase |
| Backend choke point | implemented | `POST /api/pilot/invoke` API client/test |
| Trace timeline | implemented | `usePilotTraceList`, `EvidenceRail` |
| Risk policy | implemented/contracted | risk policy and RBAC tests |
| Cross-suite write safety | partial | read-only tab filtering proven; backend allowlist not live-run |
| Production tool execution proof | partial/missing | no live backend execution in this WO |

## Gaps And Risks

1. This WO did not execute live Pilot backend tool invocation.
2. The Workbench tab is Muse/read-only, but the broader Pilot console may expose higher-risk tools and remains separately governed.
3. Backend allowlist/RBAC behavior was inspected through frontend contracts, not live service execution.
4. Trace append-only integrity was not re-proven against a live trace store.
5. Adding any write-high or irreversible Workbench-facing tool requires explicit owner authorization and a separate WO.
6. GPT/Pilot must continue to avoid direct writes to Forge, Atlas, Dais, or Dossier records.

## Validation Run

Commands intended for this evidence packet:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

## Conclusion

Pilot is a real Workbench integration surface with a governed read-only Muse posture, centralized Pilot API invocation, risk preflight, correlation IDs, and trace evidence UI. Its maturity classification is `implemented/partial`: the UI and contracts are present, but live backend execution, production allowlist proof, and trace-store persistence remain outside this evidence-only WO.

Next recommended work order:

`WO-WORKBENCH-009 — End-to-End Parcel Flow Evidence`

STOP_TYPE: `PILOT_INTEGRATION_TRUTH_CAPTURED`

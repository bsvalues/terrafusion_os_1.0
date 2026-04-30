# County Studio Correction And Defense

Checked: 2026-04-30T20:57:47.612Z
Status: PASS
Decision: DEFENSE_PACKET_CARRIES_SEGMENT_LEVEL_CORRECTION_TRACE

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| defense-packet-contract-carries-top-risk-segments | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:455`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts:492` | Frontend evidence packet contract now matches the backend TopRiskSegments defense signal. |
| export-modal-renders-top-risk-segment-signals | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx:181`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx:199` | Evidence export preview shows the segment-level correction evidence, not only headline county metrics. |
| markdown-packet-renders-defense-trace | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/utils/evidencePacketMarkdown.ts:84`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/utils/evidencePacketMarkdown.ts:96` | Copied markdown contains segment signal rows with ratio, PRB, weighted mean, risk, and exception evidence. |
| correction-panel-still-anchors-governed-chain | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx:215`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx:299`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx:302` | County Studio still presents scenario, approval, governance, and evidence as one correction chain. |
| exception-queue-keeps-action-lifecycle | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/ExceptionQueuePanel.tsx:4`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ExceptionQueuePanel.tsx:4`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ExceptionQueuePanel.tsx:192` | Exception rows keep the assign, dispatch, resolve, and note lifecycle. |
| scenario-path-still-promotes-into-approval | PASS | `frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx:447`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx:243`<br>`frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx:172` | Scenario preview/save/promotion remains connected to the adjustment approval state machine. |

## Evidence Contract

- Packet fields: `study metadata`, `IAAO compliance metrics`, `primary scenario`, `AI diagnosis`, `topRiskSegments`, `exception log`
- Top-risk segment fields: `segmentId`, `segmentName`, `neighborhoodCode`, `revalArea`, `parcelCount`, `medianRatio`, `cod`, `prd`, `riskScore`, `exceptionCount`, `ratioCount`, `salesCount`, `prb`, `weightedMeanRatio`, `yoyMedianRatioDelta`


# WO-WORKBENCH-006 — Dais Surface Truth

## Result

RESULT: PASS
WORK_ORDER: WO-WORKBENCH-006
GOAL: GOAL-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE
LOOP: LOOP-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE
MODE: evidence-only

## Scope

This packet records the current TerraDais surface inside the Property Workbench. It does not modify
Dais behavior, Workbench routing, workflow rules, statutory deadlines, certification gating,
Dossier custody, package dependencies, CI, deployment behavior, county data, PACS, or SQL access.

Allowed system: Property Workbench Dais evidence.

Blocked systems:

- Runtime code changes
- Shell tab or route changes
- Dais workflow, deadline, notice, appeal, or certification logic changes
- Dossier document/evidence custody changes
- Forge valuation writes or valuation-method changes
- County data, PACS, county SQL, or live database access
- Deployment, Docker, Kubernetes, or CI changes

## Canon References

- `brain/packs/dais/README.md`
- `brain/packs/shell/README.md`
- `docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md`
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md`
- `frontend/apps/os-shell/AGENTS.md`

## Files Inspected

Workbench Dais frame:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`
- `frontend/apps/os-shell/src/components/dais/AppealDeadlinePanel.tsx`
- `frontend/apps/os-shell/src/components/dais/AppealHearingPanel.tsx`
- `frontend/apps/os-shell/src/components/dais/AppealNoticePanel.tsx`
- `frontend/apps/os-shell/src/components/dais/AppealCertificationPanel.tsx`

Dais services and suite surfaces:

- `frontend/apps/os-shell/src/services/suites/daisService.ts`
- `frontend/apps/os-shell/src/services/suites/daisAppealDeadline.ts`
- `frontend/apps/os-shell/src/services/suites/daisAppealCertification.ts`
- `frontend/apps/os-shell/src/services/suites/daisAppealHearing.ts`
- `frontend/apps/os-shell/src/services/suites/daisAppealIntake.ts`
- `frontend/apps/os-shell/src/services/suites/daisAppealNotice.ts`
- `frontend/apps/os-shell/src/services/suites/daisNoticeBatch.ts`
- `frontend/apps/os-shell/src/services/suites/daisQueue.ts`
- `frontend/apps/os-shell/src/services/suites/daisCertRoll.ts`
- `frontend/apps/os-shell/src/services/suites/queueService.ts`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`
- `frontend/apps/os-shell/src/pages/dais/RollReadiness.tsx`
- `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx`

Workbench Dais proof surface:

- `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.honesty.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/daisAppealDeadlineRouting.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/daisAppealHearingRouting.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/daisAppealNoticeRouting.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/daisAppealCertificationRouting.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/workbench.writeLaneGates.test.ts`
- `frontend/apps/os-shell/src/__tests__/dais/*.contract.test.ts*`

## Observed Runtime Shape

`PropertyDais.tsx` is a Workbench-hosted Dais tab. It stays inside the parcel-scoped Workbench
context and exposes assessor workflow requests, notices, appeal-related controls, queue actions,
certification progress requests, and correlation-ID history.

The tab is materially broader than a simple status panel. It includes read-only tool requests,
write-like workflow requests, and several explicit `write_low` / `write_high` labels in UI comments
and visible badge copy.

Mounted parcel-scoped appeal subpanels currently disclose honest empty states:

- Appeal filing deadline
- Board of Equalization hearing
- Appeal notice
- Certification readiness

The mounted subpanels state that no live parcel data is available rather than presenting fabricated
workflow facts.

## Data Source Model

The Workbench Dais tab uses governed Pilot tool calls for many user-triggered actions. It also sits
near Dais service wrappers that target backend Dais endpoints.

Observed Dais backend read endpoints in `daisService.ts` include:

- `GET /api/dais/appeals/parcel/{parcelId}`
- `GET /api/dais/appeals`
- `GET /api/dais/permits?parcelId={parcelId}`
- `GET /api/dais/exemptions/parcel/{parcelId}`
- `GET /api/dais/cert/status`
- `GET /api/dais/notices/parcel/{parcelId}`

Observed Dais backend write-like endpoints include:

- `PUT /api/dais/appeals/{appealId}/status`
- `POST /api/dais/appeals`
- `PUT /api/dais/permits/{permitId}/status`
- `PUT /api/dais/exemptions/{exemptionId}/status`
- `POST /api/dais/queue/assign`
- `POST /api/dais/queue/review`

This packet does not run or validate those endpoints against a live backend. It records the
front-end service posture and the need for backend/county-isolation proof before release claims.

## Governed Tool Surface

Observed Workbench Dais tool IDs include:

- `explain_senior_exemption_impact`
- `summarize_levy_rate_components`
- `generate_morning_brief`
- `draft_value_change_notice`
- `draft_appeal_response`
- `draft_notice`
- `assign_task`
- `assemble_boe_packet`
- `draft_boe_appeal_response`
- `check_exemption_eligibility`
- `process_exemption_renewal`
- `file_appeal`
- `schedule_boe_hearing`
- `get_certification_progress`
- `sign_off_certification_step`
- `queue_notice_for_mailing`
- `get_queue_statistics`
- `escalate_task`

The UI records success/error history with tool IDs and correlation IDs. This packet does not prove
backend tool authorization, policy gates, persistence behavior, or TerraTrace emission for those
tool calls.

## Write-Lane Posture

Dais owns assessor workflow state: permits, exemptions, appeals, notices, certification checklists,
task assignments, work queues, and workflow transitions.

Write-like Dais actions observed in the Workbench tab:

- Draft value-change notice
- Draft appeal response
- Draft general notice
- Assign task
- Assemble BOE packet
- Draft BOE appeal response
- Process exemption renewal
- File appeal
- Schedule BOE hearing
- Sign off certification step
- Queue notices for mailing
- Escalate task

High-risk or promotion-blocking paths:

- `assemble_boe_packet`
- `schedule_boe_hearing`
- `sign_off_certification_step`
- any certification sign-off or deadline behavior
- any notice publication or delivery behavior
- any Dossier packet/document custody handoff
- any county-scoped workflow write lacking `CountyId` proof

Dais service logic includes write-lane assertions and TerraTrace emission in several domain modules,
including appeal deadline and certification code paths. This packet records that evidence but does
not certify complete backend enforcement or county-isolation behavior.

## Evidence and Tests Observed

Existing tests cover:

- Workbench Dais tab rendering with parcel context
- source honesty and idle badge posture
- no tool invocation on mount without user action
- honest empty states for appeal deadline, hearing, notice, and certification panels
- Workbench write-lane matrix coverage for Dais lanes
- Dais appeal deadline computation
- Dais appeal hearing scheduling/reschedule/cancellation
- Dais appeal notice eligibility/generation/queue handoff
- Dais appeal certification readiness and impact
- Dais queue assignment/escalation/statistics
- Dais notice batch selection/dispatch
- Dais roll certification and sign-off contracts
- Dossier-to-Dais appeal handoff write-lane boundaries

Important caveat: `PropertyDais.test.tsx` contains a skip note documenting many skipped tests that
assert older verbose copy and button labels. The still-active tests cover rendering and honesty
guards, but the skipped tests mean the Workbench Dais tab should not be overclaimed as fully
end-to-end tested from UI interaction through backend workflow effects.

## Surface Classification

| Surface | Current maturity | Evidence |
| --- | --- | --- |
| Dais Workbench tab | Implemented, broad workflow/tool surface | `PropertyDais.tsx` |
| Parcel-scoped appeal panels | Implemented honest empty state | Dais appeal panels and Workbench tests |
| Governed tool invocations | Implemented in UI, backend policy not proven here | `PropertyDais.tsx` |
| Dais backend service wrappers | Implemented, backend-dependent | `daisService.ts`, `queueService.ts` |
| Appeal/deadline/certification domain services | Implemented with write-lane/trace evidence | `daisAppeal*.ts`, Dais tests |
| Notice/queue/certification operation surfaces | Implemented across suite/service layers | Dais components/services/tests |
| County isolation proof | Partial | read scope supports county/taxYear; full write isolation not audited here |
| Production readiness | Not claimed | no live DB, PACS, county data, or release gate run |

## Gaps

1. Backend authorization proof is not captured for Dais governed tool calls.
2. Backend persistence and county-isolation proof is not captured for write-like Dais endpoints.
3. Certification sign-off and BOE hearing scheduling are statutory/high-risk paths and need policy
   gate evidence before any release claim.
4. Notice publication, mailing, and delivery are not proven production-safe.
5. Dossier packet/document custody handoff is not certified here.
6. Skipped Workbench Dais tests show copy/interaction contract drift between older test expectations
   and the current simplified Dais tab surface.
7. Standalone Dais suite pages and management dashboards exist outside the Workbench tab; this packet
   classifies them only as adjacent evidence, not as Workbench release proof.

## Validation Run

Commands for this packet:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

Expected validation result: PASS.

## Conclusion

The Workbench Dais surface is materially implemented as a parcel-scoped assessor workflow tab with
governed tool requests, explicit write-risk labels, honest empty appeal subpanels, and adjacent Dais
service/test evidence. It is not a production release claim. The next safe Workbench packet is
Dossier Surface Truth.

NEXT_RECOMMENDED_WO: WO-WORKBENCH-007 — Dossier Surface Truth
STOP_TYPE: DAIS_SURFACE_TRUTH_CAPTURED

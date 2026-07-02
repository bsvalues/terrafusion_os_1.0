# WO-WORKBENCH-003 - Tab + Tool Maturity Classification

## Result

`PASS`

Program: `GOAL-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE`

Loop: `LOOP-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE`

Mode: evidence only. No runtime code, tab code, route code, CI, schema, package, secret, county data, PACS, SQL, or deployment behavior changed.

## Purpose

This packet classifies the current Property Workbench tabs and visible tool surfaces so later WOs can evaluate Forge, Atlas, Dais, Dossier, and Pilot without silently mixing canonical tabs, R3 extension tabs, placeholders, and write-like actions.

## Authority Read

Before writing this evidence, the Workbench lane was checked against:

- `brain/packs/shell/README.md`
- `frontend/apps/os-shell/AGENTS.md`

Relevant rules:

- The Workbench is an OS shell surface.
- Parcel-scoped work must route through `/property/:parcelId[/tab]`.
- Workbench tab order/add/remove/reorder is architecture-governed.
- This WO classifies state only and does not change tab order.

## Runtime Tab Inventory

Sources:

- `frontend/apps/os-shell/src/Router.tsx`
- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/*.tsx`

| Tab | Route child | Component | Classification | Maturity |
| --- | --- | --- | --- | --- |
| Summary | index | `PropertySummary.tsx` | Canonical core tab | Implemented, read-mostly overview |
| Forge | `forge` | `PropertyForge.tsx` | Canonical suite tab | Implemented, valuation surface with services/hooks |
| Atlas | `atlas` | `PropertyAtlas.tsx` | Canonical suite tab | Implemented, live GIS/tool-invocation surface |
| Dais | `dais` | `PropertyDais.tsx` | Canonical suite tab | Implemented, broad workflow/tool surface with write-like requests |
| Clerk | `clerk` | `PropertyClerk.tsx` | R3 extension tab | Implemented, title/recording tool surface; canon status needs confirmation |
| Treasury | `treasury` | `PropertyTreasury.tsx` | R3 extension tab | Implemented, tax tool surface with write-like requests; canon status needs confirmation |
| Audit | `audit` | `PropertyAudit.tsx` | R3 extension tab | Implemented, audit/compliance tool surface with write-like requests; canon status needs confirmation |
| Dossier | `dossier` | `PropertyDossier.tsx` | Canonical suite tab | Implemented, evidence/document surface with export/note actions |
| Pilot | `pilot` | `PropertyPilot.tsx` | Canonical OS-feature tab by shell pack; type/config drift present | Implemented, tool trace/invocation surface |

## Canon and Configuration Drift

These are observed facts, not repairs:

1. Shell domain pack says canonical tab order is `Summary -> Forge -> Atlas -> Dais -> Dossier -> Pilot`.
2. `PropertyWorkbench.tsx` and `Router.tsx` implement nine tabs: Summary, Forge, Atlas, Dais, Clerk, Treasury, Audit, Dossier, Pilot.
3. `frontend/apps/os-shell/src/config/workbenchRoles.ts` says locked order is `Summary -> Forge -> Atlas -> Dais -> Clerk -> Treasury -> Audit -> Dossier -> Pilot`.
4. `workbenchRoles.ts` exports `ALL_TAB_SLUGS` with only eight tabs and omits `pilot`.
5. `frontend/apps/os-shell/src/contracts/workbench.ts` defines `WorkbenchTabSlug` through `dossier` and omits `pilot`, while `PropertyWorkbench.tsx`, `PropertyWorkbenchWindow.tsx`, and `suiteRegistry.ts` use `pilot`.
6. `scripts/spec-gates/workbench-compliance.mjs` prints canonical tabs as `summary | forge | atlas | dais | dossier | pilot`, while runtime includes Clerk/Treasury/Audit.
7. `frontend/apps/os-shell/src/config/suiteRegistry.ts` includes `VALID_WORKBENCH_TAB_IDS` with all nine runtime tabs.
8. `PropertyWorkbenchWindow.tsx` collapses `clerk` and `audit` initial tabs to Dossier and `treasury` to Dais, while route mode has distinct route children for all three.

Operational conclusion:

- The Workbench runtime is more expansive than the six-tab shell-pack canon.
- R3 extension tabs are implemented enough to appear in routing and role visibility, but their governance status should be classified before any feature work depends on them.
- Pilot is implemented as a route/window tab but is not fully represented in `WorkbenchTabSlug` and `ALL_TAB_SLUGS`.

## Tool Surface Inventory

Source extraction: tab component imports, `toolId` literals, `invokeTool` usage, data-testid markers, and write labels.

| Tab | Tool IDs / Services Observed | Tool maturity classification |
| --- | --- | --- |
| Summary | property store/context only | Read-mostly overview. No direct `invokeTool` observed. |
| Forge | `useForgeValuation`, `fieldStoreV2`, Forge year context | Implemented valuation surface; no direct `invokeTool` literals in the top tab file. |
| Atlas | `query_parcel_layers`, `explain_spatial_anomaly`; `useAtlasGis` hooks | Implemented live GIS/tool-invocation surface. Appears mostly read/query/explain. |
| Dais | `assemble_boe_packet`, `assign_task`, `check_exemption_eligibility`, `draft_appeal_response`, `draft_boe_appeal_response`, `draft_notice`, `draft_value_change_notice`, `escalate_task`, `explain_senior_exemption_impact`, `file_appeal`, `generate_morning_brief`, `process_exemption_renewal`, `queue_notice_for_mailing`, `schedule_boe_hearing`, `summarize_levy_rate_components` | Broad workflow surface. Includes write-like workflow requests; requires owner/tool governance review before claiming production-safe execution. |
| Clerk | `explain_recording_fees`, `get_title_chain`, `record_document`, `release_lien`, `search_recorded_documents`, `summarize_parcel_recordings` | R3 extension tool surface. Includes recording/release-lien write-like requests; not safe to classify as mature without governance proof. |
| Treasury | `check_delinquency_status`, `create_installment_plan`, `explain_tax_breakdown`, `get_tax_statement`, `initiate_tax_sale`, `record_payment`, `summarize_collection_stats` | R3 extension tool surface. Includes payment/tax-sale write-like requests; high-risk until explicitly governed. |
| Audit | `audit_roll_summary`, `check_levy_compliance`, `generate_compliance_report`, `reconcile_cross_office`, `submit_audit_finding` | R3 extension audit surface. Includes finding submission/reconciliation requests; governance proof required. |
| Dossier | `add_dossier_note`, `export_audit_bundle`, `export_equalization_package`, `open_appeal_packet`, `summarize_dossier`, `summarize_parcel_casefile`, `synthesize_evidence`; `dossierService`, `useDossierDetails`, `useEvidenceSnapshot` | Implemented evidence/document surface. Includes export and note actions; needs Dossier-specific truth packet. |
| Pilot | `usePilotTraceList`, `useToolInvocation`, `pilotApi` | Implemented OS-feature trace/invocation surface. Needs Pilot integration truth packet. |

## Maturity Legend

- `Implemented`: route/component exists and has test surface.
- `Read-mostly`: visible state is primarily presentation/read evidence.
- `Tool-invocation`: tab calls Pilot/tool APIs or tool hooks.
- `Write-like request`: UI exposes request/submit/record/finalize/escalate behavior, even if actual server-side effect may still be governed.
- `Governance unclear`: canon/config/type sources disagree or extension status is not fully proved.

## Per-Tab Classification

### Summary

Classification: `Implemented / read-mostly / canonical`.

Evidence:

- Route index child renders `PropertySummary`.
- Uses Workbench context and property store.
- No direct top-file `invokeTool` literals observed.

Risk:

- Low for routing and evidence review.

### Forge

Classification: `Implemented / canonical suite tab / needs Forge surface truth`.

Evidence:

- Route child `forge` renders `PropertyForge`.
- Uses Forge valuation hooks/services.
- Has focused tests including `PropertyForge.*` and `ComparableSalesForgeHost`.

Risk:

- Medium. It is valuation-domain work and should be handled by the Forge surface truth WO before runtime changes.

### Atlas

Classification: `Implemented / canonical suite tab / tool-invocation / needs Atlas surface truth`.

Evidence:

- Route child `atlas` renders `PropertyAtlas`.
- Uses `useAtlasGis` and Pilot tool IDs `query_parcel_layers` and `explain_spatial_anomaly`.
- Mapbox/geometry behavior exists.

Risk:

- Medium. GIS source and map token/locality behavior need Atlas-specific evidence.

### Dais

Classification: `Implemented / canonical suite tab / broad workflow tool surface`.

Evidence:

- Route child `dais` renders `PropertyDais`.
- Many workflow and appeal tool IDs are present.
- Data-test markers cover appeal notice/hearing/deadline/certification sections.

Risk:

- High for production claims because it includes write-like workflow requests. Dais truth should verify what is simulated, request-only, tool-backed, or persistence-backed before promotion.

### Clerk

Classification: `Implemented / R3 extension / governance unclear`.

Evidence:

- Route child `clerk` renders `PropertyClerk`.
- Role visibility includes clerk-facing defaults.
- Tool IDs include `record_document` and `release_lien`.

Risk:

- High. Recording/title actions are county-office sensitive. Do not promote without explicit governance proof.

### Treasury

Classification: `Implemented / R3 extension / governance unclear`.

Evidence:

- Route child `treasury` renders `PropertyTreasury`.
- Tool IDs include `record_payment`, `create_installment_plan`, and `initiate_tax_sale`.

Risk:

- High. Tax collection/payment/tax-sale language is sensitive and must remain evidence-only until separately authorized.

### Audit

Classification: `Implemented / R3 extension / governance unclear`.

Evidence:

- Route child `audit` renders `PropertyAudit`.
- Tool IDs include `submit_audit_finding` and `reconcile_cross_office`.

Risk:

- High. Audit evidence and cross-office reconciliation need governance proof.

### Dossier

Classification: `Implemented / canonical suite tab / evidence/document surface`.

Evidence:

- Route child `dossier` renders `PropertyDossier`.
- Uses Dossier services/details/evidence hooks.
- Tool IDs include export and note actions.

Risk:

- Medium-high. Dossier has evidence/export implications and should be handled in its dedicated surface truth WO.

### Pilot

Classification: `Implemented / canonical OS-feature tab / config type drift`.

Evidence:

- Route child `pilot` renders `PropertyPilot`.
- Shell pack names Pilot as canonical final tab.
- `suiteRegistry.ts` special-cases GPT parcel context to `/property/<parcelId>/pilot`.

Risk:

- Medium. Pilot is the tool execution surface and should be verified through integration truth before runtime changes.

## Validation Run

Commands:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

Expected validation meaning:

- Existing Workbench compliance gate remains green.
- Work Order query remains readable.
- Evidence file has no whitespace errors.

## Proven

- Runtime Workbench currently exposes nine tab routes/components.
- Role visibility and route visibility do not fully match all nine tabs.
- Pilot is implemented in runtime routing but missing from at least one Workbench tab type/list.
- Clerk/Treasury/Audit are real implemented surfaces, not just docs.
- Several tabs expose write-like tool requests and must not be overclaimed as production-safe.

## Not Proven

- Whether Clerk/Treasury/Audit are constitutionally approved permanent tabs.
- Whether write-like tools are no-op, request-only, simulated, or persistence-backed.
- Whether all tab-specific tests are currently green locally.
- Whether all tab surfaces satisfy production evidence/export requirements.

## Next Recommended WO

`WO-WORKBENCH-004 - Forge Surface Truth`

Reason:

After tab maturity classification, the safest next step is the first canonical suite tab surface truth packet. Forge is first in canonical order and should classify valuation data sources, service calls, write lanes, tests, and what is safe to claim before any runtime changes.

## Stop Type

`TAB_TOOL_MATURITY_CLASSIFICATION_READY_FOR_REVIEW`

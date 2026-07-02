# WO-WORKBENCH-007 — Dossier Surface Truth

## Result

`PASS`

The Property Workbench Dossier surface is implemented as a parcel-scoped records, evidence, packet, narrative, and custody surface. It is not a standalone workflow owner: Dossier records and assembles evidence artifacts, while Dais remains the workflow owner for appeals and administrative state.

This work order is evidence-only. No runtime code, route code, package files, CI, schemas, county data, PACS integrations, or deployment surfaces were changed.

## Scope

Goal: classify the Dossier tab and related support surfaces in the canonical assessor Workbench experience.

Inspected surfaces:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`
- `frontend/apps/os-shell/src/components/dossier/*.tsx`
- `frontend/apps/os-shell/src/services/dossierService.ts`
- `frontend/apps/os-shell/src/services/suites/dossierService.ts`
- `frontend/apps/os-shell/src/services/suites/dossierPacketFinalization.ts`
- `frontend/apps/os-shell/src/services/suites/dossierNarrative.ts`
- `frontend/apps/os-shell/src/services/suites/dossierAppealHandoff.ts`
- `frontend/apps/os-shell/src/services/suites/packetComposition.ts`
- `frontend/apps/os-shell/src/__tests__/dossier/**`
- `frontend/apps/os-shell/src/__tests__/workbench/*dossier*.test.tsx`

## Domain Canon

Dossier owns:

- documents
- narratives
- evidence items and custody
- packets
- case files

Dossier does not own:

- Forge valuation math, models, or comps
- Dais workflow/admin state
- Atlas geometry or spatial annotations
- Workbench shell routing or chrome

The Dossier domain pack explicitly states that Dossier records and assembles outcomes; it does not initiate workflows. The inspected appeal-handoff logic follows that rule by preparing handoff artifacts from finalized packets rather than writing appeal state.

## Runtime Shape Observed

The Workbench Dossier tab is a real implemented tab, not a placeholder.

Observed capabilities:

- parcel details are read through `useDossierDetails(parcelId)`
- evidence snapshots are read through `useEvidenceSnapshot(parcelId)`
- documents, evidence, stats, and chain-of-custody are read through Dossier services
- document and evidence lists support packet assembly
- packet provenance is rendered as source-module evidence, not write-lane ownership
- narrative editing and packet narrative linkage exist
- packet finalization and revision logic exists
- appeal handoff readiness exists for finalized packets
- Dossier evidence draft handoff from County Studio exists

The component comments state that primary data is fetched from the live backend and that AI-generated text remains non-authoritative. No fixture fallback was observed in the Workbench Dossier component path.

## Governed Tool Surface

Observed Workbench/Pilot tool identifiers associated with Dossier include:

- `open_appeal_packet`
- `export_equalization_package`
- `export_audit_bundle`
- `summarize_dossier`
- `synthesize_evidence`
- `add_dossier_note`
- `summarize_parcel_casefile`

Classification:

- read-only summary/export actions are operationally useful but still require traceability
- write-low note and packet assembly/finalization actions require Dossier write-lane proof
- any workflow/action that would initiate or mutate an appeal remains out of Dossier scope

## Write-Lane And Custody Posture

Evidence of Dossier write-lane enforcement exists in the service/domain layer:

- packet composition calls `assertWriteLane('dossier', 'document')`
- packet finalization calls `assertWriteLane('dossier', 'document')`
- appeal handoff preparation calls `assertWriteLane('dossier', 'document')`
- narrative draft creation calls `assertWriteLane('dossier', 'document')`
- packet assembly/finalize/evidence write paths in the Dossier service call Dossier write-lane guards

Trace posture observed:

- packet finalization emits `packet_finalized` / `packet_finalization_blocked`
- packet revision emits `packet_revised`
- appeal handoff emits `appeal_handoff_prepared` / `appeal_handoff_blocked`
- narrative creation/update emits narrative trace events

Custody posture is partial but real: chain-of-custody read surfaces exist and packet/evidence models contain custody-relevant concepts. This WO did not prove backend custody immutability, retention policy, county isolation, or legal evidentiary sufficiency.

## Contract Evidence Observed

Relevant contract tests exist for:

- Dossier write-lane guard behavior
- packet metadata
- packet ordering
- packet readiness
- packet finalization
- packet revision
- packet provenance
- narrative assembly
- narrative readiness
- narrative trace emission
- appeal handoff
- appeal handoff write-lane enforcement
- Workbench Dossier tab packet routing
- Dossier-to-Dais appeal routing
- Dossier narrative routing
- Dossier finalization routing
- Property Dossier rendering

This is a stronger maturity posture than a placeholder surface. It still does not prove live backend integration, production authorization, or county-scoped evidence persistence.

## Surface Classification

| Surface | Classification | Evidence |
| --- | --- | --- |
| Workbench Dossier tab | implemented | parcel-scoped tab component, backend service reads, tests |
| Document registry | partial/implemented | document reads and Dossier service paths exist |
| Evidence registry | partial/implemented | evidence reads, add evidence path, custody concepts |
| Packet assembly | implemented with governance hooks | packet component and Dossier service write-lane guard |
| Packet finalization | implemented in domain logic | finalization model, trace events, contract tests |
| Narrative support | implemented in domain logic | narrative service, editor, tests |
| Appeal handoff | implemented as preparation only | no Dais workflow mutation observed in Dossier handoff logic |
| Live backend proof | partial | services call backend, but no live backend run in this WO |
| County isolation proof | partial/missing | county-scoped fields and headers exist elsewhere, but not proven here |
| Custody/legal sufficiency | partial/missing | read surfaces and trace events exist; retention/immutability not proven |

## Gaps And Risks

1. Live Dossier backend behavior was not executed in this WO.
2. County-isolated evidence persistence was not proven.
3. Chain-of-custody immutability and retention semantics were not proven.
4. Dossier packet finalization is a legally significant path and should not be modified without explicit custody-policy authorization.
5. Appeal handoff must remain artifact preparation only; any workflow initiation belongs to Dais.
6. AI-generated Dossier summaries remain non-authoritative unless separately promoted through governed evidence/custody flows.

## Validation Run

Commands intended for this evidence packet:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

## Conclusion

Dossier is a real Property Workbench surface with records/evidence/packet/narrative/custody functionality and meaningful contract coverage. Its maturity classification is `partial/implemented`: the UI and domain model are present, but legal custody depth, county isolation, backend persistence, and live operational proof remain incomplete.

Next recommended work order:

`WO-WORKBENCH-008 — Pilot Integration Truth`

STOP_TYPE: `DOSSIER_SURFACE_TRUTH_CAPTURED`

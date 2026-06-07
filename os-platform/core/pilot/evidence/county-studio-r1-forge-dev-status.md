# County Studio R1 Forge Dev Status

Generated: 2026-06-07T18:28:02.344Z
Status: COUNTY_STUDIO_R1_FORGE_DEV_READY

## Summary

- forgeDevAllowed=true
- realDevActivationAllowed=true
- productionProofAllowed=false
- operationalProofAllowed=false
- dataTruthStatus=DATA_TRUTH_FAIL
- geometryStatus=SYNC_DERIVED_GEOMETRY
- riskObjectStatus=DEV_DERIVED_FROM_REAL_INPUTS
- ownerSupnumStatus=NOT_REQUIRED_FOR_FORGE_DEV
- countyStudioMode=REAL_BENTON_FORGE_DEV
- requiredRunCommand=pnpm run dev:county-studio:real-benton

## Runbook

Start County Studio real Benton Forge dev:

```bash
pnpm run dev:county-studio:real-benton
```

Required preflight chain:

- `pnpm run proof:county-studio:real-dev-backend-health`
- `pnpm run proof:county-studio:benton-real-dev-server-readiness:db`
- `pnpm run proof:county-studio:real-dev-activation`
- `pnpm run proof:county-studio:forge-real-data-wiring`
- `pnpm run proof:county-studio:risk-object-source-audit`

This is not production proof. It allows County Studio R1 to run as a real Benton-backed TerraForge valuation development surface only.

This is not operational proof. Packet, Dais, Dossier, Trace, owner identity, and workflow evidence remain blocked.

Owner-supnum remains required for packet/ops proof, not current County Studio Forge valuation dev.

## Remaining Production Blockers

- Canonical Benton source/count reconciliation remains required before production proof.
- CountyId, taxYear, studyId, parcel/property, valuation, ratio-study, and same-study map/ledger/inspector lineage must be reconciled against authoritative manifests.
- TerraAtlas geometry is wired for real dev, but production GIS proof still requires canonical TerraAtlas layer, boundary, neighborhood, segment, reval, taxing-district, and symbology lineage.
- Risk objects are acceptable for Forge dev only; production proof requires recomputation from canonical Benton source rows and same-study alignment.

## Remaining Operational Blockers

- Owner-supnum remains required for packet/ops proof, Dossier packets, Dais/notice/appeal identity, and operational owner references.
- Production proof must pass before operational proof can be claimed.
- Dossier evidence packets, Dais workflow creation, TerraTrace decision chain, and parcel/workbench handoff evidence remain operational proof requirements.

## Source Artifacts

- backendHealth: os-platform/core/pilot/evidence/county-studio-real-dev-backend-health.json
- readiness: os-platform/core/pilot/evidence/benton-real-dev-server-readiness.json
- activation: os-platform/core/pilot/evidence/county-studio-real-dev-server-activation.json
- forgeWiring: os-platform/core/pilot/evidence/county-studio-forge-real-data-wiring.json
- geometry: os-platform/core/pilot/evidence/county-studio-terraatlas-geometry-evidence.json
- riskAudit: os-platform/core/pilot/evidence/county-studio-risk-object-source-audit.json

## Live Readiness Refresh

- attempted: true
- exitCode: 0
- command: "C:\Program Files\nodejs\node.exe" C:\Users\bsval\.codex-worktrees\county-studio-r1-packet-payloads\os-platform\core\pilot\benton-real-dev-server-readiness.mjs --db-runtime docker
- interpretation: Live readiness refresh passed; consolidated status may use the refreshed readiness artifact.

## Blockers

- None

## Boundaries

- This consolidation does not touch County Studio UI.
- This consolidation does not mutate TerraFusion Sync.
- This consolidation does not change DB seeding.
- This consolidation does not weaken any proof gate.
- This consolidation does not set productionProofAllowed=true.
- This consolidation does not set operationalProofAllowed=true.
- This consolidation does not hide packet/ops blockers.

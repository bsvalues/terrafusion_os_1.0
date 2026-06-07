# County Studio Exemption Fact Dependency

Generated: 2026-06-07T19:46:58.1016756Z

Status: `NOT_REQUIRED_FOR_FORGE_DEV`

## Starting Point

PR #919 full Forge dev smoke exposed a readiness-gate blocker:

```text
load_batch stage: exemption-fact-seal
load_batch status: FAILED
```

That exposed a gate-scoping issue. County Studio is a TerraForge valuation dev surface, and exemption facts should not globally block Forge dev unless a County Studio Forge surface actually consumes exemption data.

## Current Runtime

The current live runtime has advanced since the PR #919 smoke:

```text
loadBatchStage=exemption-fact-seal
loadBatchStatus=COMPLETED
loadBatchId=e21e20ea-4bfb-402e-8496-4506f6829922
```

The gate still classifies the dependency explicitly, including the failed-stage case covered by regression tests.

## Classification

```text
exemptionFactStatus=NOT_REQUIRED_FOR_FORGE_DEV
exemptionFactRequiredForForgeDev=false
exemptionFactRequiredForProductionProof=true
exemptionFactRequiredForPacketProof=true
exemptionFactRequiredForOperationalProof=true
exemptionFactsConsumedByForgeSurfaces=false
```

## Audit

Current County Studio Forge valuation dependencies:

- parcel/property identity
- property characteristics
- valuation metrics
- ratio-study context
- risk objects
- geometry/map context
- countyId
- taxYear
- studyId

Exemption facts remain relevant to non-Forge-dev proof/workflow surfaces:

- Dais exemption administration
- tax relief workflow
- notice/tax liability context
- Dossier packet exemption proof
- operational roll packet references

## Decision

```text
forgeDevAllowed=true
realDevServerAllowed=true
realDevActivationAllowed=true
productionProofAllowed=false
operationalProofAllowed=false
```

## Regression Coverage

- `benton-real-dev-server-readiness.test.mjs`: does not block Forge dev when exemption fact seal failed but exemptions are not consumed.
- `benton-sync-drain-state-evidence-adapter.test.mjs`: classifies exemption fact seal failure as not required for Forge dev.

## Boundaries

- This evidence does not touch County Studio UI.
- This evidence does not mutate TerraFusion Sync.
- This evidence does not change DB seeding.
- This evidence does not weaken production proof.
- This evidence does not weaken operational proof.
- This evidence does not hide exemption-fact-seal state.

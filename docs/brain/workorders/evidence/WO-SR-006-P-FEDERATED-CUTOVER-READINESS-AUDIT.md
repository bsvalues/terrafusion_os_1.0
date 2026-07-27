# WO-SR-006-P - Federated Cutover Readiness Audit Evidence

## Verdict

`DECOMPOSITION_COMPLETE_R3_CROSS_REPOSITORY_ARTIFACT_AUTHORITY_REQUIRED`

The five-suite program is active and has completed its contract, adapter, standalone parity, and
pure-unwired F1 foundation layers. It has not completed runtime adoption or cutover. No registered
R2 implementation node remained after Dais F1 closeout, so this audit decomposes the first protected
successor instead of claiming the portfolio is complete or generically parked.

## Audit anchors

| Surface | Exact current value |
| --- | --- |
| Sovereign `origin/main` | `f96bc0919f8c9091c5205fae8b5352a6d19253bd` |
| `bsvalues/terrafusion-forge` `main` | `2430b483f20e07a6ff9a66e493caab0e39db64ef` |
| `bsvalues/terrafusion-atlas` `main` | `6c530f1b6b77d59225353dede929c0688f1587da` |
| `bsvalues/terrafusion-dais` `main` | `29a34b0feeab32984a4dedf1af853239993b4a26` |
| `bsvalues/terrafusion-dossier` `main` | `7558cfebfeea0c7b536251769b1d779c4558a763` |
| `bsvalues/terrafusion-gpt` `main` | `e0856e46807844a95d57aaef49d3350c1bc38a33` |
| Open suite PRs | none |
| Work Order query | 83 terminal records; no active or recommended candidate |
| Wave planner | no executable wave |

The repository heads were read from the GitHub API without reading credential values. The shared
checkout remained quarantined and the audit ran in a dedicated current-main worktree.

## Readiness matrix

| Suite | Existing proof | Missing before cutover | Current classification |
| --- | --- | --- | --- |
| Forge | Byte-identical Rust valuation kernel in sovereign and standalone repositories; 2/2 parity; required suite checks | Standalone artifact publication or transfer contract, sovereign shadow consumption, deployment-neutral path contract, rollback rehearsal, ownership transfer | First protected successor |
| Atlas | Frozen `atlas.spatial-read@1.0.0`, unwired sovereign adapter, standalone projection and hash-pinned synthetic parity | Runtime provider/consumer, package boundary, integration parity, rollback, ownership transfer | Pure-unwired F1 only |
| Dais | Frozen `dais.appeal-workflow@1.0.0`, unwired sovereign adapter, corrected standalone lifecycle foundation and parity | Runtime service/consumer, persistence boundary, county-safe integration proof, rollback, ownership transfer | Pure-unwired F1 only |
| Dossier | Frozen `dossier.evidence-registry-read@1.0.0`, unwired sovereign adapter, corrected standalone evidence foundation and parity | Runtime consumer, custody/persistence boundary, integration proof, rollback, ownership transfer | Pure-unwired F1 only |
| GPT | Frozen `gpt.grounded-context@1.0.0`, unwired source-identity projection and adapter, standalone foundation and parity | Provider/model boundary, runtime consumer, embedding/persistence boundary, integration proof, rollback, ownership transfer | Pure-unwired F1 only |

## Shared missing proof

The completed F1 layer intentionally proves none of the following:

1. a versioned artifact or package distribution boundary;
2. sovereign runtime consumption from a standalone suite repository;
3. shadow parity at the actual runtime invocation boundary;
4. deployment-neutral path and version resolution;
5. rollback from a standalone artifact to the sovereign implementation;
6. production, county, PACS, SQL, credential, or secret handling;
7. deletion, source retirement, or canonical ownership transfer.

These are real gaps, not failed tests. Existing F1 evidence explicitly denied them.

## Why Forge is first

Forge is the only suite whose standalone executable is an exact byte-proven copy of a sovereign
runtime component. The sovereign API currently invokes
`packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe` through
`ValuationKernelClient`. The standalone repository contains the same kernel source at exact main
`2430b483f20e07a6ff9a66e493caab0e39db64ef`.

That makes Forge the smallest place to test the repository boundary without introducing a provider,
database, county resource, or new product algorithm. The test must remain non-production and must not
switch the configured runtime path.

## Proposed protected successor

### Work Order

`WO-SR-006A - Forge Standalone Kernel Artifact and Shadow-Consumer Gate`

### Purpose

Build a hash-pinned valuation-kernel artifact from the standalone Forge repository and prove that
the sovereign non-production integration harness can consume it with output parity, while leaving
the configured TerraFusion runtime and sovereign source untouched.

### Exact proposed implementation surfaces

Standalone Forge repository:

1. `.github/workflows/suite-ci.yml` - bounded artifact build/upload step only
2. `operations/work-orders/WO-SR-006A-forge-standalone-kernel-artifact.md`
3. `operations/evidence/WO-SR-006A-FORGE-STANDALONE-KERNEL-ARTIFACT.md`

Sovereign repository:

1. `.github/workflows/terraforge-kernels.yml` - pinned private-repository artifact retrieval and
   shadow-parity job only
2. `backend/TerraFusion.API.Tests/Services/Valuation/KernelValuationServiceIntegrationTests.cs` -
   explicit test-only artifact path and parity assertions
3. the exact governance, Work Order, evidence, registry, and routing files admitted by the future
   packet

### Required proof

- exact standalone source SHA and artifact SHA-256;
- private artifact retrieval succeeds without exposing credential values;
- existing sovereign kernel remains the configured runtime;
- standalone artifact passes the existing valuation integration corpus;
- sovereign and standalone outputs match for accepted cases and fail closed identically;
- no package, lockfile, source, appsettings, deployment, or production change;
- rollback is removal of the shadow job and test-only artifact path;
- all required checks and exact-head assurance pass.

### Why standing authority does not cover it

The successor changes two CI workflow surfaces and requires authenticated access to an artifact from
a private sibling repository. Both CI wiring and credential-mediated cross-repository access are
protected boundaries under root governance. The current R2 Work Order cannot create that authority.

### Explicit denials

- no `backend/src/**` runtime change;
- no `appsettings*.json` change;
- no production or deployment path change;
- no sovereign source deletion or Cargo workspace removal;
- no package publication, release creation, or public artifact;
- no county, PACS, SQL, secret-value inspection, or external operational access;
- no Atlas, Dais, Dossier, or GPT adoption;
- no `WO-SR-006` ownership cutover.

### Terminal condition

`FORGE_SHADOW_CONSUMPTION_PROVEN_WITHOUT_RUNTIME_SWITCH`

Only after that result may the operator prepare a separate runtime-switch and rollback gate. Source
retirement remains later and separately protected.

## Reconciliation corrections

The prior wall ledger said every remaining suite still needed E3 and parity proof. That statement is
superseded: Atlas, Dais, Dossier, and GPT completed E3, and all four standalone F1 foundations now
have parity evidence. The live blocker is adoption and cutover proof, not missing extraction audits.

## Safety and non-claims

This audit changed governance documentation only. It did not modify source, contracts, packages,
workflows, branch protection, runtime configuration, deployment, credentials, county data, PACS,
SQL, or production resources. It does not authorize `WO-SR-006A` or any later cutover step.

## Result

`WO-SR-006-P_COMPLETE_FORGE_SHADOW_CONSUMPTION_AUTHORITY_REQUIRED`

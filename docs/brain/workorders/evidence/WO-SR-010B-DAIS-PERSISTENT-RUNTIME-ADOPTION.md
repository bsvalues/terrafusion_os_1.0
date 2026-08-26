# WO-SR-010B - Dais Persistent Exact Runtime Adoption Evidence

## Current verdict

`LOCAL_TERMINAL_PROOF_PASS_AWAITING_PROTECTED_REVIEW_AND_MERGE`

## Immutable inputs

| Surface | Identity |
| --- | --- |
| Sovereign base | `5182742d756cea6a939bb12489e660d83b9593b6` |
| WO-SR-010A PR | #1466; exact head `88e7454b2a64a99d3a917914e486fff410df756c`; squash merge `5182742d756cea6a939bb12489e660d83b9593b6` |
| Dais protected source | `bsvalues/terrafusion-dais@6932bbbf014cf70d7362e070a1dad2a8a680ad47`, reachable from protected `main` |
| Module | 9269 bytes; `5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb` |
| Frozen schema | 3496 bytes; `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |
| Suite source manifest | `6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859` |

## Required observed runtime proof

- exact three-file startup and per-invocation verification;
- constrained local Node execution with network denial and invocation-directory-only filesystem access;
- accepted, rejected, malformed, oversized, timeout, cancellation, tamper and cleanup outcomes;
- real authenticated county-scoped controller path through the suite module;
- persistent Development `LocalExact` selection and Production refusal;
- published Development downgrade where source-tree capability markers are absent;
- two fresh LocalExact starts, Disabled rollback start, restored LocalExact start;
- no process execution after post-construction module, schema or manifest tamper;
- byte-identical restoration and durable receipt after cleanup;
- existing Dais contract, county-isolation and Workbench regressions remain green.

## Observed local runtime adoption

The governed adoption wrapper completed with the exact Work Order terminal condition
`DAIS_PERSISTENT_LOCAL_EXACT_RUNTIME_ADOPTED_ROLLBACK_EXECUTED_AND_LEGACY_SEMANTIC_FALLBACK_RETIRED`
under run `20260826T223117913Z-31eb2bd980cf41ad99369ffa981712d3`. Its local receipt SHA-256 is
`eaff739bd831f31e3eba0a5fe3425e77848448685b97aa3ebe7e78223ebc0c9a`; a sanitized machine-readable
copy is committed beside this evidence as `WO-SR-010B-runtime-adoption-receipt.json`.

| Observation | Result |
| --- | --- |
| Sovereign runtime head | `5182742d756cea6a939bb12489e660d83b9593b6` |
| Dais suite source | `6932bbbf014cf70d7362e070a1dad2a8a680ad47` |
| Release exact-runtime tests | 118 total, 118 executed, 118 passed, 0 failed, 0 skipped |
| Persistent Development selection | `LocalExact`, 30-second bound; no configurable module/schema/Node redirects |
| Runtime start A / restart B | separate exact controller-consumer-process executions; `PASS` / `PASS` |
| Disabled rollback / restored LocalExact | separate observed starts; `PASS` / `PASS` |
| Post-construction tamper | manifest, module and schema each failed closed before process start |
| Production selection | separate refusal observation; `PASS` |
| Exact runtime path | authenticated county-scoped controller -> consumer -> verified host -> pinned Dais module; `PASS` |
| Artifact rollback | prior slot restored and all three hashes verified; adopted slot then restored and verified |
| Protected/county data | none used |
| Deployment/production action | none used |

The wrapper restaged from protected Dais `main`, required the prior live slot, verified the stager's
rollback inventory, relocated that entire prior slot into durable ignored recovery storage, moved the
adopted slot aside, restored the prior slot and verified it byte-for-byte, then restored and reverified
the adopted slot. The durable rollback inventory is exactly three files: module
`5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb`, schema
`b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c`, and manifest
`e9ffd2acd811d7f2d309929757661f7f5dd3873b1027fa1af500b0d7eadb9186`.

The final combined exact-runtime run executed 118/118 tests with zero skips. Registration hardening
separately executed 37/37 tests, including exact manifest byte identity and redirected-ancestor
refusal. Consumer cancellation verification executed 16/16. The host hardening run executed all new
cleanup and Node replacement tests; its two environment-gated tests were subsequently executed by
the final combined run against the real staged paths.

A separate legacy-regression selection executed 74/74 tests with zero skips across the frozen Dais
adapter, Dais persistence/county isolation, certification service and appeal write-lane guards.

Three post-repair independent read-only reviews returned `CLEAN`: runtime correctness/security,
proof/governance transaction integrity, and semantic-ownership scope. The ownership review confirms
this child is the bounded read-runtime adoption and that the immediate Dais ownership successor must
classify/cut over remaining mutable defaults and transitions before Dossier begins.

## Remaining protected-repository gates

- exact-head protected checks and resolved review threads;
- merge and protected-main verification.

## Boundaries

The frozen DTO/schema, database entities, migrations, appeal writes, providers, frontend contract,
credentials, production and deployment configuration remain unchanged. The OS retains authentication,
county isolation, persistence acquisition, SQLite normalization, transport and provenance enforcement.
The Dais suite owns the mutable provider-neutral workflow validation semantics.

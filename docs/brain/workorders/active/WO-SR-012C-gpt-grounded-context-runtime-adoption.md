# WO-SR-012C - GPT Grounded-Context Runtime Adoption

| Field | Value |
| --- | --- |
| Status | COMPLETE - protected runtime and exact tree equality verified |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R4 bounded Development runtime adoption and duplicate retirement |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| GPT protected source | `bsvalues/terrafusion-gpt@550b50f27af6f0911f16c973cbb6fc57a20eb15a` |
| Reviewed OS head | `3bd87411966a7d2c61439f4f60a11f0cb498968f` |
| Reviewed OS tree | `e6797a83c2c47f3a62bcbfd19e544cd0ae6e5bf8` |
| Reviewed OS base | `65ddfe9948b02c0cd6089fc95c83e48885cc92ab` |
| Protected OS merge | `9ef50aa1cc608fa3aa8075f30cf349b757a31902` |
| Protected OS tree | `e6797a83c2c47f3a62bcbfd19e544cd0ae6e5bf8`, equal to reviewed tree |
| Protected-main proof run | `33073723122`, success on protected head |
| Terminal condition | `GPT_GROUNDED_CONTEXT_CANONICAL_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN` |

## Objective

Adopt the exact GPT-owned `gpt.grounded-context@1.0.0` validation module as a real sovereign
Development runtime. The sovereign OS retains authentication, county/dataset authorization,
retrieval, transport, configuration, and artifact hosting. The suite makes the pre-retrieval PII
and request judgment and the post-retrieval citation/result judgment.

Provider generation is not claimed by this Work Order. Existing simulated provider output is not
canonical evidence and is not called by the new route. A missing provider/embedding configuration
continues to fail closed without any secret or credential-policy change.

## Exact product scope

- extend `GptGroundedContextRuntimeOptions` with timeout and resolved local identity;
- execute hash-verified in-memory snapshots of the exact staged module/schema in a disposable,
  network-denied Node process, verifying the complete manifest, source/executed bytes, custody-bound
  Node identity, streaming I/O caps, source stability, and process cleanup;
- persist `Disabled` in base settings and `LocalExact` in Development settings;
- register the host and consumer only for capable Development source checkouts;
- expose authenticated `POST /api/gpt/grounded-context` using canonical `rag-dataset:{id}` keys;
- require request county identity to equal authenticated county and require an active dataset owned
  by that county before and after retrieval, with strict repository failures that cannot collapse to
  a legitimate empty result;
- remove raw query text from RAG logs and project only stable document/chunk identity, bounded
  excerpt, title, score, and ordering into the contract;
- retire the unwired sovereign `GptGroundedSourceIdentityProjection` and
  `GptGroundedContextAdapter`, because their mutable validation judgment is now suite-owned;
- retain sovereign DTOs, schema, auth, retrieval, host, consumer, and API integration.

## Proof requirements

- exact suite module/schema/manifest identity at startup and every invocation, with in-memory
  execution identity and post-execution source-slot revalidation;
- request preflight occurs before dataset lookup, logging, embedding, retrieval, or provider access;
- county mismatch and unowned/inactive datasets never reach retrieval;
- raw PII rejection never reaches retrieval and never appears in logs;
- canonical grounded, no-context, and denied outcomes execute through the suite module;
- full source text, provider URL/name/model, embeddings, and credentials do not cross the route;
- persistent LocalExact start, restart, Disabled rollback, restored LocalExact, and Production refusal;
- module, schema, and manifest tamper refusal, including post-measurement mutation;
- bounded concurrent process capacity and streaming output termination at the configured caps;
- real staging whole-slot rollback and adopted artifact restoration;
- focused .NET tests plus all protected required contexts on the exact PR head.

## Hard walls

No deployment, Production activation, county/PACS/SQL/live-data use, secret or credential-policy
change, Azure work, constitutional change, sixth suite, cross-suite write, provider generation claim,
or irreversible destructive action.

## Rollback

Select `GptGroundedContextRuntime:Mode=Disabled`, restart, and observe no host or consumer
registration. Restore the byte-identical prior three-file artifact slot from the staging rollback
inventory when artifact rollback is required. Revert this Work Order's protected merge to retire the
route and registration while retaining the frozen sovereign contract.

## Terminal candidate assurance

Manual proof workflow run `33071051037` completed successfully on reviewed head
`3bd87411966a7d2c61439f4f60a11f0cb498968f`, tree
`e6797a83c2c47f3a62bcbfd19e544cd0ae6e5bf8`, based on protected Dossier-retirement
main `65ddfe9948b02c0cd6089fc95c83e48885cc92ab`. Independent review reported no
actionable P0/P1. The reviewed head squash-merged as protected main
`9ef50aa1cc608fa3aa8075f30cf349b757a31902` with exact tree equality. All eight
required contexts plus broader backend, security, evidence, seal, frontend, and build-package
first-party checks passed with zero review threads.

Protected-main proof workflow run `33073723122` then completed successfully on exact protected head
`9ef50aa1cc608fa3aa8075f30cf349b757a31902`.

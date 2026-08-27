# WO-SR-010G - Dais Appeal Mutation Runtime Adoption

| Field | Value |
| --- | --- |
| Status | ACTIVE - local terminal proof passed; protected assurance pending |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R4 canonical runtime adoption and recoverable ownership cutover |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign dependency | protected `main` `acf4abc5959f468c6a43a00b09cead5d55679795` |
| Suite source | Dais protected `main` `8a9cfc608bcda835126db2054bb7ba7ecf185275` |
| Contract | `dais.appeal-mutation@1.0.0` |
| Terminal condition | `DAIS_APPEAL_MUTATION_LOCAL_EXACT_RUNTIME_ADOPTED_ROLLBACK_EXECUTED_AND_DUPLICATE_JUDGMENT_RETIRED` |

## Objective

Adopt the exact staged Dais appeal-mutation artifact as the real persistent Development decision
boundary for appeal creation and lifecycle transitions. Fail closed on unavailable, rejected,
tampered, or stale decisions; execute and observe rollback; and leave Dais as the sole owner of
appeal lifecycle judgment while the sovereign OS retains only integration, persistence,
authorization, audit, and HTTP mapping responsibilities.

## Exact boundary

- exact module SHA-256: `779ef37435e2deb8f181b3c34e0712c35829b7a123f047752fc5bf09de331ff2`;
- exact schema SHA-256: `db8f1c93a598da7f9c454d5a43c275b849f2de8fc036e9be28c5c1da44432ce2`;
- exact published manifest SHA-256: `c858e7cd390502bf1461cf7af6302916a7c437f5f4f47b17d379f49af114b825`;
- fixed slot: `.terrafusion/runtime/dais/appeal-mutation`;
- persistent selection: `DaisAppealMutation.Mode=LocalExact` in Development only;
- no configurable module, schema, or Node executable redirect;
- no Production selection, deployment, county/PACS/live-data access, schema migration, or secret change.

## Required proof

1. the authentic 24-field mutation provenance manifest and exact bytes verify before process start;
2. fresh host start and restart resolve and execute the exact staged decision port;
3. appeal creation and lifecycle transition persist only after an accepted suite decision;
4. rejection maps to 422, unavailability/tamper to 503, and stale snapshot conflict to 409;
5. two concurrent SQLite contexts cannot overwrite a committed terminal lifecycle decision;
6. the sovereign lifecycle graph/defaults are retired rather than duplicated;
7. the exact controller/service/process/consumer path passes with zero skipped observed cases;
8. a prior Disabled slot is physically restored and hash-observed, then the adopted exact slot is restored;
9. proof recovery is mutex-serialized, anchored to pre-stage inventories, independently attempted for
   both slots, and refuses corrupt custody;
10. independent review, required protected checks, exact-head merge, and protected-main verification pass.

## Continuation

WO-SR-010H separately retires the frontend scheduling offer. Dossier begins only after both Dais
children are protected-main complete.

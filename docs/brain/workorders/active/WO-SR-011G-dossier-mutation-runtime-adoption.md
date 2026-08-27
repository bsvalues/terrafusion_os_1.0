# WO-SR-011G - Dossier Mutation Runtime Adoption

| Field | Value |
| --- | --- |
| Status | ACTIVE - implementation and protected proof |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Base | protected OS `807a46aad94e5bc8a36d7974130d482e49a73d2b` |
| Suite source | protected Dossier `2c709fe2286b5c1e6bde43fcbc2a35111a456092` |

## Objective

Adopt the exact staged `dossier.mutation-decision@1.0.0` artifact through a Development-only,
persistent `LocalExact` process boundary and make every reachable persistent Dossier write route
consume its accepted mutation. Retire duplicate sovereign defaults, classifications, lifecycle,
custody, and packet-composition judgment while preserving sovereign authentication, county/parcel
isolation, IDs, UTC timestamps, SHA-256 inputs, optimistic concurrency, persistence, audit/logging,
HTTP mapping, and rollback.

## Exact scope and walls

- Six operations: create note, register document, transition document status, register evidence,
  append custody event, and create packet.
- Exact module/schema/published-manifest identities from WO-SR-011F are verified at selection and
  before every process invocation.
- Base and Production remain Disabled; Production refuses `LocalExact`.
- Synthetic SQLite/runtime proof only. No Azure, deployment, live county/PACS/SQL mutation,
  secrets, WilliamOS, or topology change.
- Rollback is physical configuration selection back to Disabled plus the reversible Git migration;
  the staged artifact remains inert and recoverable.

## Required proof

Exact-artifact start/restart, schema/module/manifest tamper-before-save refusal, timeout/cancel and
bounded-output failure, rejected/unavailable no-save, cross-county refusal, optimistic conflicts,
all-six accepted mutation persistence, existing read-consumer observation, Disabled rollback and
LocalExact restoration, focused unit/integration builds, governance gates, protected PR merge, and
protected-main verification.

# WO-LOCALOPS-011 — Atlas Configuration and Authentication Boundary

**Authorization:** `TERRAFUSION_STAGE5_CONTINUOUS_LOCALOPS_DELIVERY`
**Milestone:** `ATLAS_CONFIGURATION_AUTH_BOUNDARY`
**Risk:** R0, read-only committed-configuration proof

## Outcome

Prove that TerraFusion's production configuration resolves the approved Atlas database/cache endpoint
and authentication requirements without starting a subprocess, connecting to Atlas, reading credential
values, executing a query, running a migration, or mutating state.

## Boundaries

- Inspect only the committed production connection templates, runtime connection resolver, and
  authentication registration. The proof pins the approved Atlas endpoint `192.168.1.156` directly;
  it does not evaluate local SSH configuration or start any process.
- Emit endpoint identity, ports, database/principal names, configuration keys, and credential-reference
  names. Never read or emit a credential value or a fully resolved connection string.
- Treat `${TF_DB_HOST}` and `${TF_REDIS_HOST}` as deployment-template references. Do not claim that
  .NET configuration expands those placeholders automatically.
- Fail closed for source drift, disconnected resolver/authentication registration, missing sources, or
  any input beyond the repository root.
- Do not import subprocess, network, database, Redis, or migration clients. Do not access county data,
  Hermes, Forge, production, or any database service.

## Required proof

- Focused tests cover positive resolution plus credential input, template drift, disconnected runtime
  resolution, authentication drift, signing-key disconnection, and missing-source negatives.
- A static regression proves the entrypoint has no subprocess/network/database/migration client.
- A real local run resolves the pinned endpoint and committed TerraFusion contracts while reporting all
  safety flags false and `secretValuesInspected: false`.
- Required core governance and generated-code gates pass at the reviewed PR head.

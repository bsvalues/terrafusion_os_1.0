# WO-LOCALOPS-011 — Atlas Configuration and Authentication Boundary

**Authorization:** `TERRAFUSION_STAGE5_CONTINUOUS_LOCALOPS_DELIVERY`
**Milestone:** `ATLAS_CONFIGURATION_AUTH_BOUNDARY`
**Risk:** R0, read-only committed-configuration proof

## Outcome

Prove that TerraFusion's production configuration resolves the intended Atlas database/cache endpoint
and authentication requirements without connecting to Atlas, reading credential values, executing a
query, running a migration, or mutating state.

## Boundaries

- Inspect only the committed production connection templates, runtime connection resolver,
  authentication registration, and the effective fixed `atlas` SSH alias configuration.
- Use `ssh -G atlas` only. It expands local SSH configuration and makes no SSH or network connection;
  the resolved hostname must remain the approved Atlas endpoint `192.168.1.156`.
- Emit endpoint identity, ports, database/principal names, configuration keys, and credential-reference
  names. Never read or emit a credential value or a fully resolved connection string.
- Treat `${TF_DB_HOST}` and `${TF_REDIS_HOST}` as deployment-template references. Do not claim that
  .NET configuration expands those placeholders automatically.
- Fail closed for source drift, disconnected authentication registration, missing sources, an
  unavailable or endpoint-drifted alias, an unsafe hostname, inherited forwarding, or any input beyond
  the repository root.
- Do not import network, database, Redis, or migration clients. Do not access county data, Hermes,
  Forge, production, or any database service.

## Required proof

- Focused tests cover positive resolution plus credential input, template drift, authentication drift,
  unsafe alias, missing alias, and missing-source negatives.
- A static regression proves the entrypoint has no network/database/migration client.
- A real local run resolves the fixed `atlas` alias and committed TerraFusion contracts while reporting
  all safety flags false and `secretValuesInspected: false`.
- Required core governance and generated-code gates pass at the reviewed PR head.

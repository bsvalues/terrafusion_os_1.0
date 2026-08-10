# Evidence — WO-LOCALOPS-011 Atlas Configuration and Authentication Boundary

## Contract proved

- Fixed identity anchor: approved endpoint `192.168.1.156`, pinned in the proof; no subprocess.
- PostgreSQL: port `5432`, database `terrafusion_production`, principal `terrafusion`.
- Redis: port `6379`.
- Deployment host references: `TF_DB_HOST`, `TF_REDIS_HOST`.
- Credential references only: `TF_DB_PASSWORD`, `TF_REDIS_PASSWORD`,
  `JwtSettings__SecretKey`.
- JWT identity references: `JwtSettings__Issuer`, `JwtSettings__Audience`.
- Runtime override keys: `ConnectionStrings__DefaultConnection`,
  `ConnectionStrings__Redis`.
- Authentication: JWT Bearer validates issuer, audience, lifetime, and signing key; the fallback policy
  requires an authenticated user.
- Production placeholder expansion is deliberately not claimed.

## Automated proof

- Focused Atlas boundary suite: 10 passed.
- Atlas plus existing Academy/Ollama/lifecycle regressions: 73 passed.
- Phase 8.3 core gate: 56 passed.
- Core TypeScript check: passed.
- Generated JavaScript header check: passed.
- Positive and negative sources are committed synthetic/configuration fixtures only.
- Static client scan: no subprocess, network, database, Redis, or migration client.
- Broader repository and build results are recorded on the pull request at the exact reviewed head.

## Live local proof

- Positive: `pnpm run localops:atlas-boundary` returned `status: ready`, hostname `192.168.1.156`,
  PostgreSQL `5432`, Redis `6379`, the documented credential-reference names, and all safety flags
  false. It read committed contracts and started no subprocess.
- Negative: invoking the entrypoint from a directory without the required committed sources returned
  `ATLAS_BOUNDARY_SOURCE_UNAVAILABLE` and exit `1`. There was no fallback.

## Safety

No network connection, database query, migration, secret value inspection, state mutation, external AI,
live county data, production cutover, Hermes change, or Forge change is part of this proof.

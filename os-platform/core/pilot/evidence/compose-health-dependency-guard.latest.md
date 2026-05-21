# Compose Health Dependency Guard

Generated: 2026-05-21T01:29:45.924Z
Compose: `ops/prod/runtime-compose.template.yml`
Passed: yes

| Service | Healthcheck | service_healthy Dependencies |
|---|---:|---|
| proxy | no | backend, frontend |
| backend | yes | - |
| frontend | yes | backend |

## Violations

- none
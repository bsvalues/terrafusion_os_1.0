# Compose Health Dependency Guard

Generated: 2026-05-21T01:29:53.079Z
Compose: `.tmp/runtime-compose.production.yml`
Passed: yes

| Service | Healthcheck | service_healthy Dependencies |
|---|---:|---|
| proxy | no | backend, frontend |
| backend | yes | - |
| frontend | yes | backend |

## Violations

- none
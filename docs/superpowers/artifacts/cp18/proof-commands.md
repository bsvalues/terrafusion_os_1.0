# CP-18 Proof Commands

Date: 2026-03-19
Phase: CP-18
Gate: G9
Status: COMPLETE

## Baseline

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Targeted Security/Compliance Checks

```bash
pnpm run security:scan
pnpm run validate:compliance
pnpm run ci:dependency-scope-quarantine:gate
```

## Governance Gate Suite (all phases required for G9)

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

## Security Finding Verification

```bash
# Verify Cowlitz credential is no longer hardcoded
Select-String -Path compose/docker-compose.cowlitz.yml -Pattern 'POSTGRES_PASSWORD'
# Expected: shows ${TF_COWLITZ_DB_PASSWORD:?...} (not a static string)
```

## Command Wall Execution Record

| Command | Result | Run At |
|---|---|---|
| `pnpm run type-check` | PASS (exit 0) | 2026-03-19 CP-18 seal run |
| `node --test phase83-tools.test.mjs` | PASS 56/56 | 2026-03-19 CP-18 seal run |
| `node --test phase85-tools.test.mjs` | PASS 22/22 | 2026-03-19 CP-18 seal run |
| `node --test phase86-toolrunner.test.mjs` | PASS 9/9 | 2026-03-19 CP-18 seal run |
| `pnpm run security:scan` | PASS (exit 0) | 2026-03-19 CP-18 seal run |
| `pnpm run validate:compliance` | PASS (exit 0) | 2026-03-19 CP-18 seal run |
| `pnpm run ci:dependency-scope-quarantine:gate` | PASS (exit 0) | 2026-03-19 CP-18 seal run |
| Swarm load / queue guard / break-glass live drills | DEFERRED (SRE + AI Swarm lane) | — |

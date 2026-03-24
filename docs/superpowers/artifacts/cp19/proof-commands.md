# CP-19 Proof Commands

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: COMPLETE

## Baseline

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Governance Gate Suite (all required for G10)

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
pnpm run governance:check
pnpm run ci:governance-proof
```

## SRE Status Check

```bash
# Remove WSL root env override if set, then check status
Remove-Item Env:TF_WSL_ROOT -ErrorAction SilentlyContinue
pwsh -File ops/dev/tf.ps1 status
```

## Security / Compliance (full G9 suite carried forward)

```bash
pnpm run security:scan
pnpm run validate:compliance
pnpm run ci:dependency-scope-quarantine:gate
```

## Command Wall Execution Record

| Command | Result | Run At |
|---|---|---|
| `pnpm run type-check` | PASS (exit 0) | 2026-03-19 CP-19 seal run |
| `node --test phase83-tools.test.mjs` | PASS 56/56 | 2026-03-19 CP-19 seal run |
| `node --test phase85-tools.test.mjs` | PASS 22/22 | 2026-03-19 CP-19 seal run |
| `node --test phase86-toolrunner.test.mjs` | PASS 9/9 | 2026-03-19 CP-19 seal run |
| `pnpm run governance:check` | PASS (exit 0) | 2026-03-19 CP-19 seal run |
| `pnpm run ci:governance-proof` | PASS (exit 0) | 2026-03-19 CP-19 seal run |
| `pwsh -File ops/dev/tf.ps1 status` | EXIT 0 | 2026-03-19 CP-19 seal run |
| Swarm Phase 8 + SRE live rehearsals | DEFERRED (pre-production condition) | — |
| `pnpm run type-check` | PASS (exit 0) | 2026-03-19 post-O1 sweep rerun |
| `node --test phase83-tools.test.mjs` | PASS 56/56 (219ms) | 2026-03-19 post-O1 sweep rerun |
| `node --test phase85-tools.test.mjs` | PASS 22/22 (191ms) | 2026-03-19 post-O1 sweep rerun |
| `pnpm run security:scan` | PASS exit 0 | 2026-03-19 post-O1 sweep rerun |

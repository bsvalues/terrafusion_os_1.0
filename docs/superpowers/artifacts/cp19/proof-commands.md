# CP-19 Proof Commands

Date: 2026-03-19
Phase: CP-19
Gate: G10

## Baseline

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Targeted Go-Live Decision Checks

```bash
pnpm run governance:check
pnpm run ci:governance-proof
pwsh -File ops/dev/tf.ps1 status
```

## Conditional Commands

Run only when touched scope requires them.

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

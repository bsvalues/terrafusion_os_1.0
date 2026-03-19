# CP-18 Proof Commands

Date: 2026-03-19
Phase: CP-18
Gate: G9

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

## Conditional Commands

Run only when touched scope requires them.

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

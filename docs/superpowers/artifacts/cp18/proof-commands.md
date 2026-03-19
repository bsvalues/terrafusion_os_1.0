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
<cp18-security-closure-check-command>
<cp18-compliance-evidence-validation-command>
<cp18-vulnerability-register-verification-command>
```

## Conditional Commands

Run only when touched scope requires them.

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

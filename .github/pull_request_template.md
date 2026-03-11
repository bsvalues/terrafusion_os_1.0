## Summary

What changed?

Why was it needed?

## Scope

- [ ] core governance surface
- [ ] workflow / GitHub automation
- [ ] backend
- [ ] frontend
- [ ] operations / deployment docs
- [ ] documentation only

## Verification

List the exact commands, workflow runs, screenshots, or artifacts used to verify
this change.

```text
- pnpm run type-check
- node --test os-platform/core/tests/phase83-tools.test.mjs
- gh workflow run ...
- evidence artifact: ...
```

If you did not run something relevant, say so explicitly.

## Required Checks Awareness

This PR targets `main`, which currently requires:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

## Risk and Rollback

Risk level:

- [ ] low
- [ ] medium
- [ ] high

Rollback plan:

```text
Describe how to back this out if needed.
```

## Security

- [ ] no secrets committed
- [ ] no new hardcoded credentials or private endpoints added
- [ ] any required secret/env changes are documented below

Secrets or environment changes:

```text
None / list them here
```

## Deployment / Ops Notes

- [ ] no deploy impact
- [ ] staging impact
- [ ] production impact

If deployment behavior changed, note whether you also updated:

- [ ] `.github` workflow docs
- [ ] `os-platform/core/pilot/ops/hostinger-control-plane.md`

## UI Evidence

If UI behavior changed, include:

- screenshot or recording
- affected route or screen
- correlationId if debugging an error path

## Additional Context

Anything reviewers should focus on:

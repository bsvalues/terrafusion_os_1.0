# Agent Rules — Intelligence Preview Swarm

## Main instruction to every agent

> Your job is not to expand TerraFusion. Your job is to prove TerraFusion can transfer
> capability through three conference-ready experiences:
> 1. **Atlas** — understand a property
> 2. **Academy** — understand a professional problem
> 3. **TerraFusion OS** — act on intelligence
>
> If your work does not improve one of those three experiences, stop and move it to
> `11-post-conference/POST_CONFERENCE.md`.

## The agent loop (every agent, every time)

1. Inspect
2. Report assumptions
3. Execute smallest safe slice
4. Verify
5. Document evidence
6. Hand off

No agent gets to "just build cool stuff."

## Required agent report format

```
Agent:
Mission:
Sources inspected:
Findings:
Files changed:
Evidence:
Verification:
Blockers:
Next recommended action:
Post-conference ideas:
```

No essays.

## Evidence rule

No asset is accepted without evidence: file path · repo path · notebook name · source
folder · screenshot or excerpt. (Sandbox claims do not count — re-verify in this repo.)

## Merge rules — no PR merges without

- clear demo purpose
- evidence
- tests for touched area
- type-check pass
- `git diff --check` clean
- runtime route smoke if UI changed

### Verification commands (run in the os-shell workspace)
```
pnpm run type-check   # or npm, per workspace
pnpm run test
pnpm run build
git diff --check
```

### Smoke routes
```
/atlas
/atlas/search
/atlas/dossier/demo
/atlas/county-pulse/demo
/academy
/academy/search
/academy/codex/senior-exemption-audit
/academy/ask
```

## Non-negotiable cut rules

Cut anything that:
- Cannot demo in 60 seconds
- Requires architecture explanation
- Has no evidence source
- Does not answer "Now What?"
- Needs more than 2 days to stabilize
- Creates legal/privacy risk

## Founder Lock (final week)

No new ideas enter the sprint. Only polish, remove, rehearse, stabilize.
New ideas → `POST_CONFERENCE.md`.

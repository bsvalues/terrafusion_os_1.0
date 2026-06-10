# WO-0016 — Product gate: dock/top-bar deep sweep (launch-surface truth table) + G2 module-id alignment

- **Risk:** R2 (run tests + static checks; only docs written) · **Suite:** OS shell (verification lane) · **Agent:** Claude Code
- **Surface:** frontend launchSurface / shellTruthAudit vitest batches (deferred by WO-0005) + service-registry key ↔ shell moduleId alignment (G2 from WO-0014)
- **Goal:** Run the deferred deep batches, classify every failure mine-vs-fleet-vs-stale (the D-013 pinned-prose failure is known), and statically verify whether seeded registry keys (levy, trends, …) match the moduleIds AppFrame resolves. Evidence note; NO fixes in this slice.

## Files likely touched
- `docs/brain/evidence/WO-0016-dock-topbar-sweep.md` (new)
- `docs/brain/memory/**` (drift rows for real findings)
- `docs/brain/canon/next-queue.json` (advance queue)

## Allowed files
- `docs/brain/evidence/**`
- `docs/brain/memory/**`
- `docs/brain/canon/**`
- `wiki/**`

## Method
- Locate + run launch-surface / shell-truth vitest batches (`frontend/apps/os-shell/src/__tests__/**` launchSurface*, shellTruthAudit*, dock/topbar suites)
- Static G2: compare platform.json `ports` keys + seeded registry keys against `generatedModules.ts` ids / AppFrame `moduleId` call sites
- Classify failures: mine / fleet-owned (DO-NOT-EDIT or fleet-dirty files) / stale-contract

## Acceptance criteria
- [ ] Batch results recorded with counts; every failure classified
- [ ] D-013 failure re-confirmed as the known fleet item (or noted as changed)
- [ ] G2 verdict: aligned / misaligned with the exact key↔id table
- [ ] No source files modified; review-diff honest; proof PASS

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0016`
- `pnpm brain proof --workorder WO-0016`

## Rollback
- Docs-only; revert files.

## Stop conditions
- fixes require shell routing changes (R4) → record, escalate
- a forbidden file must be touched

## Non-goals
- No test retargeting, no component edits, no registry/module renames.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0016",
  "task": "Product gate: dock/top-bar deep sweep (launch-surface + shell-truth batches) + G2 module-id alignment, evidence only",
  "risk": "R2",
  "suite": "OS shell (verification lane)",
  "allowed_files": [
    "docs/brain/evidence/**",
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "wiki/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/**",
    "frontend/**",
    "backend/**",
    "scripts/**",
    "tools/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0016",
    "pnpm brain proof --workorder WO-0016"
  ]
}
```

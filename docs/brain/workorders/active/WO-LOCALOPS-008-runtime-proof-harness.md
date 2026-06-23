# WO-LOCALOPS-008 — Runtime Proof Harness (chain done-definition)

- **Risk:** R2 (runs commands, writes evidence; no feature code) · **Suite:** OS / TerraPilot · **Agent:** Claude Code
- **Surface:** evidence production. The chain is NOT done until this WO's report exists with real command output.
- **Goal:** Produce `docs/localops/LOCALOPS_RUNTIME_PROOF.md` covering: environment (localops profile + all flags), build proof (backend build or documented unrelated baseline failures e.g. D-001 file locks, frontend type-check/build, tests), shell proof (LocalOps opens in-shell, dock visible, profile shown), local provider proof (env-configured, health check, external blocked), local knowledge proof (sources returned, honest miss), diagnostic proof (read-only, redacted), trace proof (all 7 event types observed), safety proof (external/web/shell/mutation refused with safe-path explanations), final go/no-go verdict + known gaps + next-phase recommendations.

## Files likely touched
- `docs/localops/LOCALOPS_RUNTIME_PROOF.md` (new) — the checklist report, every box backed by a command + output tail
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (final append)
- `docs/brain/memory/**` (release-gates / drift rows as needed)
- possibly `os-platform/core/pilot/localops/__tests__/**` (proof-harness test glue only — no feature code)

## Allowed files
- `docs/localops/**`
- `docs/brain/memory/**`
- `docs/brain/canon/**`
- `os-platform/core/pilot/localops/__tests__/**`

## Acceptance criteria
- [ ] Every checked box cites the exact command and result (no "verified" without output)
- [ ] Refusal proofs show the refusal payload including the safe-path explanation
- [ ] Known baseline failures (e.g. D-001 build-lock) documented as unrelated, not hidden
- [ ] Verdict is honest: go / no-go with gap list — a no-go with truth beats a go with fiction
- [ ] `brain proof --workorder WO-LOCALOPS-008` PASS; evidence file written

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-008`
- `pnpm brain proof --workorder WO-LOCALOPS-008`

## Rollback
- Evidence docs only; revert.

## Stop conditions
- any proof step would require mutating production data or county systems → STOP
- a prior chain WO's deliverable is missing → return to that WO, do not paper over

## Non-goals
- No new features to make proofs pass; gaps get documented, not patched ad hoc.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-008",
  "task": "LocalOps runtime proof: full checklist report with real command output; go/no-go verdict",
  "risk": "R2",
  "suite": "OS / TerraPilot",
  "allowed_files": [
    "docs/localops/**",
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "os-platform/core/pilot/localops/__tests__/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/ai-systems/ai-systems/ai-swarm/**",
    "frontend/**",
    "backend/**",
    "os-platform/core/trace/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "tools/registry/terrapilot.tools.json"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-008",
    "pnpm brain proof --workorder WO-LOCALOPS-008"
  ]
}
```

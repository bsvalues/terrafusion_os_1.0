# WO-SR-006C - Forge Non-Production Persistent Runtime Adoption and Rollback Evidence

## Current state

`FORGE_NONPRODUCTION_PERSISTENT_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN`

Owner decision
`OWNER-SR-006C-R3-FORGE-NONPROD-PERSISTENT-ADOPTION-ROLLBACK-20260728` authorizes one bounded local
non-production persistent-selection rehearsal at sovereign base
`6f868cd6bd02fb29fbf544a6f8493e9e7fcec1a6` and exact Forge commit
`24059c3642339f36877cb454ca63683180915b71`.

## Delivery evidence

| Evidence | Result |
| --- | --- |
| Implementation PR | #1383 |
| Exact reviewed head | `eaa9890cc09c8ee32026b91aa6bcd53f96032cbd` |
| Squash merge | `bbacef062445ffdf30b9e5ce8c4f8b3664a765bd` |
| Forge source commit | `24059c3642339f36877cb454ca63683180915b71` |
| Forge execution artifact SHA-256 | `203003aa7c2ec577b23d7cd26c2017b343c070bed44aa439b4d21a4d4373d4e3` |
| Sovereign rollback artifact SHA-256 | `309df6a75191d7c60c1ba3c09902a9df63fbf85445a27fb2bd3660de167f4ac4` |
| Host A Forge selection | PASS |
| Host B Forge selection | PASS |
| Host C sovereign rollback | PASS |
| Accepted and typed fail-closed behavior | PASS in A, B, and C |
| Backend solution build | PASS - 0 warnings, 0 errors |
| Work Order query | PASS |
| Work Order tooling | PASS - 46/46 |
| Required remote checks | PASS |
| Substantive review threads | 0 unresolved |

## Boundaries proven

- A disposable on-disk configuration was written to select the exact locally built Forge artifact
  across two isolated host starts.
- That disposable configuration was rewritten to the unchanged sovereign artifact and restored
  sovereign selection in a third isolated host start.
- Exact selected-binary provenance, accepted behavior, and typed fail-closed behavior passed in all
  three starts.
- The process environment was restored and every disposable worktree, configuration, artifact,
  manifest, and log was removed.
- Canonical `appsettings*.json`, canonical and production runtime configuration, `backend/src/**`,
  the shared Forge checkout, deployment, source ownership, and `WO-SR-006` cutover did not change.

## Intentional non-claim

The Forge artifact hash differed from an earlier same-WO build, so the result is classified
`BINARY_HASH_CHANGED_REPRODUCIBILITY_NOT_CLAIMED`. The proof certifies exact provenance and behavior
for this execution; it does not claim byte-for-byte reproducible Forge builds.

The bounded authority is completed and consumed. No cutover or successor implementation authority
follows.

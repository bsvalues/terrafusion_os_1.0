# WO-SR-007A - Atlas Local Sovereign Shadow Projection Proof Evidence

## Current Result

`ATLAS_LOCAL_SOVEREIGN_SHADOW_PROJECTION_PROVEN_WITHOUT_RUNTIME_ADOPTION`

## Bound Identity

| Surface | Exact identity |
| --- | --- |
| Sovereign base | `12019bce0850b28ded91e5e820d0f54d202a14cc` |
| Atlas base | `6c530f1b6b77d59225353dede929c0688f1587da` |
| Atlas module | `src/spatial-read/project-atlas-feature.mjs` |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| Authority | `OWNER-SR-007A-R3-ATLAS-LOCAL-SHADOW-PROJECTION-20260729` |

## Phase 0

PR #1388 merged exact reviewed head `fb42c7c61f13ddc8196ea74e7eaf7b59ed8966c2`
as `30961af25ff5df6d32850ce265d6276f1324f68b`. The governance-only activation recorded the
decision, exact allowlist, denials, three-stage sequence, validation gates, and fail-closed
terminal condition.

## Phase 1 Evidence

| Gate | Result |
| --- | --- |
| Shared Atlas checkout | Clean and unchanged |
| Isolated source | Exact detached worktree at `6c530f1b6b77d59225353dede929c0688f1587da` |
| Source and copied-module hash | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| Focused proof | 13 passed, 0 failed, 0 skipped |
| Real adapter polygon | PASS |
| Synthetic point and unavailable | PASS; no adapter claim |
| Identity and geometry fail closed | PASS before Node |
| Cross-lane fields | Excluded from bounded input |
| Deterministic normalized output | PASS |
| Tampered copy | Rejected before execution |
| Network or install | None; local NuGet source and Node permission/network-denial boundary enforced |
| Disposable cleanup | Complete |
| Backend source/runtime adoption | None |
| Focused build | Invocation-owned artifact path; 0 warnings, 0 errors |
| Full backend solution build | 0 warnings, 0 errors |

The generated local manifest bound repository, commit, module path, source and copy hashes, Node
version, timestamp, and disposable paths. It and all disposable execution state were deleted by the
proof script after the assertions completed. The full backend solution build also passed with zero
warnings and zero errors. Review remediation made the script self-contained: it restores only from
the existing local NuGet package source, builds before testing in a unique invocation-owned
directory, deletes only that directory, and compares protected source plus untracked source state
to the authorized sovereign base. Node receives only proof-root filesystem permissions, cannot
spawn child processes or load addons, and has network built-ins plus global network APIs replaced
with fail-closed guards. Each Node invocation also has a 30-second deadline with process-tree
termination. PR #1389 merged exact reviewed head
`a41ead004c9ac8242660c4cc58b3db598c07e1e4` as
`3ff78dee1bde56b582bd1efeaca7cb38455edc99`; all required remote checks passed and substantive
review threads were zero.

## Terminal Closeout

The exact standalone Atlas module is proven through a local, disposable, hash-pinned sovereign
shadow path. No runtime consumer was registered, no configuration changed, no Atlas file changed,
and no provider, persistence, deployment, protected resource, ownership transfer, or cutover was
introduced. The bounded authority is completed and consumed when this governance-only closeout
merges. Portfolio reconciliation is then current.

## Rollback

Revert the governance activation before implementation, or revert the focused test, validation
script, and governance/evidence changes after implementation. No runtime, Atlas source, persistent
configuration, external resource, or production state changes.

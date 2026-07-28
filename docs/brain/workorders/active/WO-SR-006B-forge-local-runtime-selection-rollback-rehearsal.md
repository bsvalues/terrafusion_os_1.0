# WO-SR-006B - Forge Local Runtime-Selection and Rollback Rehearsal Gate

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded non-production process-local runtime rehearsal |
| Authority | `OWNER-SR-006B-R3-FORGE-LOCAL-RUNTIME-ROLLBACK-20260728` |
| Sovereign base | `0d1167fce6e887e1f49f4e75963f441e9f04ab06` |
| Forge proof commit | `24059c3642339f36877cb454ca63683180915b71` |
| Dependency | WO-SR-006A complete |
| Merge mode | Mode B, bounded exact scope |
| Terminal condition | `FORGE_LOCAL_RUNTIME_SELECTION_AND_ROLLBACK_REHEARSAL_PROVEN_NO_PERSISTENT_SWITCH` |
| Implementation PR | `#1380` |
| Exact reviewed head | `f23f97202e74376ae0fa82ded22f425026c65ce5` |
| Merge commit | `e1e249c9bb7eb7ea4bd5bc6dfdd0e345e88df230` |

## Objective

Exercise a locally built, hash-pinned Forge valuation kernel through the real sovereign
`ValuationKernelClient` to `RustKernelProcessHost` boundary, prove typed fail-closed behavior, and
reconstruct the client/host with the unchanged sovereign binary to prove rollback.

## Authorized Surfaces

- one isolated read-only Forge worktree at the exact authorized commit;
- one focused sovereign integration-test method;
- one disposable local validation script;
- the exact governance, Work Order, evidence, registry, and routing files named by the owner.

## Required Proof

1. Verify exact Forge commit and unchanged shared Forge checkout.
2. Verify all four frozen Forge source hashes.
3. Build the Forge and sovereign comparison binaries locally.
4. Record and verify a disposable manifest before execution.
5. Pass an accepted invocation through `ValuationKernelClient` and `RustKernelProcessHost`.
6. Pass a typed fail-closed invocation against the selected Forge binary.
7. Reconstruct the client/host with the sovereign binary and pass the accepted invocation.
8. Prove the reported binary hashes match the selected Forge and sovereign binaries.
9. Preserve `backend/src/**`, application settings, shared checkouts, and process environment.
10. Remove all disposable artifacts.

## Non-Claims

This Work Order does not switch persistent runtime configuration, deploy anything, retire source,
transfer ownership, authorize `WO-SR-006`, publish an artifact, access protected resources, or
modify any suite other than the test-only Forge integration boundary.

## Rollback

Revert this Work Order's test, script, evidence, and routing changes. The process-local rehearsal
restores its environment in `finally`, deletes its disposable directory, and leaves the sovereign
kernel as the unchanged configured runtime.

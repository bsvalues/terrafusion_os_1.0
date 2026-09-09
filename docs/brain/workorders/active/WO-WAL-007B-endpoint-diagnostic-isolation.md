# WO-WAL-007B — Explicit optional endpoint diagnostic isolation

## Current exact-source verification — 2026-09-09 15:32Z

Configured-port implementation is locally verified, pending independent final
review, normal gates and protected delivery. Initial setup-only compiler failure
CS1674 (three IConfigurationRoot using declarations) is retained separately at
`wal007b-port-red-3cc0f95cbc7747eaa9166292bd5bdee9`; it discovered zero tests and
is NOT behavioral RED. Only the added test lifetime syntax was corrected.

Normal WITH-build behavioral RED: 2026-09-09T15:27:51.7203924Z through
2026-09-09T15:28:10.5414061Z, native1,19discovered/8PASS/11expectedFAIL/0SKIP.
Five URL mismatches and six missing-exception failures; all original eight pass.
Leaf `wal007b-port-red-compiled-ed09aa1ad5aa437e83de8474e4a2ea07`.

Normal WITH-build GREEN: 2026-09-09T15:31:19.4301658Z through
2026-09-09T15:31:41.0266700Z, native0,19uniquePASS/0FAIL/0SKIP, nine input
pins continuous. Leaf `wal007b-port-green-e380d1d198e04f38a72fce8843411be9`;
TRX SHA256 `9c04b6d94c6ed8bf49e6e38f706ddff8920b6ede182167044875f7f7a1b4bfd7`;
result SHA256 `92321010e20dd842619ce9860e2373c890d33d0ea509fc2a3e3064e7aa8f18c5`.
Service `064bf6c8cfe461411a47c1c53eb77c699af5aedfe540893d9a745aec0579c32b`;
unchanged RED/GREEN test `b63186c3c27d1e58aead460db8bf8a765fd38a28a55ebbf56bd801054f628ee1`.
The original eight-case source is preserved. Parsing uses invariant integer
syntax, inclusive1–65535; malformed explicit values do not fall back. Only the
primary candidate changes; all other enabled probe/discovery behavior remains.

Initial normal Brain proof failed the inherited hardcoded5000 gate and is
archived byte-exact outside the repository as
`wal007b-original-failed-brain-proof-20260909.md`, SHA256
`049d8cb65f642d680cbaba28ded11ad3803518ec6c65bc9372c93ca45af828e5`.
This correction implements real configuration; it does not bypass the checker.
Earlier component/registration reviews are historical exact-source evidence;
final port/source assurance and refreshed normal gates are still required.
No API host, network sandbox, G acceptance or parent completion is established.

| Field | Value |
| --- | --- |
| Status | IMPLEMENTED_COMPONENT_GREEN_PENDING_PROTECTED_DELIVERY |
| Parent | WO-WAL-007 / issue #1485, Washington Assessor Launch V1 ACTIVE |
| Authority | OWNER-WAL-V1-MISSION-AUTHORITY-20260827, finite child decomposition and standing lifecycle |
| Risk | R3 bounded optional diagnostic lifecycle; no county data or auth change |
| Protected base | d6b4b0aab2d264cde97e67109e0b347369d191da |
| Contract | wal.endpoint-diagnostic.explicit-disable.v1 |
| Environment | local-in-memory-configuration-precancelled-service-only |
| Terminal | ENDPOINT_DIAGNOSTIC_EXPLICIT_DISABLE_PROVEN |

## Observed prerequisite defect

Independent G HTTP preflight traced the unconditional existing
EliteEndpointValidationService to fixed and netstat-discovered localhost probes
after its ten-second delay. Driver-only port restrictions do not constrain those
requests. This is source evidence, not proof that a prior host contacted anything.
G's actual host launch remains held. WACO/WO-103 acceptance is not reopened.

Existing service SHA256:
`ffe30cfa66ec5cfbbbd9666b71e7d35bbfaa718d4cd25cf8e5f44e7ce40b48be`.
Program is occupied by independent EO PRs #1573/#1575 and is NOT reserved here.
Fresh open-PR and worktree/source checks found no service/test collision.

## Exact current reservation

- `backend/src/TerraFusion.API/Services/EliteEndpointValidationService.cs`
- `backend/tests/TerraFusion.Unit.Tests/HostedServices/EliteEndpointValidationServiceTests.cs`
- `docs/brain/workorders/active/WO-WAL-007B-endpoint-diagnostic-isolation.md`
- `docs/brain/evidence/WO-WAL-007B-proof.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

Main owns both documentation paths, Git lifecycle and execution resources. The
builder initially owns ONLY the new test file. Main must inspect actual RED
before releasing the service edit. No compiler, host, DB, port or process-probe
execution is granted by this source-preparation release. No dependencies installed.
Canonical registry/wave integration is now serialized by Main in this worktree;
L's seven-path candidate remains frozen while its separate CI failure is diagnosed.
No other builder owns these two shared paths during this grant. Preserve L's
independent delta on later normal protected integration; do not copy its unmerged row.
Only the new 007B row and one exact-reservation regression are admitted. No existing
row, schema, planner or owner policy changes; no protected dispatch attestation.
This document records a bounded child of the existing authority, not another queue.

## Required behavior and finite tests

Introduce a NEW `EndpointValidation:Enabled` setting at the start of the existing
ExecuteAsync, using IConfiguration resolved through the already-injected provider.
Preserve constructor and Program registration. Missing setting or missing config
retains the existing enabled behavior; true retains it; false returns before the
first startup log/delay/probe. Invalid non-null text throws fixed
`ENDPOINT_VALIDATION_INVALID_ENABLED` before diagnostics. Do not log its value.
The existing host exception policy means this does not promise whole-host fail-fast.

Eight deterministic test cases use the real service, real configuration/provider,
capturing logger and an ALREADY-CANCELLED token for EVERY StartAsync invocation:
false/FALSE (2), absent/true (2), empty/invalid (2), absent IConfiguration (1),
ordered providers true then false (1). Assert completed/cancelled/faulted task and
existing startup log as appropriate. Enabled controls must preserve cancellation;
no swallowed cancellation, fake host, reflection, fake successful probe, listener,
sleep or timing race. The pre-cancelled original delay prevents any probe during RED.

Preserve existing enabled HTTP/process implementation, endpoint lists other than
the primary-port correction below, intervals, reporting and auth-required result
classification. No other enabled-mode network redesign.
Explicit false is opt-out isolation, not an all-host network sandbox. No setting
may be used by G until actual protected delivery and fresh source/build binding.

## Proof and continuation

Normal Unit.Tests WITH build, focused EliteEndpointValidationServiceTests selection;
independent source/receipt review; exact changed-path and diff checks; normal Brain
proof/review/commit-plan, hooks, required CI and protected merge. Main admits a
compiler only after current shared-resource coordination and >=8GiB free memory.
Preserve actual RED/GREEN artifacts and native exit, hashes and source continuity.
No fabricated successful runtime receipt, bootstrap, verifier or network evidence.

G then integrates the protected change normally and explicitly binds effective
false through its real config pipeline, rejecting later local overrides. Separate
logging qualification, six-module verification, real auth/DB/data provenance and
owned-runtime restart proof remain required. Parent007/008 and #1485 do not advance
from this child alone. Rollback is a normal reviewed source revert; no data repair.

## Forbidden writes

Program.cs, other services/controllers, Core/Data, auth/logging infrastructure,
appsettings, schema, migrations, projects/packages/locks, frontend, CI, Docker,
Wi-Fi, lab/owner services, G/L/K/EO source, real county payloads or secrets.

<!-- brain-machine-policy: existing Brain exact scope -->
```json
{
  "id": "WO-WAL-007B",
  "task": "Add explicit default-enabled diagnostic disable and configured primary port",
  "risk": "R3",
  "suite": "OS Core",
  "allowed_files": [
    "backend/src/TerraFusion.API/Services/EliteEndpointValidationService.cs",
    "backend/tests/TerraFusion.Unit.Tests/HostedServices/EliteEndpointValidationServiceTests.cs",
    "docs/brain/workorders/active/WO-WAL-007B-endpoint-diagnostic-isolation.md",
    "docs/brain/evidence/WO-WAL-007B-proof.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json",
    "docs/brain/workorders/tools/wo-wave-plan.test.mjs"
  ],
  "forbidden_patterns": [
    "backend/src/TerraFusion.API/Program.cs", "backend/src/TerraFusion.Core/**",
    "backend/src/TerraFusion.Data/**", "frontend/**", ".github/**",
    "package.json", "pnpm-lock.yaml", "backend/**/appsettings*.json"
  ],
  "required_proof": [
    "dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj -c Release --filter FullyQualifiedName~EliteEndpointValidationServiceTests",
    "git diff --check",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs docs/brain/workorders/tools/wo-wave-plan.test.mjs",
    "node scripts/brain/brain.mjs review-diff --workorder WO-WAL-007B",
    "node scripts/brain/brain.mjs proof --workorder WO-WAL-007B",
    "node scripts/brain/brain.mjs commit-plan --workorder WO-WAL-007B"
  ]
}
```
# Main execution progression — 2026-09-09

The earlier TEST_PREPARATION boundary is advanced narrowly to implementation of the already-reserved service file after actual RED. Normal restore exited 0. Independent test-preparation review is CLEAR. Main's normal WITH-build focused run on protected base `d6b4b0aab2d264cde97e67109e0b347369d191da` ran from `2026-09-09T14:43:47.5446114Z` to `2026-09-09T14:46:34.1227734Z`, native exit 1: **8 discovered, 3 passed, 5 failed, 0 skipped**. The failures are the expected three disabled-path and two malformed-setting assertions against the unchanged production service; compilation and discovery succeeded. Seven input pins remained unchanged.

External evidence: `wal007b-red-f1ed2afdd6274937b53e2f2e1e63a24d/focused.trx`, SHA256 `7b166c93afe74318afe551d7f21cae55715082024200475fbde8d0c53bc9018b`; run receipt `77ab08799151dd6e4663f7adbb57041eb0b96e7c06852d7b5d94c500df6840e1` in the Main evidence root. This is pre-cancelled component evidence, not host/network acceptance.

Builder may now edit only the already-reserved `EliteEndpointValidationService.cs` to implement the specified effective-configuration check before startup, preserving constructor and enabled behavior. Frozen tests must remain unchanged. Main retains normal compilation, GREEN, independent assurance and protected delivery. No API/DB/runtime launch, shared registry reservation, host privacy proof, parent completion or production readiness is authorized or claimed by this progression.

## Actual GREEN and serialized canonical admission

The service builder returned a +10/-0 change, SHA256 `3ab983b819ff7e66169807f90254a61345489c7ffddae0dfe0d84f2f30df1106`. Main's normal WITH-build run from `2026-09-09T14:51:58.4385144Z` to `2026-09-09T14:52:24.9242577Z` exited 0 with **8 PASS, 0 FAIL, 0 SKIP**, eight unique actual TRX test IDs, and all seven before/after input hashes unchanged. Tests stayed exactly the RED source. This later WO update does not rewrite the archived run's WO identity.

External leaf `wal007b-green-61adbaf88fb54f6795d9675d5d2ccb57`; TRX SHA256 `1077caa16d93a1e9c6e5ff6609f401f1fb1209d16259f08d30e7cecb1a131b21`, run receipt `4c6a2df09ab27e94e2a3d978ce025da0419ed4171289e99972983ad519fc521a`. Independent source/actual-receipt assurance is still pending at this update.

Main releases only the two canonical metadata paths listed above for admission of this child as `review`, not `complete` or newly runtime-dispatchable. Maintain its exact six-path policy, contract, environment, protected-ref guard and existing parent 007/008 blocked prerequisites. Record a meaningful missing-row registration regression before adding the row, then run the unchanged complete query/wave suite. This serializes mutable ownership; it does not wait unnecessarily for L's unrelated CI repair and does not erase L's unmerged registry delta. Normal independent review, hooks and protected checks remain required.

## Required gate correction: configured primary diagnostic port

Main's normal Brain proof at2026-09-09T15:13:29.552Z failed the existing hardcoded-port gate on the touched service's inherited primary `localhost:5000` candidate. All other Brain checks passed. The original failed proof is preserved. The checker requires TF_API_PORT-driven addresses; the existing API launch profile declares TF_API_PORT with fallback5046. No checker, exemption, comment-based suppression, string-obfuscation workaround or gate bypass is authorized.

Within the same reserved service/test paths, Main now admits the smallest genuine configuration correction: replace only the primary obsolete candidate with a loopback HTTP address derived from effective IConfiguration TF_API_PORT, default5046, accepting integer ports1–65535 and rejecting invalid explicitly supplied values with fixed ENDPOINT_VALIDATION_INVALID_PORT. Add a small internal pure resolver in the existing service, reachable through the API project's already-existing Unit.Tests friend assembly; do not change project/constructor/Program. Leave the other candidate URLs, dynamic discovery/netstat, intervals, HTTP behavior and diagnostic result classification untouched. The new explicit-disable early return still precedes all discovery and port resolution. This narrowly supersedes the earlier no-candidate-change requirement; it is not an enabled-mode network redesign or production runtime change.

First prepare the resolver as a byte/value-equivalent extraction of the old primary URL and add pure configuration tests, retaining all original eight lifecycle cases unchanged. Main must observe normal compiled behavioral RED against that extracted legacy behavior before releasing actual configurable-port implementation. Cover missing config/key, valid custom/min/max and malformed/empty/out-of-range ports without starting a host or probes. Earlier eight-case GREEN remains historical exact-source proof, not acceptance of this addition. Re-run the complete expanded focused suite and Brain gate, then obtain independent source/receipt review. Main pauses metadata writes during this new two-file builder interval; registry scope is unchanged. Required registry prose must be reconciled afterward without expanding paths or parent status.

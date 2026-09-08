# WO-WAL-003E — bounded Sync registration persistence proof

Status: LOCAL_BEHAVIOR_PROVEN / PROTECTED_DELIVERY_PENDING. Parent WO-WAL-003 and issue #1485 remain ACTIVE. This is not source authorization, production readiness or statewide completion.

## Candidate and actual execution

Base: `0733406fe9067f5d5e61c4a361951c1c3700a9c8`, branch `codex/wal003e-sync-registration-recheck`. The following runs tested reviewed uncommitted source at that base, not a later Git head. All used the normal existing Unit.Tests project and its thirteen-project dependency closure. No Integration test discovery or live source connection occurred.

| Actual run | UTC completion | Result |
| --- | --- | --- |
| RED34130 | 2026-09-08T11:58:01.3016503Z | EXIT1; one assertion failure, Expected Denied / Actual Completed at line652, after successful compilation. |
| Focused GREEN40534 | 2026-09-08T12:08:58.3218313Z | EXIT0; original unchanged regression passed,0 failed/skipped. |
| Full class98736 | 2026-09-08T12:26:52.0007611Z | EXIT0;34 passed,0 failed/skipped:21 recheck cases plus13 existing cases. |

RED was actual incorrect service completion after a committed deactivation during extraction, not compiler/setup/fixture timeout. Subsequent matrix cases have actual PASS evidence, not an invented separate RED history. Main and independent assurance inspected source, actual TRX counters/oracles and unchanged run pins and returned CLEAR for bounded delivery preparation.

## Behavior and limits

Within the existing persistence context and Serializable transaction, the guard requires exactly one active county connection, the original registration ID, the existing read-only PACS declaration and matching relevant configuration before SaveChanges or success updates. Denial leaves tracked candidates unsaved and publishes no success receipt. Existing imports, intentional registration edits, errors and normal audit records remain intact. No new wire contract, external call, schema, context or authorization bypass was introduced.

The precise guarantee concerns disqualifying registration changes committed during extraction, before persistence begins, that remain effective at its snapshot. It is not a latest-committed query, revoke-wins fence, ABA detector, post-snapshot revocation guarantee, external-role check or completed-import compensation. PostgreSQL concurrency and general atomicity are NOT_PROVEN.

The21 cases cover deactivation; delete/replace/ambiguity/county move; lost read-only/source/type; server/database/auth/username/options drift; populated/empty unchanged completion; descriptive-only and three foreign-only changes; prior-import preservation; and cancellation. Normal13 existing cases also passed. Denial/cancellation assertions use fresh-context durable snapshots after legitimate edits, preserving AuditLogs and absence of additional success AuditEvents, not globally empty audit storage. Allowed controls verify normal audit additions.

Fixtures use the existing SQLite application-context subclass and schema-prefix mapping, unchanged by this child. This is relational application behavior, not an unchanged PostgreSQL schema/migration. Only the external read adapter is mocked; configured source identities/permissions and application externalWrites=0 are not observed live-source or source-side no-DML evidence. All input identities/data are synthetic. Barriers release in finally with bounded completion/drain; actual runs had no fixture timeout. A timeout would remain a distinct failure, not proof the underlying task terminated.

## Exact source identity

| Input | SHA256 |
| --- | --- |
| Original service, RED | `23e564f48409782afef46ff45428c18d19c87e1fed704cf64d3eb84385657ea9` |
| Fixed service, both GREEN runs | `e72b536598a87d609b18dce39fbf2ba0dbc2abbf636a1bba616f2cf9a75c3c9b` |
| Original regression file, RED/focused GREEN | `9665feb6b79727d0ebe7435e261cdef77a42dec591099d208254aed692d22747` |
| Full-class test file | `363113bcad775a7a4d733dc66eb2b8ef4bba082a7416b66094d41719e7f95a81` |
| WO at RED | `243206eb0b187737e8e1d48e4687d33a2782b5e90baff932019d7a9bce7274e2` |
| WO at both GREEN runs | `8215194b651e86affff90718eb0930e99dbd0a254734cdc4402c2ea1072694ad` |

The current governance additions do not retag historical WO hashes. The receipts pin these three inputs; no additional DLL/dependency hash attestation is fabricated. Removing the single matrix insertion reconstructs the exact original test hash.

## Durable receipts

Root: `C:/Users/bsval/.codex/visualizations/2026/09/06/01a07732-71da-73f0-8651-896ec72d5be4`.

| Relative receipt | SHA256 |
| --- | --- |
| wal003e-validation-RegistrationRed-86cffeea7503412ab77ae72947ed6009/registration.trx | `56d6e1d8b82d4d1fb985db8a31052d9f9735884e18cc288ffb9fab6435a50adb` |
| wal003e-validation-RegistrationRed-86cffeea7503412ab77ae72947ed6009/raw.log | `dd4ead6edead4a8ff9788235397cd18898904a17b0b2965e542e18e308260f11` |
| wal003e-first-green-ed979a21cc8c4a7cb8fc369a65c2a401/first-green.trx | `2375b1c15641feac270c1246700b97443995e3b457e377af9c7751cd996cbbeb` |
| wal003e-first-green-ed979a21cc8c4a7cb8fc369a65c2a401/validation.txt | `ebe4316ed4139acec9440575db48066e39be5b8e0802db9fa23ba77d9be30f7d` |
| wal003e-full-class-matrix-89205ce600a14431917f14778abaedce/sync-full-class.trx | `143cd68195ff0e7d463986798a6c7d68274177a0a154754b8aa53de8c875c29a` |
| wal003e-full-class-matrix-89205ce600a14431917f14778abaedce/validation.txt | `f5633fd8c502bad2857bec9870c00d9fc13a4da3f34cc6eec3e6739086c9ad41` |

Detailed external draft `wal003e-proof-draft.md`, SHA256 `dc03348bbd70065f63ac17863219ebeecb739d5037ecc09d510937566211a928`, retains the complete case and fixture qualification record. It is supporting evidence, not independent work authority.

## Delivery and rollback

Normal clean checkpoint, current-base integration, exact committed-candidate validation, independent final review, required GitHub checks and protected merge remain outstanding. The shared registry remains H-owned until released. Source remains frozen while these steps proceed.

Code rollback is a normal reviewed revert of this service guard and associated tests/governance through protected delivery. No data deletion/reseed, compensating imports, audit removal or external-source mutation is part of rollback. Prior completed WAL003 children stay closed; this child does not supply actual source credentials, observed least privilege, production deployment or external-assessor acceptance. Parent mission completion remains exclusively subject to its unsatisfied terminal predicates.

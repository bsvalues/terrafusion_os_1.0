# ArcGIS Wave 2 Repair Authorization Packet

Generated: 2026-05-27T17:19:43.740Z

## Decision State

- State: READY_FOR_HUMAN_DECISION
- Execution enabled: no
- Approval required: yes
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Scope

- Included counties: Adams 53001, Chelan 53007, Clallam 53009, Douglas 53017, Franklin 53021
- Excluded counties: 

## Summary

- Proposed rows: 180783
- Duplicate groups after projected repair: 0
- Dry-run hash: 2572298d84f8b1004ae285b5299b0ad1043bd535f823ef857e692ec4cf59fc39:99da815d7fb012c050b1cd6944ec006dcd9880dd6cc5d7cfe3702beed54b1557:a10dba3a79f0143ab85c94a7ba0ae80dd562b395013eb972cca5058519c0b4eb:1a4d3ad5f619cff3ec49f0037bbeb330a1a334ae136e4b3cd3064ba492320c79:2da6fa4eb2a1771c96bbe83c908ab6f0bc86403015ea6327632958fac4282128

## County Matrix

| County | FIPS | Proposed rows | Duplicate groups after | Source hash | Proposed rows hash |
| --- | --- | ---: | ---: | --- | --- |
| Adams | 53001 | 13324 | 0 | d52f7134be7c872a19e2681b73130bd73bf631494eff0fc0f6a931ff162877b2 | 62b8bf7b994e7b38313e0e54515c3a6fda0c69e0f9a395036354592e7fc9200a |
| Chelan | 53007 | 48640 | 0 | 669a35b9f6f59663dd7cf754c66c6a3ecbad3ba56d406b92316b51f58ae0b524 | b434bb54391fb3020b6be3ff314bdca57a87872ce318b17b19739a42e0435cca |
| Clallam | 53009 | 54516 | 0 | 3538707cce4aa90609caddbda90eb9babee0c0c212885fa97c1aa8c527e672ea | 2d11db3457083618140efaa22aca4e4224186782271248613e977c44e9138e5a |
| Douglas | 53017 | 29778 | 0 | 248597bc4350ee26a2b14d873129b64b2d58c2890d5e23846b7dded044e89166 | 2d1289fe2cdeafeae9e72c1d2b0a3595c7439912fe9b8cd1db7229bc1460098e |
| Franklin | 53021 | 34525 | 0 | 736e7e981c3f6a8f5b8707d90820aee469a0af145ba74b745a033f2d875c14f5 | f143cdd86cd657117b478c74decb042bae542477244fbb5dbc446e88fb2d0b07 |

## Post-Repair Audit Commands

- verify CountyId + ParcelNumber duplicate groups = 0 for each repaired county
- verify LegacyImportedParcelKey preserves previous PARCEL_ID_NR values
- verify TerraFusionParcelKey is populated as FIPS:ORIG_PARCEL_ID
- rerun ArcGIS Wave 2 source capture comparison
- rerun WA_INITIAL_SEED receipt reconciliation
- rerun production DB binding plan; production binding must remain blocked until all required receipt posture is acceptable

## Stop Conditions

- Stop if any artifact hash differs from this packet.
- Stop if source capture evidence is regenerated before execution.
- Stop if dry-run evidence is regenerated before execution.
- Stop if worktree contains unrelated changes.
- Stop if tests or type-check fail.
- Stop if backup snapshot cannot be created.
- Stop if transaction cannot run as one bounded unit.
- Stop if post-repair duplicate groups are not zero.
- Stop if Garfield is accidentally included.

## Forbidden Claims

- no_production_binding
- no_certification_claim
- no_runtime_promotion
- no_workflow_complete_claims
- no_garfield_repair
- no_deletes

## Blockers

- None

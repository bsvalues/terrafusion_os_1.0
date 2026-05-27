# ArcGIS Wave 1 Repair Authorization Packet

Generated: 2026-05-27T15:54:55.171Z

## Decision State

- State: READY_FOR_HUMAN_DECISION
- Execution enabled: no
- Approval required: yes
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Scope

- Included counties: Columbia 53013, Ferry 53019, Pend Oreille 53051, Wahkiakum 53069
- Excluded counties: Garfield 53023: garfield_blank_source_native_delta_hold

## Summary

- Proposed rows: 34536
- Duplicate groups after projected repair: 0
- Dry-run hash: 5ba6cfc97fe601e3832fd3d5d25a7a5ed16ed013cb338da3f12c85e438eca3b0:d54c8946ef1a9eb1d9692cb78d2082202c9e8c80e2f93664b0edb6815cb58325:0e1a220e3830d67ae97c4b4ed6d3d30d14f7e8b86b745d06168b792f954419e5:6af9aeda7773da2b0414de15c35a68c2efb651b80a7fe82614025927a8523a63

## County Matrix

| County | FIPS | Proposed rows | Duplicate groups after | Source hash | Proposed rows hash |
| --- | --- | ---: | ---: | --- | --- |
| Columbia | 53013 | 5280 | 0 | 4d3e83ea2f0844d7488202b3f521370cb14510a50e4b31d7ecd8cfbbdc7d1027 | a61da0637e3dfa5e34bbd88b07352c669880421e9b9624ce6c44dfc4f73f2d04 |
| Ferry | 53019 | 9195 | 0 | 44385e42e868f962b495ea4eafdc223988e966a1148353aa0f1f81113ff57555 | b2c8f57b7e2b49442205e802264803d1cb1a356eb8f1e089c5a78436e1874735 |
| Pend Oreille | 53051 | 15633 | 0 | 219749131e11c3884bf134795ead5004b03b77ebf45f55b7bc0bc567d075c2db | 95f6471151ab2905328b101faab5b79ee2cadaf7a2a78d73c1088acbe0c24974 |
| Wahkiakum | 53069 | 4428 | 0 | 43b8fbf59cae5f1ce6115a534704ad38493b1af1936f0b155f8575a4a895d4b8 | 672a1a88b747cb31addebdf7f49d34b60ea195e428005d50cdd3ba456780bbc7 |

## Post-Repair Audit Commands

- verify CountyId + ParcelNumber duplicate groups = 0 for each repaired county
- verify LegacyImportedParcelKey preserves previous PARCEL_ID_NR values
- verify TerraFusionParcelKey is populated as FIPS:ORIG_PARCEL_ID
- rerun ArcGIS Wave 1 source capture comparison
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

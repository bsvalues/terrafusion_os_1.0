# WO-SR-005A - Forge Bounded Extraction and Provenance Closeout

## Verdict

`COMPLETE_WITHOUT_CUTOVER`

The smallest contract-backed Forge valuation slice was copied to the protected Forge repository with
byte provenance and standalone parity. The sovereign source remains unchanged and authoritative.

## Exact evidence

| Field | Value |
| --- | --- |
| Sovereign source SHA | `5ba8fb393ade13e6008dd59849996dd28ec8bfca` |
| Source path | `packages/terrabuild/kernels/terraforge.kernel.valuation/**` |
| Destination repository | `bsvalues/terrafusion-forge` |
| Destination PR | `https://github.com/bsvalues/terrafusion-forge/pull/1` |
| Reviewed head | `7bb0fe28e6fd291b8735caae5055be65aa92bd70` |
| Destination merge | `2430b483f20e07a6ff9a66e493caab0e39db64ef` |
| Contracts | `forge.valuation@1.0.0`, `crosscut.audit@1.0.0` |

## Validation

- Source unit tests: 2 passed, 0 failed.
- Destination unit tests: 2 passed, 0 failed under committed `Cargo.lock`.
- `Cargo.toml`, `build.rs`, and `src/main.rs` SHA-256 values match source exactly.
- Forge required checks `suite-ci`, `contract-compat`, and `governance-gate`: passed.
- Review threads: 0 unresolved.
- Source deletion or move: none.
- Ownership cutover or package publication: none.

Destination evidence is canonical at
`operations/evidence/WO-SR-005A-FORGE-VALUATION-KERNEL-PARITY.md` in merge
`2430b483f20e07a6ff9a66e493caab0e39db64ef`.

## Remaining boundary

Canonical ownership transfer and duplicate retirement remain deferred to `WO-SR-006` after all
suite-specific extraction gates are satisfied. This closeout grants no deletion or cutover authority.

## Next

`WO-SR-005B-P - Atlas Contract and Parity Gate Preparation` is admitted as a read-only/docs evidence
slice. Atlas extraction remains blocked until that preparation proves a genuine contract boundary and
standalone map parity gate.

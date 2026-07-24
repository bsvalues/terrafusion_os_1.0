# WO-SR-005D-E2 - Dossier Standalone Synthetic Contract Parity Evidence

## Result

`PASS - DOSSIER_STANDALONE_SYNTHETIC_CONTRACT_PARITY_PROVEN`

## Merged Delivery

| Item | Evidence |
| --- | --- |
| Sovereign E1 | PR #1360 / merge `b0cdf8299a9fe6c18e2fc055dc4b5f1730063131` |
| Standalone repository | `bsvalues/terrafusion-dossier` |
| Standalone PR | `https://github.com/bsvalues/terrafusion-dossier/pull/1` |
| Exact reviewed head | `88b7c7f26b0638db9f02a317f17ed847c66da8b1` |
| Standalone squash merge | `dcd8a1a3066101597bcc64de1d9bf60ee7f8e9cf` |
| Frozen source SHA | `cfcd460d6387c7dc5aefbc83a389e74333cf0201` |
| Contract | `dossier.evidence-registry-read@1.0.0` |
| DTO SHA-256 | `414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f` |

## Proof

- 12/12 frozen artifacts match the sovereign SHA-256 manifest.
- Three positive fixtures pass exact county, parcel, pagination, ordering, vocabulary, timestamp,
  and privacy semantics.
- Eight negative fixtures fail closed with the recorded `SCHEMA`, `COUNTY_MISMATCH`,
  `PARCEL_MISMATCH`, `DUPLICATE_ID`, `ORDERING`, or `PAGINATION` class.
- Six standalone verifier tests pass, including tamper rejection.
- Protected `suite-ci`, `contract-compat`, and `governance-gate` checks pass.
- CodeRabbit completed with zero unresolved threads.

## Authority Closeout

The bounded Dossier E1/E2 R3 envelope is complete and consumed. It granted no direct extraction,
runtime adoption, persistence, custody mutation, provider access, package publication, deployment,
production, cutover, or F1 authority. No such capability is claimed.

## Rollback

Revert Dossier PR #1 to remove the mirrored contract corpus and verifier and restore the bootstrap
contract declaration and constrained job. Revert sovereign PR #1360 to remove the unwired adapter.
No product, custody, data, or runtime rollback is required because neither E1 nor E2 introduced one.

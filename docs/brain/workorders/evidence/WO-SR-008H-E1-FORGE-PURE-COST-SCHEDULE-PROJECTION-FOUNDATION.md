# WO-SR-008H-E1 - Forge Pure Cost Schedule Resolution and Modifier Projection Foundation Evidence

## Result

`IMPLEMENTATION_COMPLETE_PENDING_REMOTE_GATES`

At sovereign base `2561e2d060612e38dfd6afbb0d070268468c7517`, the bounded implementation creates
one pure schedule projection and one focused synthetic test corpus. No runtime consumer, integration,
persistence, provider, deployment, protected resource, or external state changed.

## Product evidence

`ForgeCostScheduleProjection.Create` accepts only caller-supplied `CostFactorSet`,
`DepreciationSchedule`, an exact `ForgeCostSchedulePin`, raw improvement class, positive size, and
nonnegative age. It returns only:

```text
BaseRate: decimal
DepreciationRate: decimal
```

The implementation performs no catalog or database lookup and has no controller, HTTP, provider,
service, DI, process-host, kernel DTO, or runtime dependency.

## Fail-closed proof

Focused tests prove:

- both WO-SR-008H known-answer SHA-256 vectors;
- order-independent hashes, equal-value/different-scale decimal hash equality, and fixed-point
  encoding of tiny decimals without exponent notation;
- mutation-sensitive semantic hashes;
- exact county, year, schedule ID, and opaque version validation before factor-row reads, followed by
  structural row validation and exact semantic-hash pin validation;
- lexical-version rejection rather than latest-version selection;
- raw `OrdinalIgnoreCase` class matching without trim or vocabulary invention;
- unique narrowest, minimum-only, maximum-only, and unbounded-band semantics;
- equal-specificity cost and depreciation ambiguity rejection;
- missing-band, invalid-bound, non-positive rate, invalid fraction, row-parent, duplicate-row, and
  unknown-origin rejection;
- deterministic results after input row shuffling;
- an output surface with exactly `BaseRate` and `DepreciationRate`.

## Validation evidence

| Gate | Result |
| --- | --- |
| Focused projection tests | PASS - 40 passed, 0 failed |
| Cost known-answer SHA-256 | PASS - `a5eab9a2f0740cc1c16ba835654b41d97fa964e4aff5449de503b5cf479ca9f2` |
| Depreciation known-answer SHA-256 | PASS - `2902186c7f8bf833d4153de57f1ead1d2a16c39c1cc8da78689cb0cfa75197a4` |
| Backend Release build | PASS - 0 warnings, 0 errors |
| Work Order query/planner | PASS - query output valid; 41 tests passed |
| Frozen bootstrap invariants | PASS - package and lockfile SHA-256 unchanged; ignored `node_modules` only |
| Exact changed/blocked paths | PASS - exact 12-file amended allowlist; no blocked paths |
| Package and lockfile integrity | PASS - SHA-256 unchanged |
| Remote required checks | PENDING - amended head not yet pushed |
| Independent exact-head assurance | PENDING - amended head not yet reviewed |

## Safety and nonclaims

- Runtime and DI wiring: none.
- Catalog, database, persistence, or migration access: none.
- Kernel DTO mapping or decimal-to-double conversion: none.
- Quality, condition, land, neighborhood/location, obsolescence, or arbitrary modifiers: none.
- County, PACS, SQL, credentials, secrets, live services, deployment, and production: untouched.
- Property Workbench and live parcel journey readiness: not claimed.

## Consolidated Forge consumer completion packet

E1 closes the schedule-resolution foundation. The minimum remaining path to an actual canonical
Forge runtime consumer is one coherent, separately authorized implementation envelope, not another
chain of isolated documentation slices:

1. **Numeric boundary:** define and prove the one decimal-to-double conversion/rounding policy at the
   frozen kernel DTO edge; retain decimal truth before that edge and reject non-finite output.
2. **Identity and permission boundary:** accept authenticated county, parcel, valuation invocation,
   schedule-pin, and authorized-operation assertions from the sovereign host; fail closed on missing
   or mismatched identity and never authorize inside the projection or kernel adapter.
3. **Trace boundary:** create one correlation/trace envelope that records invocation identity,
   schedule hashes, kernel artifact/source identity, accepted/denied state, and response hash without
   logging protected parcel content.
4. **DTO mapping boundary:** map the E1 decimal result and separately proven valuation facts into the
   frozen Forge kernel request with no fallback modifiers, default schedules, or inferred identity.
5. **Consumer adoption boundary:** register one county-scoped sovereign consumer behind the existing
   runtime ownership/configuration boundary, prove shadow parity and fail-closed behavior, then make
   any configured switch separately reversible. The first live parcel journey remains blocked earlier
   by authenticated parcel-data acquisition and is not solved by this consumer alone.

### Recommended smallest coherent sequence

```text
Stage 1: one pure consumer-boundary assembly covering numeric conversion,
         identity/permission assertions, trace envelope, and frozen DTO mapping
Stage 2: one unwired/shadow sovereign consumer using the existing canonical Forge process host
Stage 3: one reversible non-production adoption proof, only if separately authorized
```

The next decision should authorize or reject that consolidated sequence with exact files. It should
not admit another audit/decomposition Work Order unless implementation reveals a concrete technical
contradiction. Runtime adoption, authenticated parcel acquisition, deployment, production, and
protected resources remain outside E1.

## Rollback

Revert the exact E1 source, test, and governance/evidence changes. There is no external or runtime
state to restore.

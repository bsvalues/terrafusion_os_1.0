# WO-WAL-001F — Public-Source Connector Truth

| Field | Value |
| --- | --- |
| Status | `READY` |
| Parent | `WO-WAL-001` |
| Program | Washington Assessor Launch V1 |
| Risk | R3 bounded public-source health-truthfulness implementation |
| Terminal condition | `CENSUS_PUBLIC_SOURCE_HEALTH_OBSERVED_FAIL_CLOSED_AND_UNIMPLEMENTED_FETCH_REFUSED` |

## Objective

Make the `census-acs` public-source connector report health only from an observed bounded probe, so
that no connector in the `IDataConnector` family can publish a healthy public source that cannot
serve data, and so that an unimplemented read is refused instead of being returned as an empty
success that a caller could present as acquired public data.

This is the smallest honest child of the open `WO-WAL-001` public-baseline parent. It claims no
acquisition, no registration, no county data and no runtime capability.

## Exact reservations

- `backend/src/TerraFusion.Data/Connectors/CensusConnector.cs`
- `backend/tests/TerraFusion.Unit.Tests/Connectors/CensusConnectorTruthTests.cs`
- `docs/brain/workorders/active/WO-WAL-001F-public-source-connector-truth.md`
- `docs/brain/workorders/evidence/WO-WAL-001F-PUBLIC-SOURCE-CONNECTOR-TRUTH.md`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

No other path, contract or environment is reserved. In particular this child does not reserve
`docs/brain/workorders/tools/**`, any other connector file, or any runtime registration surface.

## Contract

1. `TestConnectionAsync` performs exactly one bounded probe against the configured source and returns
   `false` — never `true` by configuration alone — when the API key is absent, the base URL is absent,
   the source redirects to a Census key-rejection page, the response is non-2xx, the payload is not a
   Census data array, or the source is unreachable within the probe timeout.
2. `ConnectAsync` derives `IsConnected` from that observed probe, so a source that was not observed
   reachable leaves the connector disconnected.
3. `FetchAsync` fails closed: it returns a faulted task with an explicit `NotSupportedException`
   rather than an empty collection, because an empty collection is indistinguishable from a
   successful read of a source that has no rows.
4. `IsSourceRejectionUri` is public and pure so the key-rejection pages — which Census serves after a
   redirect with a success status — are detectable and directly testable offline.
5. No constructor signature, DI registration, interface, schema metadata, other connector, endpoint,
   or runtime behavior is changed.

## Denials

No network acquisition authorization, no source registration or DI wiring, no credential, secret or
protected-data access, no county data, PACS, CAMA, GIS or Sync access, no external write, no schema
or capability claim, no production or deployment action, no change to any connector other than
`census-acs`, and no fabricated readiness or completeness evidence of any kind.

## Validation

- focused offline xunit proof for observed fail-closed health, refused connect, refused fetch and
  key-rejection detection, executed by the protected .NET test contexts;
- Work Order schema, dependency and status-transition validation through the registry tools;
- exact seven-path audit and `git diff --check`;
- no external network dependency in any test: the unreachable-source case targets a closed loopback
  port only.

## Evidence

`docs/brain/workorders/evidence/WO-WAL-001F-PUBLIC-SOURCE-CONNECTOR-TRUTH.md` records the observed
starting defect on protected main, the live public-source probe result, the scope boundaries, and the
exact change made.

## Completion

Protected completion closes exactly this child. It does not complete `WO-WAL-001`, does not register
any connector in DI, and does not establish any state, capability, ingestion, geometry or endpoint
coverage for any county.

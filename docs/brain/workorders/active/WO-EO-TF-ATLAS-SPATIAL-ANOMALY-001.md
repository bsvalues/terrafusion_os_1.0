# EO-TF-ATLAS-SPATIAL-ANOMALY-001 exact exchange specification

Authority: owner's EO, COMMON.md, contract-authority.md and reservations.md. Mechanical OS alias: WO-EO-TF-ATLAS-SPATIAL-ANOMALY-001. This specification records the approved new exchange before implementation; it is not a protected schema mirror or a claim of protected provenance. Carry into the reserved OS Work Order after checkout readiness.

Canonical function: `judgeSpatialAnomaly(input)` exported from Atlas `src/spatial-anomaly/judge-spatial-anomaly.mjs`. Synchronous, dependency-free, pure JSON-in/JSON-out, no mutation, clock, random, provider, persistence, authorization, valuation or HTTP code. Contract `atlas.spatial-anomaly`, version `1.0.0`. Frozen spatial-read remains unchanged.

## Input (closed objects; every listed field required)

```
{
  contract: "atlas.spatial-anomaly",
  version: "1.0.0",
  request: {
    countyId: string,
    taxYear: integer,
    geography: { kind: "county" | "neighborhood", id: string },
    metric: "residual_cluster" | "prd" | "prb" | "cod"
  },
  materialized: {
    countyId: string,
    taxYear: integer,
    geography: { kind: "county" | "neighborhood", id: string },
    sourceState: "AVAILABLE" | "INSUFFICIENT_DATA" | "UNAVAILABLE",
    sample: { total: integer, used: integer, excluded: integer },
    observations: [{
      observationId: string,
      parcelId: string,
      countyId: string,
      taxYear: integer,
      clusterId: string | null,
      residual: finite number,
      percentResidual: finite number,
      sourceRef: string
    }],
    sourceRefs: [{
      id: string,
      countyId: string,
      taxYear: integer,
      geography: { kind: "county" | "neighborhood", id: string },
      endpoint: "/api/terraforge/regression",
      responseSha256: lowercase 64-character hexadecimal string,
      modelId: string
    }]
  }
}
```

Identifiers: nonempty trimmed strings, <=256 UTF-16 code units, no control characters. Year 1900..2200. Sample fields nonnegative safe integers <=100000; total = used + excluded. At most 100000 observations and 32 source references. OS process transport may impose a smaller byte limit. Source references have unique IDs; observation IDs unique across the request. Distinct observations for the same parcel are permitted, but cannot inflate cluster support: each cluster's eligibility and support count distinct parcels, with a parcel supporting one sign only when all its observations in that cluster meet the threshold and have that sign. A parcel cannot belong to multiple nonnull clusters in one input. Empty arrays permitted.

County and year must match request, materialized data, every observation and source reference. Materialized/source geography must exactly equal requested geography. County geography ID equals countyId. Neighborhood selection requires every observation clusterId equals selected neighborhood ID. County selection may contain null clusterId (unassigned); these remain counted in input sample but never become an invented cluster. Each observation sourceRef resolves to a listed source. AVAILABLE requires used = observations.length and at least one source ref; INSUFFICIENT_DATA likewise requires used = observations.length and at least one source ref (including a real empty source). UNAVAILABLE requires no observations, used=0, and may omit source refs. When percentResidual is nonzero its sign must equal the residual sign. A percentage rounded to zero by the existing source is accepted as non-supporting even if the residual is nonzero. No ratio calculation or consistency magnitude recomputation is performed.

OS supplies stable observation IDs from actual source records, or source-response digest and observation index when the endpoint supplies no record ID. Model identity is the digest of returned model detail, not an invented protected source commit. responseSha256 hashes the exact response bytes retained by the OS source evidence mechanism; the suite validates format and references but cannot independently authenticate or recompute those bytes. modelId for an insufficient response identifies its actual no-model response. No protected source SHA is guessed.

## Output (all fields present)

```
{
  contract: "atlas.spatial-anomaly", version: "1.0.0",
  status: "OK" | "INSUFFICIENT_DATA" | "UNAVAILABLE",
  reason: "CLUSTERS_FOUND" | "NO_CLUSTER_FOUND" | "SOURCE_INSUFFICIENT"
    | "SOURCE_UNAVAILABLE" | "FIT_SAMPLE_TOO_SMALL" | "CLUSTER_SAMPLE_TOO_SMALL"
    | "UNSUPPORTED_METRIC" | "INVALID_INPUT" | "SCOPE_MISMATCH",
  request: <detached validated request> | null,
  sample: { total: integer, used: integer, excluded: integer } | null,
  finding: { type: "RESIDUAL_CLUSTER" | "NO_RESIDUAL_CLUSTER", clusters: [{
    clusterId: string, sampleSize: integer, supportCount: integer,
    direction: "positive" | "negative",
    confidence: { kind: "EVIDENCE_SUPPORT_FRACTION", value: number }
  }] } | null,
  severity: "medium" | null,
  quality: {
    state: "SUFFICIENT" | "INSUFFICIENT" | "UNAVAILABLE",
    unclusteredCount: integer, excludedCount: integer
  },
  confidence: { kind: "EVIDENCE_SUPPORT_FRACTION", value: number } | null,
  affectedParcelIds: string[], affectedObservationIds: string[],
  hotspotCount: integer,
  actionCategory: "REVIEW_SPATIAL_SOURCE" | "NONE" | "COLLECT_DATA" | "RESTORE_SOURCE",
  sourceRefs: <detached validated source refs sorted by id>,
  policy: {
    id: "tf-residual-cluster-advisory-v1",
    minimumFitSample: 5, minimumClusterSample: 3,
    absolutePercentResidual: 20,
    minimumSupportNumerator: 2, minimumSupportDenominator: 3,
    interpretation: "TERRAFUSION_ADVISORY_NOT_STATISTICAL"
  }
}
```

Policy lives only in Atlas source. A fit needs at least five actual observations AND five distinct parcels, and a cluster at least three distinct parcels. A parcel supports a direction when all its cluster observations have that sign and absolute percentResidual >=20. A cluster is flagged if >=2/3 of its distinct parcels support the same direction (inclusive boundary). Hotspot count counts qualifying supplied neighborhoods. Affected IDs include only supporting parcels/observations. Overall confidence is sum of supporting parcels / sum of distinct parcels across flagged clusters, explicitly an evidence-support fraction, never a calibrated probability or significance test. No finding severity is emitted without a flagged cluster; one or more flags have advisory medium severity, not a legal/compliance determination.

Malformed input returns UNAVAILABLE/INVALID_INPUT, no request/sample/finding/source/affected data. Valid shapes with any scope mismatch return UNAVAILABLE/SCOPE_MISMATCH with the same redaction. Unavailable results never invent observations or hot spots. Unsupported metrics return UNAVAILABLE/UNSUPPORTED_METRIC after full input validation. Valid source unavailable takes SOURCE_UNAVAILABLE precedence over sample insufficiency; source insufficient takes SOURCE_INSUFFICIENT. Insufficient sample/cluster returns no finding and COLLECT_DATA. Adequate evaluated data with no flag returns OK/NO_CLUSTER_FOUND, NONE, null confidence/severity. Arrays use ordinal string order, no locale-sensitive ordering. Input order does not affect JSON result. Output does not alias input objects. Unknown object fields are rejected.

## TDD and delivery

Existing baseline 11/11 and frozen artifact parity PASS. New tests exercise real pure function with explicitly synthetic in-test values: positive/negative/boundary/nonclustered residuals, sample and cluster insufficiency, unavailable/unsupported inputs, invalid types/duplicates/nonfinite values, all scope mismatch dimensions, repeated-parcel support, source reference integrity, closed shapes, deterministic ordering and immutability. No county records enter the suite repository.

Canonical suite must be independently reviewed and protected first. OS then stages exact protected artifact with truthful provenance and invokes it from authorized real regression retrieval; no duplicate judgment. Source inspections, scope switching/stale results, insufficient data, source failure and reload must pass in the actual authorized nonproduction browser candidate, then critical journeys repeat after OS merge. No library/CI-only COMPLETE claim.

## Exact reserved suite paths

- src/spatial-anomaly/judge-spatial-anomaly.mjs
- test/judge-spatial-anomaly.test.mjs
- operations/work-orders/EO-TF-ATLAS-SPATIAL-ANOMALY-001.md
- operations/evidence/EO-TF-ATLAS-SPATIAL-ANOMALY-001.md
- canon/CONTRACT_DEPENDENCY.md
- .github/workflows/suite-ci.yml
- .gitattributes

These seven paths are exclusive to the Atlas builder under reservations.md. No subagents, push, merge, publication or foreign checkout writes. Coordinator owns independent review, protected lifecycle and shared OS hooks. The suite module contains no imports or transitive dependencies. Inventory binds the actual protected commit and SHA-256 of this complete specification document and the module; no self-referential commit hash is embedded. Existing frozen contract corpus and gates remain intact.
